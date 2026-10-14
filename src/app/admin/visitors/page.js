import Link from 'next/link';
import { Plus, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { query, one } from '@/lib/db';
import { can, maskPhone, STATUS } from '@/lib/constants';
import { getSettings } from '@/lib/settings';
import { fmtDate, fmtTime, todayKey } from '@/lib/time';
import { PageHeader, StatusBadge, Empty, Alert } from '@/components/ui';
import VisitActions from '@/components/VisitActions';

export const metadata = { title: 'Data Tamu' };
const PER_PAGE = 15;

export default async function VisitorsPage({ searchParams: sp }) {
  const user = await requireUser();
  const s = await getSettings();
  const pics = await query('SELECT id, name FROM pics ORDER BY name');

  const where = ["v.status <> 'SCHEDULED'"];
  const params = [];
  const add = (sql, val) => { params.push(val); where.push(sql.replace('?', `$${params.length}`)); };
  if (sp.q) add(`(v.name ILIKE ? OR v.institution ILIKE $${params.length + 1} OR v.visit_code ILIKE $${params.length + 1} OR v.queue_number ILIKE $${params.length + 1})`, `%${sp.q}%`);
  if (sp.status) add('v.status = ?', sp.status);
  if (sp.purpose) add('v.purpose = ?', sp.purpose);
  if (sp.pic) add('v.pic_id = ?', Number(sp.pic));
  if (sp.from) add('v.queue_date >= ?', sp.from);
  if (sp.to) add('v.queue_date <= ?', sp.to);
  const whereSql = 'WHERE ' + where.join(' AND ');

  const page = Math.max(1, Number(sp.page) || 1);
  const [{ n: total }, rows] = await Promise.all([
    one(`SELECT COUNT(*)::int AS n FROM visits v ${whereSql}`, params),
    query(
      `SELECT v.*, p.name AS pic_name FROM visits v LEFT JOIN pics p ON p.id = v.pic_id ${whereSql}
       ORDER BY v.queue_date DESC, v.created_at DESC LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`,
      params,
    ),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const showPersonal = can(user.role, 'personal.view') || !s.mask_personal;
  const qs = (patch) => {
    const o = { ...sp, ...patch };
    Object.keys(o).forEach((k) => (o[k] === '' || o[k] == null) && delete o[k]);
    return '?' + new URLSearchParams(o).toString();
  };

  return (
    <div>
      <PageHeader title="Data Tamu" sub="Daftar seluruh data kunjungan tamu.">
        {can(user.role, 'visits.write') && <Link href="/admin/visitors/new" className="btn-primary"><Plus className="h-4 w-4" />Tamu Baru</Link>}
      </PageHeader>
      {sp.deleted && <div className="mb-4"><Alert tone="success">Data kunjungan berhasil dihapus.</Alert></div>}

      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={sp.q} className="input lg:col-span-2" placeholder="Nama, instansi, atau nomor..." />
        <select name="status" defaultValue={sp.status || ''} className="input">
          <option value="">Semua status</option>
          {Object.entries(STATUS).filter(([k]) => k !== 'SCHEDULED').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select name="pic" defaultValue={sp.pic || ''} className="input">
          <option value="">Semua PIC</option>
          {pics.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="date" name="from" defaultValue={sp.from} className="input" aria-label="Dari tanggal" />
        <input type="date" name="to" defaultValue={sp.to} className="input" aria-label="Sampai tanggal" />
        <select name="purpose" defaultValue={sp.purpose || ''} className="input lg:col-span-2">
          <option value="">Semua tujuan</option>
          {s.purposeList.map((p) => <option key={p}>{p}</option>)}
        </select>
        <div className="flex gap-2 lg:col-span-4 lg:justify-end">
          <Link href="/admin/visitors" className="btn-ghost">Reset</Link>
          <Link href={`/admin/visitors?from=${todayKey()}&to=${todayKey()}`} className="btn-outline">Hari ini</Link>
          <button className="btn-navy"><Filter className="h-4 w-4" />Terapkan</button>
        </div>
      </form>

      <div className="card overflow-hidden">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="th">Nomor</th><th className="th">Nama Tamu</th><th className="th">Instansi</th><th className="th">Tujuan</th>
                  <th className="th">PIC</th><th className="th">Tanggal</th><th className="th">Masuk</th><th className="th">Keluar</th><th className="th">Status</th><th className="th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70">
                    <td className="td"><Link href={`/admin/visitors/${v.id}`} className="font-bold text-brand-600 hover:underline">{v.queue_number}</Link><p className="whitespace-nowrap font-mono text-[10px] text-slate-400">{v.visit_code}</p></td>
                    <td className="td"><Link href={`/admin/visitors/${v.id}`} className="font-semibold hover:text-brand-600">{v.name}</Link><p className="text-xs text-slate-500">{showPersonal ? v.phone : maskPhone(v.phone)}</p></td>
                    <td className="td">{v.institution}</td>
                    <td className="td">{v.purpose}</td>
                    <td className="td">{v.pic_name || '-'}</td>
                    <td className="td whitespace-nowrap">{fmtDate(v.queue_date)}</td>
                    <td className="td">{fmtTime(v.check_in_at)}</td>
                    <td className="td">{fmtTime(v.check_out_at)}</td>
                    <td className="td"><StatusBadge status={v.status} /></td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        {can(user.role, 'visits.write') && <VisitActions visit={v} />}
                        <Link href={`/admin/visitors/${v.id}`} className="btn-ghost btn-sm" aria-label="Detail"><Eye className="h-4 w-4" /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="Tidak ada data" sub="Coba ubah kata kunci atau filter." />}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm sm:flex-row">
          <p className="text-slate-500">Menampilkan {rows.length ? (page - 1) * PER_PAGE + 1 : 0}–{(page - 1) * PER_PAGE + rows.length} dari {total} data</p>
          <div className="flex items-center gap-1">
            <Link aria-disabled={page <= 1} href={qs({ page: Math.max(1, page - 1) })} className={`btn-outline btn-sm ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}><ChevronLeft className="h-4 w-4" /></Link>
            <span className="px-3 font-medium">Hal. {page} / {pages}</span>
            <Link aria-disabled={page >= pages} href={qs({ page: Math.min(pages, page + 1) })} className={`btn-outline btn-sm ${page >= pages ? 'pointer-events-none opacity-40' : ''}`}><ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
