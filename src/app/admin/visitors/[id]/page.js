import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Printer, ExternalLink } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { one, query } from '@/lib/db';
import { can, maskPhone } from '@/lib/constants';
import { getSettings } from '@/lib/settings';
import { fmtDateTime, fmtDuration, minutesBetween, fmtDateLong, fmtTime } from '@/lib/time';
import { StatusBadge, ApprovalBadge, Alert } from '@/components/ui';
import VisitActions from '@/components/VisitActions';
import VisitForm from '@/components/VisitForm';
import PhotoBox from './PhotoBox';
import DeleteButton from './DeleteButton';

export const metadata = { title: 'Detail Kunjungan' };

export default async function VisitorDetail({ params, searchParams }) {
  const user = await requireUser();
  const v = await one(
    `SELECT v.*, p.name AS pic_name, p.department AS pic_department, p.location AS pic_location
       FROM visits v LEFT JOIN pics p ON p.id = v.pic_id WHERE v.id = $1`, [Number(params.id)]);
  if (!v) notFound();
  const s = await getSettings();
  const [pics, logs] = await Promise.all([
    query('SELECT id, name, department FROM pics WHERE active OR id = $1 ORDER BY name', [v.pic_id || 0]),
    query('SELECT * FROM audit_logs WHERE entity_id = $1 ORDER BY created_at DESC LIMIT 20', [v.visit_code]),
  ]);
  const writable = can(user.role, 'visits.write');
  const showPersonal = can(user.role, 'personal.view') || !s.mask_personal;
  const editing = searchParams.edit && writable;

  const info = [
    ['Nama', v.name], ['Instansi', v.institution],
    ['Nomor HP', showPersonal ? v.phone : maskPhone(v.phone)], ['Email', showPersonal ? v.email || '-' : v.email ? '•••' : '-'],
    ['Tujuan', v.purpose], ['PIC', v.pic_name ? `${v.pic_name} (${v.pic_department})` : '-'],
    ['Lokasi', v.pic_location || '-'], ['Keterangan', v.notes || '-'],
    ...(v.scheduled_at ? [['Jadwal', `${fmtDateLong(v.scheduled_at)}, ${fmtTime(v.scheduled_at)}`]] : []),
    ['Terdaftar', fmtDateTime(v.created_at)], ['Check-in', fmtDateTime(v.check_in_at)], ['Check-out', fmtDateTime(v.check_out_at)],
    ['Durasi', v.check_in_at ? fmtDuration(minutesBetween(v.check_in_at, v.check_out_at)) + (v.check_out_at ? '' : ' (berlangsung)') : '-'],
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/visitors" className="btn-ghost -ml-3"><ArrowLeft className="h-4 w-4" />Kembali</Link>
        <div className="flex flex-wrap gap-2">
          <a href={`/tiket/${v.access_token}`} target="_blank" className="btn-outline"><ExternalLink className="h-4 w-4" />Tiket</a>
          {v.status !== 'SCHEDULED' && <Link href={`/admin/visitors/${v.id}/badge`} className="btn-outline"><Printer className="h-4 w-4" />Cetak Badge</Link>}
          {writable && !editing && <Link href={`?edit=1`} className="btn-outline">Edit Data</Link>}
        </div>
      </div>

      {searchParams.created && <div className="mb-4"><Alert tone="success">Tamu berhasil didaftarkan dengan nomor <b>{v.queue_number}</b>.</Alert></div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detail Kunjungan</p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight">{v.queue_number === '-' ? 'Janji Temu' : v.queue_number}</p>
                <p className="font-mono text-sm text-slate-500">{v.visit_code}</p>
              </div>
              <div className="flex gap-2"><StatusBadge status={v.status} />{v.status === 'SCHEDULED' && <ApprovalBadge approval={v.approval} />}</div>
            </div>

            {editing ? (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <VisitForm mode="edit" source="admin" pics={pics} purposes={s.purposeList}
                  initial={{ id: v.id, name: v.name, institution: v.institution, phone: v.phone, email: v.email, purpose: v.purpose, picId: v.pic_id, notes: v.notes }} />
                <Link href={`/admin/visitors/${v.id}`} className="btn-ghost mt-2 w-full">Selesai mengedit</Link>
              </div>
            ) : (
              <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-slate-100 pt-6 text-sm sm:grid-cols-2">
                {info.map(([k, val]) => (
                  <div key={k} className="flex gap-3"><dt className="w-28 shrink-0 text-slate-500">{k}</dt><dd className="font-medium">{val}</dd></div>
                ))}
              </dl>
            )}

            {writable && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <VisitActions visit={v} size="md" show={['approve', 'in', 'out', 'cancel']} />
                {can(user.role, 'visits.delete') && <DeleteButton id={v.id} />}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-bold">Riwayat Perubahan</h3>
            <ol className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
              {logs.map((l) => (
                <li key={l.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
                  <p className="font-medium">{l.detail}</p>
                  <p className="text-xs text-slate-500">{l.action} · {l.actor} · {fmtDateTime(l.created_at)}</p>
                </li>
              ))}
              {!logs.length && <li className="text-sm text-slate-400">Belum ada riwayat.</li>}
            </ol>
          </div>
        </div>
        <div><PhotoBox id={v.id} photo={v.photo} editable={writable} /></div>
      </div>
    </div>
  );
}
