'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Power, Search } from 'lucide-react';
import Modal from '@/components/Modal';
import { savePic, togglePic, deletePic } from '@/app/actions/admin';

function Save() {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full" disabled={pending}>{pending ? 'Menyimpan...' : 'Simpan'}</button>;
}

function PicForm({ pic, onDone }) {
  const [state, action] = useFormState(savePic, {});
  useEffect(() => { if (state?.ok) onDone(); }, [state, onDone]);
  return (
    <form action={action} className="space-y-4">
      {pic?.id && <input type="hidden" name="id" value={pic.id} />}
      {state?.error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>}
      <div><label className="label">Nama PIC *</label><input name="name" defaultValue={pic?.name} className="input" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Departemen *</label><input name="department" defaultValue={pic?.department} className="input" placeholder="HRD" /></div>
        <div><label className="label">Lokasi *</label><input name="location" defaultValue={pic?.location} className="input" placeholder="Lantai 2" /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Email</label><input name="email" type="email" defaultValue={pic?.email || ''} className="input" /></div>
        <div><label className="label">Telepon</label><input name="phone" defaultValue={pic?.phone || ''} className="input" /></div>
      </div>
      <Save />
    </form>
  );
}

export default function PicManager({ pics, canEdit }) {
  const [editing, setEditing] = useState(null); // null | {} | pic
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [, start] = useTransition();
  const router = useRouter();
  const list = pics.filter((p) => `${p.name} ${p.department} ${p.location}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="Cari PIC..." />
        </div>
        {canEdit && <button onClick={() => setEditing({})} className="btn-primary"><Plus className="h-4 w-4" />Tambah PIC</button>}
      </div>
      {err && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr><th className="th">No.</th><th className="th">Nama PIC</th><th className="th">Departemen</th><th className="th">Lokasi</th><th className="th">Kontak</th><th className="th">Kunjungan</th><th className="th">Status</th>{canEdit && <th className="th text-right">Aksi</th>}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((p, i) => (
              <tr key={p.id} className={p.active ? '' : 'opacity-60'}>
                <td className="td text-slate-500">{i + 1}</td>
                <td className="td font-semibold">{p.name}</td>
                <td className="td">{p.department}</td>
                <td className="td">{p.location}</td>
                <td className="td text-xs text-slate-500">{p.email || '-'}<br />{p.phone || ''}</td>
                <td className="td">{p.visits}</td>
                <td className="td"><span className={`badge ${p.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>{p.active ? 'Aktif' : 'Nonaktif'}</span></td>
                {canEdit && (
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(p)} className="btn-ghost btn-sm" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => start(async () => { await togglePic(p.id); router.refresh(); })} className="btn-ghost btn-sm" title={p.active ? 'Nonaktifkan' : 'Aktifkan'}><Power className="h-4 w-4" /></button>
                      <button onClick={() => confirm(`Hapus PIC ${p.name}?`) && start(async () => { const r = await deletePic(p.id); setErr(r?.error || ''); router.refresh(); })} className="btn-ghost btn-sm text-rose-600" title="Hapus"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit PIC' : 'Tambah PIC'}>
        {editing && <PicForm key={editing.id || 'new'} pic={editing} onDone={() => { setEditing(null); router.refresh(); }} />}
      </Modal>
    </>
  );
}
