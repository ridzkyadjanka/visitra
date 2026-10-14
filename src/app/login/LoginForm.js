'use client';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { login } from '@/app/actions/auth';

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary w-full py-3" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />} {pending ? 'Memeriksa...' : 'Login'}
    </button>
  );
}

export default function LoginForm({ next }) {
  const [state, action] = useFormState(login, {});
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state?.error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" placeholder="admin@perusahaan.com" defaultValue={state?.email} autoComplete="username" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <div className="relative">
          <input id="password" name="password" type={show ? 'text' : 'password'} className="input pr-11" placeholder="••••••••" autoComplete="current-password" required />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900" aria-label="Tampilkan password">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" name="remember" className="h-4 w-4 accent-brand-600" /> Ingat saya</label>
        <span className="text-xs text-slate-400">Lupa password? Hubungi admin</span>
      </div>
      <Btn />
    </form>
  );
}
