import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { one } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { qrDataUrl } from '@/lib/qr';
import { fmtDate } from '@/lib/time';
import PrintButton from '@/components/PrintButton';
import { LogoMark } from '@/components/Logo';

export const metadata = { title: 'Visitor Badge' };

export default async function BadgePage({ params }) {
  await requireUser();
  const v = await one(
    `SELECT v.*, p.name AS pic_name, p.location AS pic_location FROM visits v LEFT JOIN pics p ON p.id = v.pic_id WHERE v.id = $1`,
    [Number(params.id)]);
  if (!v) notFound();
  const s = await getSettings();
  const qr = await qrDataUrl(v.visit_code, 180);
  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/admin/visitors/${v.id}`} className="btn-ghost -ml-3"><ArrowLeft className="h-4 w-4" />Kembali</Link>
        <PrintButton label="Cetak Badge" />
      </div>
      {/* Ukuran kartu ID: 54 x 86 mm */}
      <div className="print-area mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card" style={{ width: '54mm', minHeight: '86mm' }}>
        <div className="flex items-center gap-2 bg-navy-900 px-3 py-2 text-white">
          <LogoMark className="h-5 w-5" />
          <span className="truncate text-[9px] font-semibold">{s.company_name}</span>
        </div>
        <div className="bg-brand-600 py-1 text-center text-[10px] font-extrabold tracking-[0.3em] text-white">VISITOR</div>
        <div className="px-3 py-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {v.photo && <img src={v.photo} alt="" className="mx-auto mb-2 h-14 w-14 rounded-lg object-cover" />}
          <p className="text-2xl font-extrabold leading-none">{v.queue_number}</p>
          <p className="mt-1.5 text-[11px] font-bold leading-tight">{v.name}</p>
          <p className="text-[9px] text-slate-500">{v.institution}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="" className="mx-auto mt-2 h-20 w-20" />
          <p className="font-mono text-[8px]">{v.visit_code}</p>
          <div className="mt-2 border-t border-dashed border-slate-300 pt-1.5 text-[8px] leading-tight text-slate-600">
            <p>Bertemu: <b>{v.pic_name || '-'}</b></p>
            <p>{v.pic_location || 'Lobby'} · {fmtDate(v.queue_date)}</p>
          </div>
        </div>
      </div>
      <p className="no-print mt-4 text-center text-xs text-slate-500">Ukuran kartu 54 × 86 mm. Pada dialog cetak, pilih skala 100%.</p>
    </div>
  );
}
