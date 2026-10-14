'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { registerVisit, scheduleVisit, updateVisit } from '@/app/actions/visits';

function Submit({ children }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-base">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? 'Memproses...' : children}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function Err({ msg }) {
  return msg ? <p className="mt-1 text-xs font-medium text-rose-600">{msg}</p> : null;
}

/**
 * mode: 'walkin' | 'schedule' | 'edit'
 * source: 'public' | 'admin'
 */
export default function VisitForm({ mode = 'walkin', source = 'public', pics = [], purposes = [], initial = {}, minDate, submitLabel }) {
  const action = mode === 'schedule' ? scheduleVisit : mode === 'edit' ? updateVisit : registerVisit;
  const [state, formAction] = useFormState(action, {});
  const e = state?.errors || {};
  const v = { ...initial, ...(state?.values || {}) };
  const isEdit = mode === 'edit';

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="source" value={source} />
      {isEdit && <input type="hidden" name="id" value={initial.id} />}

      {state?.ok && isEdit && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Perubahan tersimpan.</div>
      )}

      <div>
        <label className="label" htmlFor="name">Nama Lengkap <span className="text-rose-500">*</span></label>
        <input id="name" name="name" className="input" placeholder="Masukkan nama lengkap" defaultValue={v.name} autoComplete="name" />
        <Err msg={e.name} />
      </div>
      <div>
        <label className="label" htmlFor="institution">Instansi / Perusahaan <span className="text-rose-500">*</span></label>
        <input id="institution" name="institution" className="input" placeholder="Contoh: PT ABC" defaultValue={v.institution} autoComplete="organization" />
        <Err msg={e.institution} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="phone">Nomor HP <span className="text-rose-500">*</span></label>
          <input id="phone" name="phone" type="tel" inputMode="tel" className="input" placeholder="08xxxxxxxxxx" defaultValue={v.phone} autoComplete="tel" />
          <Err msg={e.phone} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email <span className="text-xs font-normal text-slate-400">(opsional)</span></label>
          <input id="email" name="email" type="email" className="input" placeholder="nama@email.com" defaultValue={v.email || ''} autoComplete="email" />
          <Err msg={e.email} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="purpose">Tujuan Kunjungan <span className="text-rose-500">*</span></label>
          <select id="purpose" name="purpose" className="input" defaultValue={v.purpose || ''}>
            <option value="" disabled>Pilih tujuan kunjungan</option>
            {purposes.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <Err msg={e.purpose} />
        </div>
        <div>
          <label className="label" htmlFor="picId">Orang yang Ditemui (PIC)</label>
          <select id="picId" name="picId" className="input" defaultValue={v.picId || v.pic_id || ''}>
            <option value="">— Pilih PIC (opsional) —</option>
            {pics.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.department}</option>)}
          </select>
        </div>
      </div>

      {mode === 'schedule' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="date">Tanggal Kunjungan <span className="text-rose-500">*</span></label>
            <input id="date" name="date" type="date" min={minDate} className="input" defaultValue={v.date} />
            <Err msg={e.date} />
          </div>
          <div>
            <label className="label" htmlFor="time">Jam <span className="text-rose-500">*</span></label>
            <input id="time" name="time" type="time" className="input" defaultValue={v.time || '10:00'} />
            <Err msg={e.time} />
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor="notes">Keterangan <span className="text-xs font-normal text-slate-400">(opsional)</span></label>
        <textarea id="notes" name="notes" rows={3} className="input resize-none" placeholder="Contoh: Diskusi kerja sama proyek" defaultValue={v.notes || ''} />
      </div>

      {source === 'admin' && mode === 'walkin' && (
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm">
          <input type="checkbox" name="checkInNow" defaultChecked className="h-4 w-4 rounded accent-brand-600" />
          Langsung check-in (tamu sudah berada di lobby)
        </label>
      )}

      {!isEdit && (
        <div>
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input type="checkbox" name="consent" defaultChecked={source === 'admin'} className="mt-0.5 h-4 w-4 rounded accent-brand-600" />
            <span>Saya menyetujui data ini digunakan hanya untuk keperluan pencatatan kunjungan dan keamanan gedung.</span>
          </label>
          <Err msg={e.consent} />
        </div>
      )}
      {isEdit && <input type="hidden" name="consent" value="on" />}

      <Submit>{submitLabel || (mode === 'schedule' ? 'Ajukan Janji Temu' : isEdit ? 'Simpan Perubahan' : 'Lanjutkan')}</Submit>
    </form>
  );
}
