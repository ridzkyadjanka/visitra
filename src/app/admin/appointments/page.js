import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { can } from '@/lib/constants';
import { todayKey, fmtDateLong, fmtTime, tzLabel } from '@/lib/time';
import { PageHeader, StatusBadge, ApprovalBadge, Empty, Alert } from '@/components/ui';
import VisitActions from '@/components/VisitActions';

export const metadata = { title: 'Janji Temu' };

const TABS = [
  ['upcoming', 'Mendatang'],
  ['pending', 'Menunggu Persetujuan'],
  ['today', 'Hari Ini'],
  ['past', 'Riwayat'],
];

export default async function AppointmentsPage({ searchParams }) {
  const user = await requireUser();
  const tab = searchParams.tab || 'upcoming';
  const today = todayKey();
  const filters = {
    upcoming: [`v.status = 'SCHEDULED' AND v.queue_date >= $1`, 'v.scheduled_at ASC'],
    pending: [`v.status = 'SCHEDULED' AND v.approval = 'PENDING' AND $1::date IS NOT NULL`, 'v.scheduled_at ASC'],
    today: [`v.scheduled_at IS NOT NULL AND v.queue_date = $1`, 'v.scheduled_at ASC'],
    past: [`v.scheduled_at IS NOT NULL AND (v.queue_date < $1 OR v.status <> 'SCHEDULED')`, 'v.scheduled_at DESC'],
  };
  const [where, order] = filters[tab] || filters.upcoming;
  const rows = await query(
    `SELECT v.*, p.name AS pic_name, p.department AS pic_department FROM visits v LEFT JOIN pics p ON p.id = v.pic_id
      WHERE ${where} ORDER BY ${order} LIMIT 100`, [today]);
  const [{ n: pendingCount }] = await query(`SELECT COUNT(*)::int AS n FROM visits WHERE status='SCHEDULED' AND approval='PENDING'`);

  // kelompokkan per tanggal
  const groups = rows.reduce((acc, v) => { (acc[v.queue_date] ||= []).push(v); return acc; }, {});
  const allowed = can(user.role, 'appointments.approve');

  return (
    <div>
      <PageHeader title="Janji Temu" sub="Kelola kunjungan terjadwal dan persetujuan.">
        {allowed && <Link href="/admin/appointments/new" className="btn-primary"><Plus className="h-4 w-4" />Buat Janji Temu</Link>}
      </PageHeader>
      {searchParams.created && <div className="mb-4"><Alert tone="success">Janji temu berhasil dibuat dan disetujui.</Alert></div>}

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`?tab=${k}`} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === k ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}>
            {l}{k === 'pending' && pendingCount > 0 && <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{pendingCount}</span>}
          </Link>
        ))}
      </div>

      {Object.keys(groups).length ? (
        <div className="space-y-6">
          {Object.entries(groups).map(([date, list]) => (
            <div key={date}>
              <h3 className="mb-2 text-sm font-bold text-slate-500">{fmtDateLong(date)}{date === today && ' · Hari ini'}</h3>
              <div className="card divide-y divide-slate-100">
                {list.map((v) => (
                  <div key={v.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="w-20 shrink-0">
                      <p className="text-lg font-bold text-brand-600">{fmtTime(v.scheduled_at)}</p>
                      <p className="text-[10px] text-slate-400">{tzLabel}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/visitors/${v.id}`} className="font-semibold hover:text-brand-600">{v.name}</Link>
                      <p className="text-sm text-slate-500">{v.institution} · {v.purpose}</p>
                      <p className="text-xs text-slate-500">Bertemu: {v.pic_name ? `${v.pic_name} (${v.pic_department})` : '-'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {v.status === 'SCHEDULED' ? <ApprovalBadge approval={v.approval} /> : <StatusBadge status={v.status} />}
                      {allowed && <VisitActions visit={v} show={['approve', 'in', 'cancel']} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : <div className="card"><Empty title="Tidak ada janji temu" sub="Janji temu yang diajukan pengunjung atau dibuat staf akan tampil di sini." /></div>}
    </div>
  );
}
