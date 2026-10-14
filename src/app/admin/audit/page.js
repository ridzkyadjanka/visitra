import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { requirePerm } from '@/lib/auth';
import { query, one } from '@/lib/db';
import { fmtDateTime } from '@/lib/time';
import { PageHeader, Empty } from '@/components/ui';

export const metadata = { title: 'Log Aktivitas' };
const PER = 25;
const ACTIONS = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'CHECK_IN', 'CHECK_OUT', 'CANCEL', 'APPROVE', 'REJECT', 'EXPORT'];
const tone = {
  DELETE: 'bg-rose-50 text-rose-700 ring-rose-200', CREATE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  UPDATE: 'bg-amber-50 text-amber-700 ring-amber-200', CHECK_IN: 'bg-brand-50 text-brand-700 ring-brand-200',
  CHECK_OUT: 'bg-violet-50 text-violet-700 ring-violet-200', EXPORT: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
};

export default async function AuditPage({ searchParams: sp }) {
  await requirePerm('audit.view');
  const page = Math.max(1, Number(sp.page) || 1);
  const where = [], params = [];
  if (sp.action) { params.push(sp.action); where.push(`action = $${params.length}`); }
  if (sp.q) { params.push(`%${sp.q}%`); where.push(`(actor ILIKE $${params.length} OR detail ILIKE $${params.length} OR entity_id ILIKE $${params.length})`); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [{ n }, rows] = await Promise.all([
    one(`SELECT COUNT(*)::int AS n FROM audit_logs ${w}`, params),
    query(`SELECT * FROM audit_logs ${w} ORDER BY created_at DESC LIMIT ${PER} OFFSET ${(page - 1) * PER}`, params),
  ]);
  const pages = Math.max(1, Math.ceil(n / PER));
  const link = (p) => '?' + new URLSearchParams({ ...sp, page: p }).toString();
  return (
    <div>
      <PageHeader title="Log Aktivitas (Audit Log)" sub="Riwayat seluruh perubahan data dan aktivitas pengguna." />
      <form className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row">
        <input name="q" defaultValue={sp.q} className="input" placeholder="Cari pelaku, detail, atau kode..." />
        <select name="action" defaultValue={sp.action || ''} className="input sm:max-w-[200px]">
          <option value="">Semua aksi</option>
          {ACTIONS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <button className="btn-navy">Filter</button>
      </form>
      <div className="card overflow-x-auto">
        {rows.length ? (
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Waktu</th><th className="th">Pelaku</th><th className="th">Aksi</th><th className="th">Objek</th><th className="th">Detail</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="td whitespace-nowrap text-xs text-slate-500">{fmtDateTime(r.created_at)}</td>
                  <td className="td font-medium">{r.actor}</td>
                  <td className="td"><span className={`badge ${tone[r.action] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{r.action}</span></td>
                  <td className="td text-xs">{r.entity}<p className="font-mono text-slate-400">{r.entity_id}</p></td>
                  <td className="td">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty />}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
          <span className="text-slate-500">{n} catatan</span>
          <div className="flex items-center gap-1">
            <Link href={link(Math.max(1, page - 1))} className={`btn-outline btn-sm ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}><ChevronLeft className="h-4 w-4" /></Link>
            <span className="px-3">Hal. {page} / {pages}</span>
            <Link href={link(Math.min(pages, page + 1))} className={`btn-outline btn-sm ${page >= pages ? 'pointer-events-none opacity-40' : ''}`}><ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
