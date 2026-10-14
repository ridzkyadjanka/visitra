import { requirePerm } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { PageHeader } from '@/components/ui';
import VisitForm from '@/components/VisitForm';

export const metadata = { title: 'Registrasi Tamu' };

export default async function NewVisitorPage() {
  await requirePerm('visits.write');
  const [s, pics] = await Promise.all([getSettings(), query('SELECT id, name, department FROM pics WHERE active ORDER BY name')]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Registrasi Tamu (Walk-in)" sub="Daftarkan tamu yang datang langsung ke meja resepsionis." />
      <div className="card p-6"><VisitForm source="admin" pics={pics} purposes={s.purposeList} submitLabel="Simpan & Terbitkan Nomor" /></div>
    </div>
  );
}
