import Link from 'next/link';
import { Users, UserCheck, CircleCheck, Timer, ArrowRight, TrendingUp, LogIn, LogOut, Plus, CalendarCheck } from 'lucide-react';
import { query, one } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { can } from '@/lib/constants';
import { TZ, todayKey, addDays, fmtTime, fmtDateLong, fmtDuration, minutesBetween, tzLabel } from '@/lib/time';
import { StatCard, StatusBadge, Alert, Empty, ApprovalBadge } from '@/components/ui';
import { HourlyBar, Donut, TrendArea } from '@/components/charts';
import VisitActions from '@/components/VisitActions';
import AutoRefresh from '@/components/AutoRefresh';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard({ searchParams }) {
  const user = await requireUser();
  const today = todayKey();
  const yesterday = addDays(today, -1);

  const [stats, yest, hourly, purposes, inside, activity, trend, upcoming] = await Promise.all([
    one(
      `SELECT COUNT(*) FILTER (WHERE status IN ('REGISTERED','CHECKED_IN','CHECKED_OUT'))::int AS total,
              COUNT(*) FILTER (WHERE status = 'CHECKED_IN')::int AS inside,
              COUNT(*) FILTER (WHERE status = 'CHECKED_OUT')::int AS done,
              COUNT(*) FILTER (WHERE status = 'REGISTERED')::int AS waiting,
              COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (check_out_at - check_in_at)) / 60) FILTER (WHERE status = 'CHECKED_OUT')), 0)::int AS avg
         FROM visits WHERE queue_date = $1`, [today]),
    // dibandingkan dengan kemarin pada jam yang sama
    one(`SELECT COUNT(*)::int AS total FROM visits WHERE queue_date = $1 AND status IN ('REGISTERED','CHECKED_IN','CHECKED_OUT')
          AND COALESCE(check_in_at, created_at) <= NOW() - INTERVAL '1 day'`, [yesterday]),
    query(
      `SELECT EXTRACT(HOUR FROM COALESCE(check_in_at, created_at) AT TIME ZONE $2)::int AS h, COUNT(*)::int AS n
         FROM visits WHERE queue_date = $1 AND status IN ('REGISTERED','CHECKED_IN','CHECKED_OUT') GROUP BY 1`, [today, TZ]),
    query(
      `SELECT purpose AS name, COUNT(*)::int AS value FROM visits
        WHERE queue_date BETWEEN $1 AND $2 AND status IN ('REGISTERED','CHECKED_IN','CHECKED_OUT')
        GROUP BY 1 ORDER BY 2 DESC`, [addDays(today, -6), today]),
    query(
      `SELECT v.*, p.name AS pic_name FROM visits v LEFT JOIN pics p ON p.id = v.pic_id
        WHERE v.status IN ('CHECKED_IN','REGISTERED') AND v.queue_date = $1
        ORDER BY (v.status = 'REGISTERED') DESC, v.check_in_at DESC LIMIT 8`, [today]),
    query(`SELECT * FROM audit_logs WHERE action IN ('CHECK_IN','CHECK_OUT','CREATE','APPROVE','REJECT') ORDER BY created_at DESC LIMIT 7`),
    query(
      `SELECT queue_date AS d, COUNT(*)::int AS total FROM visits
        WHERE queue_date BETWEEN $1 AND $2 AND status IN ('REGISTERED','CHECKED_IN','CHECKED_OUT') GROUP BY 1 ORDER BY 1`,
      [addDays(today, -13), today]),
    query(
      `SELECT v.*, p.name AS pic_name FROM visits v LEFT JOIN pics p ON p.id = v.pic_id
        WHERE v.status = 'SCHEDULED' AND v.queue_date >= $1 ORDER BY v.scheduled_at LIMIT 5`, [today]),
  ]);

  const hourMap = Object.fromEntries(hourly.map((r) => [r.h, r.n]));
  const hrs = hourly.map((r) => r.h);
  const hStart = Math.min(8, ...hrs), hEnd = Math.max(17, ...hrs);
  const hourData = Array.from({ length: hEnd - hStart + 1 }, (_, i) => ({ hour: String(hStart + i).padStart(2, '0'), total: hourMap[hStart + i] || 0 }));
  const trendMap = Object.fromEntries(trend.map((r) => [r.d, r.total]));
  const trendData = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i - 13);
    return { label: `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`, total: trendMap[d] || 0 };
  });
  const diff = yest.total ? Math.round(((stats.total - yest.total) / yest.total) * 100) : null;
  const purposeTotal = purposes.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={30} />
      {searchParams.denied && <Alert tone="warn">Anda tidak memiliki hak akses ke halaman tersebut.</Alert>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{fmtDateLong(today)}</p>
          <h1 className="page-title">Halo, {user.name.split(' ')[0]} 👋</h1>
        </div>
        {can(user.role, 'visits.write') && (
          <div className="flex gap-2">
            <Link href="/admin/check-in" className="btn-outline">Scan QR</Link>
            <Link href="/admin/visitors/new" className="btn-primary"><Plus className="h-4 w-4" />Registrasi Tamu</Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Tamu Hari Ini" value={stats.total} icon={Users}
          hint={diff == null ? 'Belum ada pembanding kemarin' : <span className={diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}><TrendingUp className="inline h-3 w-3" /> {diff >= 0 ? '+' : ''}{diff}% dari kemarin</span>} />
        <StatCard label="Sedang di Dalam" value={stats.inside} icon={UserCheck} tone="green" hint={`${stats.waiting} menunggu verifikasi`} />
        <StatCard label="Kunjungan Selesai" value={stats.done} icon={CircleCheck} tone="violet" hint="Sudah check-out" />
        <StatCard label="Rata-rata Durasi" value={stats.avg ? `${stats.avg} mnt` : '-'} icon={Timer} tone="amber" hint="Kunjungan selesai hari ini" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Grafik Kunjungan Hari Ini</h2>
            <span className="text-xs text-slate-500">per jam ({tzLabel})</span>
          </div>
          <div className="mt-4"><HourlyBar data={hourData} /></div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Jenis Tujuan Kunjungan</h2>
            <span className="text-xs text-slate-500">7 hari terakhir</span>
          </div>
          <div className="mt-6"><Donut data={purposes.slice(0, 6)} total={purposeTotal} /></div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-bold">Tamu Aktif & Menunggu</h2>
            <Link href="/admin/visitors?status=CHECKED_IN" className="text-sm font-semibold text-brand-600">Lihat semua</Link>
          </div>
          {inside.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <tbody className="divide-y divide-slate-100">
                  {inside.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="td whitespace-nowrap font-bold text-brand-600"><Link href={`/admin/visitors/${v.id}`}>{v.queue_number}</Link></td>
                      <td className="td">
                        <Link href={`/admin/visitors/${v.id}`} className="font-semibold hover:text-brand-600">{v.name}</Link>
                        <p className="text-xs text-slate-500">{v.institution} · {v.pic_name || 'Tanpa PIC'}</p>
                      </td>
                      <td className="td text-xs text-slate-500">
                        {v.check_in_at ? `${fmtTime(v.check_in_at)} · ${fmtDuration(minutesBetween(v.check_in_at))}` : 'Belum verifikasi'}
                      </td>
                      <td className="td"><StatusBadge status={v.status} /></td>
                      <td className="td text-right">{can(user.role, 'visits.write') && <VisitActions visit={v} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty title="Tidak ada tamu aktif" sub="Tamu yang check-in akan muncul di sini." />}
        </div>

        <div className="card p-5">
          <h2 className="font-bold">Aktivitas Terbaru</h2>
          <ul className="mt-4 space-y-4">
            {activity.map((a) => {
              const Icon = a.action === 'CHECK_OUT' ? LogOut : a.action === 'CHECK_IN' ? LogIn : a.action === 'CREATE' ? Plus : CalendarCheck;
              return (
                <li key={a.id} className="flex gap-3">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${a.action === 'CHECK_OUT' ? 'bg-slate-100 text-slate-600' : 'bg-brand-50 text-brand-600'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{a.detail}</p>
                    <p className="text-xs text-slate-500">{a.actor} · {fmtTime(a.created_at)}</p>
                  </div>
                </li>
              );
            })}
            {!activity.length && <li className="text-sm text-slate-400">Belum ada aktivitas.</li>}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Tren 14 Hari</h2>
            {can(user.role, 'reports.view') && <Link href="/admin/reports" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">Laporan <ArrowRight className="h-4 w-4" /></Link>}
          </div>
          <div className="mt-4"><TrendArea data={trendData} height={220} /></div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Janji Temu Mendatang</h2>
            <Link href="/admin/appointments" className="text-sm font-semibold text-brand-600">Kelola</Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {upcoming.map((v) => (
              <li key={v.id} className="py-3 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{v.name}</p>
                    <p className="text-xs text-slate-500">{v.institution} · {v.pic_name || '-'}</p>
                    <p className="mt-0.5 text-xs font-medium text-brand-700">{fmtDateLong(v.scheduled_at)}, {fmtTime(v.scheduled_at)}</p>
                  </div>
                  <ApprovalBadge approval={v.approval} />
                </div>
              </li>
            ))}
            {!upcoming.length && <li className="text-sm text-slate-400">Tidak ada janji temu.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
