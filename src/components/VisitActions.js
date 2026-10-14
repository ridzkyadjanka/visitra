'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, Check, X, Ban, Loader2 } from 'lucide-react';
import { checkIn, checkOut, setApproval, cancelVisit } from '@/app/actions/visits';

export default function VisitActions({ visit, size = 'sm', show = ['in', 'out'], onDone }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState('');
  const router = useRouter();
  const run = (fn, confirmMsg) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setErr('');
    start(async () => {
      const r = await fn();
      if (r?.error) setErr(r.error);
      router.refresh();
      onDone?.();
    });
  };
  const cls = size === 'sm' ? 'btn-sm' : '';
  const s = visit.status;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      {show.includes('approve') && s === 'SCHEDULED' && visit.approval === 'PENDING' && (
        <>
          <button disabled={pending} onClick={() => run(() => setApproval(visit.id, 'APPROVED'))} className={`btn-success ${cls}`}><Check className="h-3.5 w-3.5" />Setujui</button>
          <button disabled={pending} onClick={() => run(() => setApproval(visit.id, 'REJECTED'), 'Tolak janji temu ini?')} className={`btn-danger ${cls}`}><X className="h-3.5 w-3.5" />Tolak</button>
        </>
      )}
      {show.includes('in') && (s === 'REGISTERED' || (s === 'SCHEDULED' && visit.approval !== 'REJECTED')) && (
        <button disabled={pending} onClick={() => run(() => checkIn(visit.id))} className={`btn-primary ${cls}`}><LogIn className="h-3.5 w-3.5" />Check-in</button>
      )}
      {show.includes('out') && s === 'CHECKED_IN' && (
        <button disabled={pending} onClick={() => run(() => checkOut(visit.id))} className={`btn-navy ${cls}`}><LogOut className="h-3.5 w-3.5" />Check-out</button>
      )}
      {show.includes('cancel') && ['REGISTERED', 'SCHEDULED'].includes(s) && (
        <button disabled={pending} onClick={() => run(() => cancelVisit(visit.id), 'Batalkan kunjungan ini?')} className={`btn-ghost ${cls}`}><Ban className="h-3.5 w-3.5" />Batalkan</button>
      )}
      {err && <span className="text-xs font-medium text-rose-600">{err}</span>}
    </div>
  );
}
