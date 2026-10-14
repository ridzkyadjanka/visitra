import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
      <div>
        <Logo />
        <p className="mt-10 text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-2 text-xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-1 text-sm text-slate-500">Tautan mungkin salah atau tiket sudah tidak tersedia.</p>
        <Link href="/" className="btn-primary mt-6">Kembali ke Beranda</Link>
      </div>
    </div>
  );
}
