import { FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { requirePerm } from '@/lib/auth';
import { query } from '@/lib/db';
import { STATUS } from '@/lib/constants';
import { parseFilters, getReport } from '@/lib/reports';
import { todayKey, addDays, fmtDate, tzLabel } from '@/lib/time';
import { PageHeader, StatCard } from '@/components/ui';
import { TrendArea, Donut, HBar } from '@/components/charts';
import Link from 'next/link';

export const metadata = { title: 'Laporan Kunjungan' };

export default async function ReportsPage({ searchParams }) {
  await requirePerm('reports.view');
  const f = parseFilters(searchParams);
  const [rep, depts, pics] = await Promise.all([
    getReport(f),
    query('SELECT DISTINCT department FROM pics ORDER BY 1'),
    query('SELECT id, name FROM pics ORDER BY name'),
  ]);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v !== '')).toString();
  const today = todayKey();
  const firstOfMonth = today.slice(0, 8) + '01';
  const presets = [
    ['Hari ini', today, today],
    ['7 hari', addDays(today, -6), today],
    ['30 hari', addDays(today, -29), today],
    ['Bulan ini', firstOfMonth, today],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Kunjungan" sub={`Rekap data tamu periode ${fmtDate(f.from)} – ${fmtDate(f.to)}.`}>
        <a href={`/admin/reports/export?format=xlsx&${qs}`} className="btn-outline"><FileSpreadsheet className="h-4 w-4 text-emerald-600" />Ekspor Excel</a>
        <a href={`/admin/reports/export?format=pdf&${qs}`} className="btn-outline"><FileText className="h-4 w-4 text-rose-600" />Ekspor PDF</a>
      </PageHeader>

      <form className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div><label className="label text-xs">Dari</label><input type="date" name="from" defaultValue={f.from} className="input" /></div>
        <div><label className="label text-xs">Sampai</label><input type="date" name="to" defaultValue={f.to} className="input" /></div>
        <div>
          <label className="label text-xs">Departemen</label>
          <select name="department" defaultValue={f.department} className="input">
            <option value="">Semua</option>
            {depts.map((d) => <option key={d.department}>{d.department}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">PIC</label>
          <select name="pic" defaultValue={f.pic} className="input">
            <option value="">Semua</option>
            {pics.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">Status</label>
          <select name="status" defaultValue={f.status} className="input">
            <option value="">Semua</option>
            {['REGISTERED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
          </select>
        </div>
        <div className="flex items-end"><button className="btn-primary w-full"><Filter className="h-4 w-4" />Generate</button></div>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-6">
          {presets.map(([l, a, b]) => (
            <Link key={l} href={`?from=${a}&to=${b}`} className={`btn-sm rounded-full border px-3 font-semibold ${f.from === a && f.to === b ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}>{l}</Link>
          ))}
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Kunjungan" value={rep.summary.total.toLocaleString('id-ID')} hint={`${rep.summary.done.toLocaleString('id-ID')} selesai · ${rep.summary.cancelled} dibatalkan`} />
        <StatCard label="Rata-rata Harian" value={rep.summary.perDay} hint="kunjungan per hari" />
        <StatCard label="Durasi Rata-rata" value={`${rep.summary.avg_min} menit`} hint="dari check-in ke check-out" />
        <StatCard label="Jam Tersibuk" value={rep.summary.peakHour != null ? `${String(rep.summary.peakHour).padStart(2, '0')}:00` : '-'} hint={`${rep.summary.institutions} instansi berbeda · ${tzLabel}`} />
      </div>

      <div className="card p-5">
        <h2 className="font-bold">Tren Kunjungan</h2>
        <div className="mt-4"><TrendArea data={rep.series} /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold">Tujuan Kunjungan</h2>
          <div className="mt-5"><Donut data={rep.byPurpose} total={rep.summary.total} centerLabel="Kunjungan" /></div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Per Departemen</h2>
          <div className="mt-4"><HBar data={rep.byDept} height={Math.max(180, rep.byDept.length * 40)} /></div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="px-5 pt-5"><h2 className="font-bold">PIC dengan Kunjungan Terbanyak</h2></div>
        <table className="mt-3 w-full min-w-[520px]">
          <thead className="border-y border-slate-200 bg-slate-50"><tr><th className="th">#</th><th className="th">PIC</th><th className="th">Departemen</th><th className="th text-right">Kunjungan</th><th className="th text-right">Durasi Rata-rata</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rep.byPic.map((p, i) => (
              <tr key={p.name}>
                <td className="td text-slate-500">{i + 1}</td><td className="td font-semibold">{p.name}</td><td className="td">{p.department}</td>
                <td className="td text-right font-semibold">{p.value}</td><td className="td text-right">{p.avg_min} menit</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
