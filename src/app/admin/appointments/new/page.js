import { requirePerm } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { todayKey, addDays } from '@/lib/time';
import { PageHeader } from '@/components/ui';
import VisitForm from '@/components/VisitForm';

export const metadata = { title: 'Buat Janji Temu' };

export default async function NewAppointment() {
  await requirePerm('appointments.approve');
  const [s, pics] = await Promise.all([getSettings(), query('SELECT id, name, department FROM pics WHERE active ORDER BY name')]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Buat Janji Temu" sub="Janji temu yang dibuat staf langsung berstatus disetujui." />
      <div className="card p-6">
        <VisitForm mode="schedule" source="admin" pics={pics} purposes={s.purposeList} minDate={todayKey()} initial={{ date: addDays(todayKey(), 1) }} submitLabel="Simpan Janji Temu" />
      </div>
    </div>
  );
}
