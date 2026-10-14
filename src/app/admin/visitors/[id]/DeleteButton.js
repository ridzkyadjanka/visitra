'use client';
import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteVisit } from '@/app/actions/visits';

export default function DeleteButton({ id }) {
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} className="btn-danger"
      onClick={() => confirm('Hapus data kunjungan ini secara permanen?') && start(() => deleteVisit(id))}>
      <Trash2 className="h-4 w-4" /> {pending ? 'Menghapus...' : 'Hapus Data'}
    </button>
  );
}
