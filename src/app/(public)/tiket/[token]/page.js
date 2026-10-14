import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, CalendarClock, User, Building2, Target, UserCheck, MapPin, Clock } from 'lucide-react';
import { one } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { qrDataUrl } from '@/lib/qr';
import { fmtDateLong, fmtTime, tzLabel, fmtDuration, minutesBetween } from '@/lib/time';
import { StatusBadge, ApprovalBadge } from '@/components/ui';
import PrintButton from '@/components/PrintButton';
import AutoRefresh from '@/components/AutoRefresh';
import { LogoMark } from '@/components/Logo';

export const metadata = { title: 'Tiket Kunjungan', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function TiketPage({ params, searchParams }) {
  const v = await one(
    `SELECT v.*, p.name AS pic_name, p.location AS pic_location
       FROM visits v LEFT JOIN pics p ON p.id = v.pic_id WHERE v.access_token = $1`,
    [params.token],
  );
  if (!v) notFound();
  const s = await getSettings();
  const qr = await qrDataUrl(v.visit_code);
  const scheduled = v.status === 'SCHEDULED';
  const when = scheduled ? v.scheduled_at : v.check_in_at || v.created_at;

  const rows = [
    [User, 'Nama', v.name],
    [Building2, 'Instansi', v.institution],
    [Target, 'Tujuan', v.purpose],
    [UserCheck, 'PIC', v.pic_name || '-'],
    [MapPin, 'Lokasi', v.pic_location || 'Lobby utama'],
  ];
  if (v.check_in_at) rows.push([Clock, 'Check-in', `${fmtTime(v.check_in_at)} ${tzLabel}`]);
  if (v.check_out_at) rows.push([Clock, 'Check-out', `${fmtTime(v.check_out_at)} ${tzLabel} · ${fmtDuration(minutesBetween(v.check_in_at, v.check_out_at))}`]);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      {['REGISTERED', 'SCHEDULED', 'CHECKED_IN'].includes(v.status) && <AutoRefresh seconds={20} />}

      {(searchParams.baru || searchParams.jadwal) && (
        <div className="no-print mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">{searchParams.jadwal ? 'Janji Temu Diajukan!' : 'Pendaftaran Berhasil!'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {searchParams.jadwal
              ? 'Simpan halaman ini untuk memantau status persetujuan.'
              : 'Terima kasih atas kunjungan Anda. Simpan atau screenshot tiket ini.'}
          </p>
        </div>
      )}

      <div className="card print-area overflow-hidden rounded-3xl">
        <div className="flex items-center gap-3 bg-navy-900 px-6 py-4 text-white">
          <LogoMark className="h-8 w-8" />
          <div className="leading-tight">
            <p className="text-sm font-bold">{s.company_name}</p>
            <p className="text-xs text-slate-300">{s.address}</p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {scheduled ? 'Janji Temu' : 'Nomor Pengunjung'}
          </p>
          {scheduled ? (
            <p className="mt-2 flex items-center justify-center gap-2 text-2xl font-extrabold"><CalendarClock className="h-6 w-6 text-brand-600" />{fmtTime(v.scheduled_at)} {tzLabel}</p>
          ) : (
            <p className="mt-1 text-6xl font-extrabold tracking-tight text-navy-900">{v.queue_number}</p>
          )}
          <p className="mt-1 text-sm text-slate-600">{fmtDateLong(when)}{!scheduled && `, ${fmtTime(when)} ${tzLabel}`}</p>
          <div className="mt-3 flex justify-center gap-2">
            <StatusBadge status={v.status} />
            {scheduled && <ApprovalBadge approval={v.approval} />}
          </div>

          <div className="mx-auto mt-5 w-48 rounded-2xl border border-slate-200 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`QR Code ${v.visit_code}`} className="h-auto w-full" />
          </div>
          <p className="mt-2 font-mono text-sm font-semibold tracking-wide">{v.visit_code}</p>
        </div>

        <div className="border-t border-dashed border-slate-300 px-6 py-5">
          <dl className="space-y-2.5 text-sm">
            {rows.map(([Icon, k, val]) => (
              <div key={k} className="flex gap-3">
                <dt className="flex w-28 shrink-0 items-center gap-2 text-slate-500"><Icon className="h-4 w-4" />{k}</dt>
                <dd className="font-medium text-navy-900">{val}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-center text-xs text-slate-500">
          {v.status === 'REGISTERED' && 'Silakan tunjukkan QR Code ini kepada resepsionis dan tunggu konfirmasi.'}
          {v.status === 'SCHEDULED' && v.approval === 'PENDING' && 'Janji temu Anda sedang ditinjau. Halaman ini diperbarui otomatis.'}
          {v.status === 'SCHEDULED' && v.approval === 'APPROVED' && 'Janji temu disetujui. Tunjukkan QR ini saat tiba di lobby.'}
          {v.status === 'SCHEDULED' && v.approval === 'REJECTED' && 'Mohon maaf, janji temu tidak dapat dijadwalkan. Silakan hubungi PIC terkait.'}
          {v.status === 'CHECKED_IN' && 'Anda sedang berkunjung. Tunjukkan QR saat keluar untuk check-out.'}
          {v.status === 'CHECKED_OUT' && 'Kunjungan selesai. Terima kasih atas kunjungan Anda!'}
          {v.status === 'CANCELLED' && 'Kunjungan ini telah dibatalkan.'}
        </p>
      </div>

      <div className="no-print mt-6 grid grid-cols-2 gap-3">
        <PrintButton />
        <Link href="/" className="btn-outline">Selesai</Link>
      </div>
    </div>
  );
}
