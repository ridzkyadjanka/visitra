'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Power } from 'lucide-react';
import Modal from '@/components/Modal';
import { saveUser, toggleUser, deleteUser } from '@/app/actions/admin';
import { ROLES, ROLE_DESC } from '@/lib/constants';

function Save() {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full" disabled={pending}>{pending ? 'Menyimpan...' : 'Simpan'}</button>;
}

function UserForm({ u, onDone }) {
  const [state, action] = useFormState(saveUser, {});
  useEffect(() => { if (state?.ok) onDone(); }, [state, onDone]);
  return (
    <form action={action} className="space-y-4">
      {u?.id && <input type="hidden" name="id" value={u.id} />}
      {state?.error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>}
      <div><label className="label">Nama *</label><input name="name" defaultValue={u?.name} className="input" /></div>
      <div><label className="label">Email *</label><input name="email" type="email" defaultValue={u?.email} className="input" /></div>
      <div>
        <label className="label">Peran (Role) *</label>
        <select name="role" defaultValue={u?.role || 'RECEPTIONIST'} className="input">
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v} — {ROLE_DESC[k]}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{u?.id ? 'Reset Password (kosongkan jika tidak diubah)' : 'Password *'}</label>
        <input name="password" type="password" className="input" placeholder="Minimal 8 karakter" autoComplete="new-password" />
      </div>
      <Save />
    </form>
  );
}

const roleCls = {
  SUPER_ADMIN: 'bg-navy-900 text-white ring-navy-900',
  ADMIN: 'bg-brand-50 text-brand-700 ring-brand-200',
  RECEPTIONIST: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  VIEWER: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function UserManager({ users, meId }) {
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const [, start] = useTransition();
  const router = useRouter();
  const act = (fn) => start(async () => { const r = await fn(); setErr(r?.error || ''); router.refresh(); });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setEditing({})} className="btn-primary"><Plus className="h-4 w-4" />Tambah User</button>
      </div>
      {err && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr><th className="th">Nama</th><th className="th">Email</th><th className="th">Role</th><th className="th">Login Terakhir</th><th className="th">Status</th><th className="th text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="td font-semibold">{u.name}{u.id === meId && <span className="ml-2 text-xs font-normal text-slate-400">(Anda)</span>}</td>
                <td className="td">{u.email}</td>
                <td className="td"><span className={`badge ${roleCls[u.role]}`}>{ROLES[u.role]}</span></td>
                <td className="td text-xs text-slate-500">{u.last_login}</td>
                <td className="td"><span className={`badge ${u.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>{u.active ? 'Aktif' : 'Nonaktif'}</span></td>
                <td className="td">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(u)} className="btn-ghost btn-sm" title="Edit"><Pencil className="h-4 w-4" /></button>
                    {u.id !== meId && <>
                      <button onClick={() => act(() => toggleUser(u.id))} className="btn-ghost btn-sm" title="Aktif/nonaktif"><Power className="h-4 w-4" /></button>
                      <button onClick={() => confirm(`Hapus akun ${u.email}?`) && act(() => deleteUser(u.id))} className="btn-ghost btn-sm text-rose-600" title="Hapus"><Trash2 className="h-4 w-4" /></button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit User' : 'Tambah User'}>
        {editing && <UserForm key={editing.id || 'new'} u={editing} onDone={() => { setEditing(null); router.refresh(); }} />}
      </Modal>
    </>
  );
}
