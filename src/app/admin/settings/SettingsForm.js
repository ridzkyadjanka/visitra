'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { saveSettings } from '@/app/actions/admin';
import { changeOwnPassword } from '@/app/actions/auth';

function Save({ children = 'Simpan Pengaturan' }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary" disabled={pending}>{pending ? 'Menyimpan...' : children}</button>;
}
function Msg({ state }) {
  if (state?.error) return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>;
  if (state?.ok) return <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.ok}</div>;
  return null;
}

export function SettingsForm({ s, sample }) {
  const [state, action] = useFormState(saveSettings, {});
  return (
    <form action={action} className="space-y-6">
      <Msg state={state} />
      <section className="card p-6">
        <h2 className="font-bold">Profil Perusahaan</h2>
        <p className="text-sm text-slate-500">Ditampilkan pada landing page, tiket, dan badge tamu.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Nama Perusahaan / Instansi</label><input name="company_name" defaultValue={s.company_name} className="input" /></div>
          <div className="sm:col-span-2"><label className="label">Alamat</label><input name="address" defaultValue={s.address} className="input" /></div>
          <div><label className="label">Telepon</label><input name="phone" defaultValue={s.phone} className="input" /></div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Penomoran Tamu</h2>
        <p className="text-sm text-slate-500">Nomor antrean direset setiap hari, kode kunjungan selalu unik.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className="label">Prefix Nomor Antrean</label><input name="queue_prefix" defaultValue={s.queue_prefix} maxLength={3} className="input uppercase" /></div>
          <div><label className="label">Prefix Kode Kunjungan</label><input name="code_prefix" defaultValue={s.code_prefix} maxLength={6} className="input uppercase" /></div>
        </div>
        <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">Contoh: <b>{s.queue_prefix}-015</b> · <span className="font-mono">{sample}</span></p>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Operasional</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className="label">Jam Buka</label><input type="time" name="open_time" defaultValue={s.open_time} className="input" /></div>
          <div><label className="label">Jam Tutup</label><input type="time" name="close_time" defaultValue={s.close_time} className="input" /></div>
          <div className="sm:col-span-2">
            <label className="label">Pilihan Tujuan Kunjungan</label>
            <textarea name="purposes" rows={4} defaultValue={s.purposeList.join('\n')} className="input" />
            <p className="mt-1 text-xs text-slate-500">Satu tujuan per baris.</p>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Keamanan &amp; Privasi</h2>
        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="mask_personal" defaultChecked={s.mask_personal} className="mt-0.5 h-4 w-4 accent-brand-600" />
            <span><b>Samarkan data pribadi</b><br /><span className="text-slate-500">Nomor HP & email tamu disensor untuk peran Viewer.</span></span></label>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="require_photo" defaultChecked={s.require_photo} className="mt-0.5 h-4 w-4 accent-brand-600" />
            <span><b>Wajib foto saat check-in</b><br /><span className="text-slate-500">Resepsionis harus mengambil foto tamu sebelum check-in.</span></span></label>
          <div className="max-w-xs"><label className="label">Durasi sesi login (jam)</label><input type="number" min={1} max={72} name="session_hours" defaultValue={s.session_hours} className="input" /></div>
        </div>
      </section>
      <div className="flex justify-end"><Save /></div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useFormState(changeOwnPassword, {});
  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-bold">Ganti Password Saya</h2>
      <Msg state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Password saat ini</label><input type="password" name="current" className="input" autoComplete="current-password" /></div>
        <div><label className="label">Password baru</label><input type="password" name="next" className="input" autoComplete="new-password" placeholder="Minimal 8 karakter" /></div>
      </div>
      <div className="flex justify-end"><Save>Perbarui Password</Save></div>
    </form>
  );
}
