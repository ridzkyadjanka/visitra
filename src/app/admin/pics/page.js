import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { can } from '@/lib/constants';
import { PageHeader } from '@/components/ui';
import PicManager from './PicManager';

export const metadata = { title: 'Manajemen PIC' };

export default async function PicsPage() {
  const user = await requireUser();
  const pics = await query(
    `SELECT p.*, (SELECT COUNT(*)::int FROM visits v WHERE v.pic_id = p.id) AS visits FROM pics p ORDER BY p.active DESC, p.name`);
  return (
    <div>
      <PageHeader title="Data Person in Charge (PIC)" sub="Kelola daftar karyawan / penanggung jawab yang dapat ditemui pengunjung." />
      <PicManager pics={pics} canEdit={can(user.role, 'pics.write')} />
    </div>
  );
}
