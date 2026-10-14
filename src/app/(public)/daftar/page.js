import VisitForm from '@/components/VisitForm';
import FormShell from '../FormShell';
import { query } from '@/lib/db';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Registrasi Kunjungan' };
export const dynamic = 'force-dynamic';

export default async function DaftarPage() {
  const [s, pics] = await Promise.all([
    getSettings(),
    query('SELECT id, name, department FROM pics WHERE active ORDER BY name'),
  ]);
  return (
    <FormShell
      title="Selamat Datang"
      sub={`Silakan isi data kunjungan Anda di ${s.company_name}.`}
      side={{
        kicker: 'Registrasi Tamu',
        title: 'Daftar dalam kurang dari satu menit.',
        points: [
          'Nomor pengunjung diterbitkan otomatis',
          'Tiket digital dengan QR Code tersimpan di ponsel Anda',
          'Tunjukkan QR kepada resepsionis untuk verifikasi',
          `Jam operasional ${s.open_time}–${s.close_time}`,
        ],
      }}
    >
      <VisitForm pics={pics} purposes={s.purposeList} />
    </FormShell>
  );
}
