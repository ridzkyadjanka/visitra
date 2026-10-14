'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck } from 'lucide-react';
import { markNotificationsRead } from '@/app/actions/visits';

export default function MarkRead() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button disabled={pending} onClick={() => start(async () => { await markNotificationsRead(); router.refresh(); })} className="btn-outline">
      <CheckCheck className="h-4 w-4" />Tandai semua dibaca
    </button>
  );
}
