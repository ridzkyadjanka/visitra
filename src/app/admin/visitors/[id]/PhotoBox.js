'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Trash2, Loader2, UserRound } from 'lucide-react';
import { updatePhoto } from '@/app/actions/visits';

// Perkecil gambar di browser sebelum disimpan (maks 360px, JPEG)
function resize(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const max = 360, r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r);
      c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function PhotoBox({ id, photo, editable }) {
  const input = useRef(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState('');
  const router = useRouter();

  const save = (dataUrl) => start(async () => {
    const r = await updatePhoto(id, dataUrl);
    if (r?.error) setErr(r.error);
    router.refresh();
  });

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold">Foto Tamu <span className="font-normal text-slate-400">(opsional)</span></h3>
      <div className="mx-auto mt-4 grid aspect-square w-40 place-items-center overflow-hidden rounded-2xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo ? <img src={photo} alt="Foto tamu" className="h-full w-full object-cover" /> : <UserRound className="h-16 w-16 text-slate-300" />}
      </div>
      {editable && (
        <div className="mt-4 flex justify-center gap-2">
          <input ref={input} type="file" accept="image/*" capture="user" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) save(await resize(f)); e.target.value = ''; }} />
          <button onClick={() => input.current?.click()} disabled={pending} className="btn-outline btn-sm">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} {photo ? 'Ganti' : 'Ambil / Unggah'}
          </button>
          {photo && <button onClick={() => confirm('Hapus foto?') && save(null)} disabled={pending} className="btn-danger btn-sm"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      )}
      {err && <p className="mt-2 text-center text-xs text-rose-600">{err}</p>}
    </div>
  );
}
