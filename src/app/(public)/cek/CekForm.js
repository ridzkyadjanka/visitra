'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { findTicket } from '@/app/actions/visits';

function Btn() {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full py-3" disabled={pending}>{pending ? 'Mencari...' : 'Tampilkan Tiket'}</button>;
}

export default function CekForm() {
  const [state, action] = useFormState(findTicket, {});
  return (
    <form action={action} className="space-y-4">
      {state?.error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>}
      <div>
        <label className="label" htmlFor="code">Kode Kunjungan</label>
        <input id="code" name="code" className="input uppercase" placeholder="VIS-20261014-0015" />
      </div>
      <div>
        <label className="label" htmlFor="last4">4 Digit Terakhir Nomor HP</label>
        <input id="last4" name="last4" inputMode="numeric" maxLength={4} className="input" placeholder="7890" />
      </div>
      <Btn />
    </form>
  );
}
