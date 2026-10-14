'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { Camera, CameraOff, Search, Loader2, User, Building2, Target, UserCheck, Clock } from 'lucide-react';
import { lookupVisit } from '@/app/actions/visits';
import VisitActions from '@/components/VisitActions';
import { StatusBadge, ApprovalBadge } from '@/components/ui';

const fmt = (v) => (v ? new Date(v).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : '-');

export default function Scanner() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [pending, start] = useTransition();
  const scannerRef = useRef(null);
  const lastRef = useRef('');

  const search = (value) => {
    const q = (value ?? code).trim();
    if (!q) return;
    setError('');
    start(async () => {
      const r = await lookupVisit(q);
      if (r.error) { setError(r.error); setResult(null); }
      else setResult(r.visit);
    });
  };

  const stopScan = async () => {
    try { await scannerRef.current?.stop(); scannerRef.current?.clear(); } catch {}
    scannerRef.current = null;
    setScanning(false);
  };

  const startScan = async () => {
    setError('');
    const { Html5Qrcode } = await import('html5-qrcode');
    const sc = new Html5Qrcode('qr-reader');
    scannerRef.current = sc;
    try {
      await sc.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (text) => {
          if (text === lastRef.current) return;
          lastRef.current = text;
          setCode(text);
          search(text);
          setTimeout(() => (lastRef.current = ''), 3000);
        },
      );
      setScanning(true);
    } catch (e) {
      setError('Kamera tidak dapat diakses. Izinkan akses kamera atau gunakan input manual. (' + (e?.message || e) + ')');
      scannerRef.current = null;
    }
  };

  useEffect(() => () => { stopScan(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // refresh data setelah aksi check-in/out
  const refreshResult = () => result && search(result.visit_code);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h2 className="font-bold">Pindai QR Code Tiket</h2>
        <p className="mt-1 text-sm text-slate-500">Arahkan kamera ke QR Code pada tiket pengunjung.</p>
        <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-2xl bg-navy-950 sm:aspect-video lg:aspect-square">
          <div id="qr-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
          {!scanning && (
            <div className="absolute inset-0 grid place-items-center text-center text-slate-300">
              <div>
                <Camera className="mx-auto h-10 w-10 text-brand-200" />
                <p className="mt-2 text-sm">Kamera belum aktif</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          {scanning ? (
            <button onClick={stopScan} className="btn-outline flex-1"><CameraOff className="h-4 w-4" />Matikan Kamera</button>
          ) : (
            <button onClick={startScan} className="btn-navy flex-1"><Camera className="h-4 w-4" />Aktifkan Kamera</button>
          )}
        </div>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); search(); }}
        >
          <input value={code} onChange={(e) => setCode(e.target.value)} className="input font-mono uppercase" placeholder="VIS-20261014-0015 atau A-015" />
          <button className="btn-primary" disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Cari</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Bisa juga memasukkan nomor antrean hari ini (mis. A-015) atau memakai pemindai barcode USB.</p>
      </div>

      <div className="card p-5">
        <h2 className="font-bold">Hasil Verifikasi</h2>
        {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {!result && !error && (
          <div className="grid h-64 place-items-center text-center text-sm text-slate-400">Belum ada tiket yang dipindai.</div>
        )}
        {result && (
          <div className="mt-4">
            <div className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{result.status === 'SCHEDULED' ? 'Janji Temu' : 'Nomor Pengunjung'}</p>
                <p className="text-4xl font-extrabold tracking-tight">{result.queue_number === '-' ? 'APT' : result.queue_number}</p>
                <p className="font-mono text-xs text-slate-500">{result.visit_code}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={result.status} />
                {result.status === 'SCHEDULED' && <ApprovalBadge approval={result.approval} />}
              </div>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              {[[User, 'Nama', result.name], [Building2, 'Instansi', result.institution], [Target, 'Tujuan', result.purpose],
                [UserCheck, 'PIC', result.pic_name ? `${result.pic_name} · ${result.pic_location}` : '-'],
                [Clock, 'Check-in', fmt(result.check_in_at)], [Clock, 'Check-out', fmt(result.check_out_at)]].map(([I, k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="flex w-24 shrink-0 items-center gap-2 text-slate-500"><I className="h-4 w-4" />{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <VisitActions visit={result} size="md" show={['in', 'out', 'approve']} onDone={refreshResult} />
              <Link href={`/admin/visitors/${result.id}`} className="btn-outline">Detail</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
