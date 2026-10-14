'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { one, query } from '@/lib/db';
import { tx, nextNumbers, notifyPic } from '@/lib/visits';
import { getSession, assertPerm, audit } from '@/lib/auth';
import { todayKey, localToDate } from '@/lib/time';
import { getSettings } from '@/lib/settings';

const clean = (v, max = 200) => (v == null ? '' : String(v).trim().slice(0, max));

function validate(fd, { schedule = false } = {}) {
  const data = {
    name: clean(fd.get('name'), 120),
    institution: clean(fd.get('institution'), 150),
    phone: clean(fd.get('phone'), 20).replace(/\s+/g, ''),
    email: clean(fd.get('email'), 150) || null,
    purpose: clean(fd.get('purpose'), 80),
    picId: Number(fd.get('picId')) || null,
    notes: clean(fd.get('notes'), 500) || null,
    date: clean(fd.get('date'), 10),
    time: clean(fd.get('time'), 5),
  };
  const errors = {};
  if (data.name.length < 3) errors.name = 'Nama lengkap minimal 3 karakter.';
  if (data.institution.length < 2) errors.institution = 'Instansi / perusahaan wajib diisi.';
  if (!/^(\+62|62|0)8[0-9]{7,12}$/.test(data.phone)) errors.phone = 'Nomor HP tidak valid (contoh: 081234567890).';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Format email tidak valid.';
  if (!data.purpose) errors.purpose = 'Pilih tujuan kunjungan.';
  if (schedule) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) errors.date = 'Pilih tanggal kunjungan.';
    else if (data.date < todayKey()) errors.date = 'Tanggal tidak boleh di masa lalu.';
    if (!/^\d{2}:\d{2}$/.test(data.time)) errors.time = 'Pilih jam kunjungan.';
  }
  if (fd.get('consent') !== 'on') errors.consent = 'Anda perlu menyetujui pemrosesan data kunjungan.';
  return { data, errors };
}

/** Pendaftaran langsung (walk-in) oleh pengunjung atau resepsionis. */
export async function registerVisit(_prev, fd) {
  const isStaff = fd.get('source') === 'admin';
  const staff = isStaff ? await assertPerm('visits.write') : null;
  const { data, errors } = validate(fd);
  if (Object.keys(errors).length) return { errors, values: Object.fromEntries(fd) };

  const settings = await getSettings();
  const checkInNow = isStaff && fd.get('checkInNow') === 'on' && !settings.require_photo;
  const visit = await tx(async (c) => {
    const { queueNumber, visitCode } = await nextNumbers(c);
    const { rows } = await c.query(
      `INSERT INTO visits (visit_code, queue_number, queue_date, name, institution, phone, email, purpose, pic_id, notes, status, check_in_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [visitCode, queueNumber, todayKey(), data.name, data.institution, data.phone, data.email, data.purpose,
        data.picId, data.notes, checkInNow ? 'CHECKED_IN' : 'REGISTERED', checkInNow ? new Date() : null],
    );
    if (checkInNow) await notifyPic(c, rows[0]);
    return rows[0];
  });
  await audit(staff, 'CREATE', 'Visit', visit.visit_code, `Registrasi ${visit.queue_number} – ${visit.name}${checkInNow ? ' (langsung check-in)' : ''}`);
  revalidatePath('/admin');
  if (isStaff) redirect(`/admin/visitors/${visit.id}?created=1`);
  redirect(`/tiket/${visit.access_token}?baru=1`);
}

/** Janji temu: dibuat pengunjung (menunggu persetujuan) atau staf (langsung disetujui). */
export async function scheduleVisit(_prev, fd) {
  const isStaff = fd.get('source') === 'admin';
  const staff = isStaff ? await assertPerm('appointments.approve') : null;
  const { data, errors } = validate(fd, { schedule: true });
  if (Object.keys(errors).length) return { errors, values: Object.fromEntries(fd) };

  const rand = Math.floor(1000 + Math.random() * 9000);
  const visit = await one(
    `INSERT INTO visits (visit_code, queue_number, queue_date, name, institution, phone, email, purpose, pic_id, notes,
                         status, approval, scheduled_at)
     VALUES ($1,'-',$2,$3,$4,$5,$6,$7,$8,$9,'SCHEDULED',$10,$11) RETURNING *`,
    [`APT-${data.date.replace(/-/g, '')}-${rand}${Date.now() % 100}`, data.date, data.name, data.institution, data.phone,
      data.email, data.purpose, data.picId, data.notes, isStaff ? 'APPROVED' : 'PENDING', localToDate(data.date, data.time)],
  );
  await audit(staff, 'CREATE', 'Appointment', visit.visit_code, `Janji temu ${visit.name} ${data.date} ${data.time}`);
  revalidatePath('/admin/appointments');
  if (isStaff) redirect('/admin/appointments?created=1');
  redirect(`/tiket/${visit.access_token}?jadwal=1`);
}

/** Pengunjung mencari tiketnya: kode kunjungan + 4 digit terakhir HP. */
export async function findTicket(_prev, fd) {
  const code = clean(fd.get('code'), 40).toUpperCase();
  const last4 = clean(fd.get('last4'), 4);
  if (!code || !/^\d{4}$/.test(last4)) return { error: 'Masukkan kode kunjungan dan 4 digit terakhir nomor HP.' };
  const v = await one('SELECT access_token FROM visits WHERE upper(visit_code) = $1 AND right(phone, 4) = $2', [code, last4]);
  if (!v) return { error: 'Tiket tidak ditemukan. Periksa kembali kode kunjungan dan nomor HP Anda.' };
  redirect(`/tiket/${v.access_token}`);
}

// ---------------- Aksi staf ----------------

async function loadVisit(id) {
  const v = await one('SELECT * FROM visits WHERE id = $1', [Number(id)]);
  if (!v) throw new Error('Data kunjungan tidak ditemukan.');
  return v;
}
function refresh(id) {
  revalidatePath('/admin');
  revalidatePath('/admin/visitors');
  revalidatePath('/admin/check-in');
  revalidatePath('/admin/appointments');
  if (id) revalidatePath(`/admin/visitors/${id}`);
}

/** Cari kunjungan dari hasil scan QR / input manual (kode kunjungan atau nomor antrean hari ini). */
export async function lookupVisit(raw) {
  await assertPerm('visits.write');
  let code = clean(raw, 200).toUpperCase();
  const m = code.match(/(VIS|APT)-\d{8}-\d+/) || code.match(/[A-Z]+-\d{8}-\d{4,}/);
  if (m) code = m[0];
  let v = await one(
    `SELECT v.*, p.name AS pic_name, p.department AS pic_department, p.location AS pic_location
       FROM visits v LEFT JOIN pics p ON p.id = v.pic_id
      WHERE upper(v.visit_code) = $1
         OR (upper(v.queue_number) = $1 AND v.queue_date = $2)
      ORDER BY v.created_at DESC LIMIT 1`,
    [code, todayKey()],
  );
  if (!v) return { error: `Kunjungan "${code}" tidak ditemukan.` };
  return { visit: JSON.parse(JSON.stringify(v)) };
}

export async function checkIn(id) {
  const user = await assertPerm('visits.write');
  const v = await loadVisit(id);
  if (v.status === 'CHECKED_IN') return { error: 'Tamu sudah check-in.' };
  if (v.status === 'CHECKED_OUT') return { error: 'Kunjungan ini sudah selesai.' };
  if (v.status === 'CANCELLED') return { error: 'Kunjungan ini dibatalkan.' };
  if (v.approval === 'REJECTED') return { error: 'Janji temu ini ditolak.' };
  const settings = await getSettings();
  if (settings.require_photo && !v.photo) return { error: 'Foto tamu wajib diambil sebelum check-in (lihat halaman detail).' };

  await tx(async (c) => {
    let extra = {};
    // Janji temu: terbitkan nomor antrean hari ini saat tamu tiba
    if (v.status === 'SCHEDULED') {
      extra = await nextNumbers(c);
      await c.query(
        `UPDATE visits SET queue_number=$2, visit_code=$3, queue_date=$4, approval='APPROVED' WHERE id=$1`,
        [v.id, extra.queueNumber, extra.visitCode, todayKey()],
      );
    }
    const { rows } = await c.query(
      `UPDATE visits SET status='CHECKED_IN', check_in_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *`,
      [v.id],
    );
    await notifyPic(c, rows[0]);
  });
  await audit(user, 'CHECK_IN', 'Visit', v.visit_code, `${v.name} check-in`);
  refresh(v.id);
  return { ok: true };
}

export async function checkOut(id) {
  const user = await assertPerm('visits.write');
  const v = await loadVisit(id);
  if (v.status !== 'CHECKED_IN') return { error: 'Hanya tamu berstatus "Di Dalam" yang dapat check-out.' };
  await query(`UPDATE visits SET status='CHECKED_OUT', check_out_at=NOW(), updated_at=NOW() WHERE id=$1`, [v.id]);
  await audit(user, 'CHECK_OUT', 'Visit', v.visit_code, `${v.name} check-out`);
  refresh(v.id);
  return { ok: true };
}

export async function cancelVisit(id) {
  const user = await assertPerm('visits.write');
  const v = await loadVisit(id);
  if (v.status === 'CHECKED_OUT') return { error: 'Kunjungan yang sudah selesai tidak dapat dibatalkan.' };
  await query(`UPDATE visits SET status='CANCELLED', updated_at=NOW() WHERE id=$1`, [v.id]);
  await audit(user, 'CANCEL', 'Visit', v.visit_code, `${v.name} dibatalkan`);
  refresh(v.id);
  return { ok: true };
}

export async function updateVisit(_prev, fd) {
  const user = await assertPerm('visits.write');
  const id = Number(fd.get('id'));
  const v = await loadVisit(id);
  fd.set('consent', 'on');
  const { data, errors } = validate(fd);
  if (Object.keys(errors).length) return { errors, values: Object.fromEntries(fd) };
  await query(
    `UPDATE visits SET name=$2, institution=$3, phone=$4, email=$5, purpose=$6, pic_id=$7, notes=$8, updated_at=NOW() WHERE id=$1`,
    [id, data.name, data.institution, data.phone, data.email, data.purpose, data.picId, data.notes],
  );
  const changed = ['name', 'institution', 'phone', 'email', 'purpose', 'notes']
    .filter((k) => (v[k] || '') !== (data[k] || '')).join(', ');
  await audit(user, 'UPDATE', 'Visit', v.visit_code, `Ubah data: ${changed || 'PIC'}`);
  refresh(id);
  return { ok: true };
}

export async function updatePhoto(id, dataUrl) {
  const user = await assertPerm('visits.write');
  const v = await loadVisit(id);
  if (dataUrl && (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl) || dataUrl.length > 600000))
    return { error: 'Foto tidak valid atau terlalu besar.' };
  await query('UPDATE visits SET photo=$2, updated_at=NOW() WHERE id=$1', [v.id, dataUrl || null]);
  await audit(user, 'UPDATE', 'Visit', v.visit_code, dataUrl ? 'Unggah foto tamu' : 'Hapus foto tamu');
  refresh(v.id);
  return { ok: true };
}

export async function deleteVisit(id) {
  const user = await assertPerm('visits.delete');
  const v = await loadVisit(id);
  await query('DELETE FROM visits WHERE id=$1', [v.id]);
  await audit(user, 'DELETE', 'Visit', v.visit_code, `Hapus data ${v.name}`);
  refresh();
  redirect('/admin/visitors?deleted=1');
}

export async function setApproval(id, approval) {
  const user = await assertPerm('appointments.approve');
  if (!['APPROVED', 'REJECTED'].includes(approval)) return { error: 'Status tidak valid.' };
  const v = await loadVisit(id);
  await query('UPDATE visits SET approval=$2, updated_at=NOW() WHERE id=$1', [v.id, approval]);
  await audit(user, approval === 'APPROVED' ? 'APPROVE' : 'REJECT', 'Appointment', v.visit_code, v.name);
  refresh(v.id);
  return { ok: true };
}

export async function markNotificationsRead() {
  const user = await getSession();
  if (!user) return;
  await query('UPDATE notifications SET read = TRUE WHERE read = FALSE');
  revalidatePath('/admin');
}
