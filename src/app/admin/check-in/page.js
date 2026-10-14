import Link from 'next/link';
import { requirePerm } from '@/lib/auth';
import { query } from '@/lib/db';
import { todayKey, fmtTime } from '@/lib/time';
import { PageHeader, StatusBadge, Empty } from '@/components/ui';
import VisitActions from '@/components/VisitActions';
import Scanner from './Scanner';

export const metadata = { title: 'Check-in / Check-out' };

export default async function CheckInPage() {
  await requirePerm('visits.write');
  const waiting = await query(
    `SELECT v.*, p.name AS pic_name FROM visits v LEFT JOIN pics p ON p.id = v.pic_id
      WHERE v.queue_date = $1 AND v.status IN ('REGISTERED','CHECKED_IN')
      ORDER BY (v.status='REGISTERED') DESC, v.created_at DESC LIMIT 30`,
    [todayKey()],
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Check-in / Check-out Tamu" sub="Verifikasi kedatangan dan kepulangan tamu melalui QR Code atau kode kunjungan." />
      <Scanner />
      <div className="card overflow-hidden">
        <div className="px-5 pt-5"><h2 className="font-bold">Antrean Hari Ini</h2></div>
        {waiting.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50"><tr><th className="th">No.</th><th className="th">Nama</th><th className="th">Tujuan / PIC</th><th className="th">Waktu</th><th className="th">Status</th><th className="th text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {waiting.map((v) => (
                  <tr key={v.id}>
                    <td className="td whitespace-nowrap font-bold text-brand-600">{v.queue_number}</td>
                    <td className="td"><Link href={`/admin/visitors/${v.id}`} className="font-semibold hover:text-brand-600">{v.name}</Link><p className="text-xs text-slate-500">{v.institution}</p></td>
                    <td className="td text-xs">{v.purpose}<p className="text-slate-500">{v.pic_name || '-'}</p></td>
                    <td className="td text-xs">{fmtTime(v.check_in_at || v.created_at)}</td>
                    <td className="td"><StatusBadge status={v.status} /></td>
                    <td className="td"><div className="flex justify-end"><VisitActions visit={v} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="Antrean kosong" sub="Belum ada tamu yang menunggu atau berada di dalam." />}
      </div>
    </div>
  );
}
