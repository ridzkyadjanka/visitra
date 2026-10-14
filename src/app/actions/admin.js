'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { one, query } from '@/lib/db';
import { assertPerm, audit } from '@/lib/auth';
import { ROLES } from '@/lib/constants';

const clean = (v, max = 200) => (v == null ? '' : String(v).trim().slice(0, max));

// ---------------- PIC ----------------
export async function savePic(_prev, fd) {
  const user = await assertPerm('pics.write');
  const id = Number(fd.get('id')) || null;
  const d = {
    name: clean(fd.get('name'), 120),
    department: clean(fd.get('department'), 80),
    location: clean(fd.get('location'), 120),
    email: clean(fd.get('email'), 150) || null,
    phone: clean(fd.get('phone'), 20) || null,
  };
  if (d.name.length < 3) return { error: 'Nama PIC minimal 3 karakter.' };
  if (!d.department) return { error: 'Departemen wajib diisi.' };
  if (!d.location) return { error: 'Lokasi wajib diisi.' };
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return { error: 'Format email tidak valid.' };

  if (id) {
    await query('UPDATE pics SET name=$2, department=$3, location=$4, email=$5, phone=$6 WHERE id=$1',
      [id, d.name, d.department, d.location, d.email, d.phone]);
    await audit(user, 'UPDATE', 'PIC', id, `Ubah PIC ${d.name}`);
  } else {
    const r = await one('INSERT INTO pics (name, department, location, email, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [d.name, d.department, d.location, d.email, d.phone]);
    await audit(user, 'CREATE', 'PIC', r.id, `Tambah PIC ${d.name}`);
  }
  revalidatePath('/admin/pics');
  return { ok: id ? 'PIC diperbarui.' : 'PIC ditambahkan.', ts: Date.now() };
}

export async function togglePic(id) {
  const user = await assertPerm('pics.write');
  const p = await one('UPDATE pics SET active = NOT active WHERE id=$1 RETURNING name, active', [Number(id)]);
  await audit(user, 'UPDATE', 'PIC', id, `${p.active ? 'Aktifkan' : 'Nonaktifkan'} PIC ${p.name}`);
  revalidatePath('/admin/pics');
}

export async function deletePic(id) {
  const user = await assertPerm('pics.write');
  const p = await one('SELECT name, (SELECT COUNT(*)::int FROM visits WHERE pic_id = $1) AS n FROM pics WHERE id=$1', [Number(id)]);
  if (!p) return { error: 'PIC tidak ditemukan.' };
  if (p.n > 0) return { error: `PIC memiliki ${p.n} riwayat kunjungan. Nonaktifkan saja agar riwayat tetap utuh.` };
  await query('DELETE FROM pics WHERE id=$1', [Number(id)]);
  await audit(user, 'DELETE', 'PIC', id, `Hapus PIC ${p.name}`);
  revalidatePath('/admin/pics');
  return { ok: true };
}

// ---------------- Users ----------------
export async function saveUser(_prev, fd) {
  const actor = await assertPerm('users.manage');
  const id = Number(fd.get('id')) || null;
  const name = clean(fd.get('name'), 120);
  const email = clean(fd.get('email'), 150).toLowerCase();
  const role = clean(fd.get('role'), 20);
  const password = String(fd.get('password') || '');

  if (name.length < 3) return { error: 'Nama minimal 3 karakter.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Format email tidak valid.' };
  if (!ROLES[role]) return { error: 'Peran tidak valid.' };
  if (!id && password.length < 8) return { error: 'Password minimal 8 karakter.' };
  if (id && password && password.length < 8) return { error: 'Password baru minimal 8 karakter.' };
  const dup = await one('SELECT id FROM users WHERE lower(email)=$1 AND id <> $2', [email, id || 0]);
  if (dup) return { error: 'Email sudah digunakan akun lain.' };
  if (id === actor.id && role !== 'SUPER_ADMIN') return { error: 'Anda tidak dapat menurunkan peran akun Anda sendiri.' };

  if (id) {
    await query('UPDATE users SET name=$2, email=$3, role=$4 WHERE id=$1', [id, name, email, role]);
    if (password) await query('UPDATE users SET password_hash=$2 WHERE id=$1', [id, await bcrypt.hash(password, 10)]);
    await audit(actor, 'UPDATE', 'User', id, `Ubah akun ${email} (${ROLES[role]})${password ? ' + reset password' : ''}`);
  } else {
    const r = await one('INSERT INTO users (name,email,role,password_hash) VALUES ($1,$2,$3,$4) RETURNING id',
      [name, email, role, await bcrypt.hash(password, 10)]);
    await audit(actor, 'CREATE', 'User', r.id, `Buat akun ${email} (${ROLES[role]})`);
  }
  revalidatePath('/admin/users');
  return { ok: id ? 'Akun diperbarui.' : 'Akun dibuat.', ts: Date.now() };
}

export async function toggleUser(id) {
  const actor = await assertPerm('users.manage');
  if (Number(id) === actor.id) return { error: 'Anda tidak dapat menonaktifkan akun sendiri.' };
  const u = await one('UPDATE users SET active = NOT active WHERE id=$1 RETURNING email, active', [Number(id)]);
  await audit(actor, 'UPDATE', 'User', id, `${u.active ? 'Aktifkan' : 'Nonaktifkan'} akun ${u.email}`);
  revalidatePath('/admin/users');
  return { ok: true };
}

export async function deleteUser(id) {
  const actor = await assertPerm('users.manage');
  if (Number(id) === actor.id) return { error: 'Anda tidak dapat menghapus akun sendiri.' };
  const u = await one('DELETE FROM users WHERE id=$1 RETURNING email', [Number(id)]);
  await audit(actor, 'DELETE', 'User', id, `Hapus akun ${u?.email}`);
  revalidatePath('/admin/users');
  return { ok: true };
}

// ---------------- Settings ----------------
export async function saveSettings(_prev, fd) {
  const actor = await assertPerm('settings.manage');
  const d = {
    company_name: clean(fd.get('company_name'), 150),
    address: clean(fd.get('address'), 250),
    phone: clean(fd.get('phone'), 40),
    queue_prefix: clean(fd.get('queue_prefix'), 3).toUpperCase(),
    code_prefix: clean(fd.get('code_prefix'), 6).toUpperCase(),
    open_time: clean(fd.get('open_time'), 5),
    close_time: clean(fd.get('close_time'), 5),
    purposes: clean(fd.get('purposes'), 1000).split(/[\n,]/).map((x) => x.trim()).filter(Boolean).join(','),
    require_photo: fd.get('require_photo') === 'on',
    mask_personal: fd.get('mask_personal') === 'on',
    session_hours: Math.min(72, Math.max(1, Number(fd.get('session_hours')) || 8)),
  };
  if (!d.company_name) return { error: 'Nama perusahaan wajib diisi.' };
  if (!/^[A-Z]{1,3}$/.test(d.queue_prefix)) return { error: 'Prefix antrean harus 1–3 huruf.' };
  if (!/^[A-Z]{2,6}$/.test(d.code_prefix)) return { error: 'Prefix kode kunjungan harus 2–6 huruf.' };
  if (!/^\d{2}:\d{2}$/.test(d.open_time) || !/^\d{2}:\d{2}$/.test(d.close_time) || d.open_time >= d.close_time)
    return { error: 'Jam operasional tidak valid.' };
  if (!d.purposes) return { error: 'Minimal satu tujuan kunjungan.' };

  const keys = Object.keys(d);
  await query(
    `UPDATE settings SET ${keys.map((k, i) => `${k}=$${i + 1}`).join(', ')} WHERE id = 1`,
    keys.map((k) => d[k]),
  );
  await audit(actor, 'UPDATE', 'Settings', 1, 'Perbarui pengaturan sistem');
  revalidatePath('/', 'layout');
  return { ok: 'Pengaturan tersimpan.', ts: Date.now() };
}
