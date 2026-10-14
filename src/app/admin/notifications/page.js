import Link from 'next/link';
import { Bell } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { fmtDateTime } from '@/lib/time';
import { PageHeader, Empty } from '@/components/ui';
import AutoRefresh from '@/components/AutoRefresh';
import MarkRead from './MarkRead';

export const metadata = { title: 'Notifikasi' };

export default async function NotificationsPage() {
  await requireUser();
  const rows = await query(
    `SELECT n.*, p.name AS pic_name, p.email AS pic_email, p.phone AS pic_phone
       FROM notifications n LEFT JOIN pics p ON p.id = n.pic_id ORDER BY n.created_at DESC LIMIT 50`);
  return (
    <div>
      <AutoRefresh seconds={20} />
      <PageHeader title="Notifikasi Kedatangan Tamu" sub="Pemberitahuan otomatis untuk PIC setiap kali tamu check-in.">
        <MarkRead />
      </PageHeader>
      <div className="card divide-y divide-slate-100">
        {rows.map((n) => (
          <div key={n.id} className={`flex gap-4 p-4 ${n.read ? '' : 'bg-brand-50/50'}`}>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${n.read ? 'bg-slate-100 text-slate-500' : 'bg-brand-600 text-white'}`}><Bell className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{n.title} — untuk {n.pic_name || 'PIC'}</p>
              <p className="text-sm text-slate-600">{n.message}</p>
              <p className="mt-1 text-xs text-slate-500">{fmtDateTime(n.created_at)}{n.pic_email && ` · ${n.pic_email}`}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {n.visit_id && <Link href={`/admin/visitors/${n.visit_id}`} className="btn-ghost btn-sm">Lihat tamu</Link>}
              {n.pic_phone && (
                <a target="_blank" rel="noreferrer" className="btn-outline btn-sm"
                  href={`https://wa.me/${n.pic_phone.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(n.message)}`}>
                  Kirim via WhatsApp
                </a>
              )}
            </div>
          </div>
        ))}
        {!rows.length && <Empty title="Belum ada notifikasi" sub="Notifikasi muncul saat tamu check-in." />}
      </div>
    </div>
  );
}
