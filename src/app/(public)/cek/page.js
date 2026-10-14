import CekForm from './CekForm';

export const metadata = { title: 'Cek Tiket' };

export default function CekPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Cek Tiket Kunjungan</h1>
        <p className="mt-1 text-sm text-slate-500">Buka kembali tiket digital dan status kunjungan Anda.</p>
        <div className="mt-6"><CekForm /></div>
      </div>
    </div>
  );
}
