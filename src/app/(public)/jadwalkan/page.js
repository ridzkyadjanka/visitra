import VisitForm from '@/components/VisitForm';
import FormShell from '../FormShell';
import { query } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { todayKey, addDays } from '@/lib/time';

export const metadata = { title: 'Jadwalkan Kunjungan' };
export const dynamic = 'force-dynamic';

export default async function JadwalkanPage() {
  const [s, pics] = await Promise.all([
    getSettings(),
    query('SELECT id, name, department FROM pics WHERE active ORDER BY name'),
  ]);
  return (
    <FormShell
      title="Jadwalkan Kunjungan"
      sub="Ajukan janji temu terlebih dahulu. Tim kami akan meninjau dan menyetujuinya."
      side={{
        kicker: 'Janji Temu',
        title: 'Datang sesuai jadwal, tanpa menunggu lama.',
        points: [
          'Ajukan tanggal & jam kunjungan',
          'Status persetujuan dapat dipantau dari tiket Anda',
          'Saat tiba, cukup tunjukkan QR Code di resepsionis',
          'Nomor antrean diterbitkan pada hari kunjungan',
        ],
      }}
    >
      <VisitForm mode="schedule" pics={pics} purposes={s.purposeList} minDate={todayKey()} initial={{ date: addDays(todayKey(), 1) }} />
    </FormShell>
  );
}
