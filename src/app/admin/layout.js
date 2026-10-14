import AdminShell from '@/components/AdminShell';
import { requireUser } from '@/lib/auth';
import { one } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin' };

export default async function AdminLayout({ children }) {
  const user = await requireUser();
  const { n } = await one('SELECT COUNT(*)::int AS n FROM notifications WHERE read = FALSE');
  return <AdminShell user={user} unread={n}>{children}</AdminShell>;
}
