import Link from 'next/link';
import Logo from './Logo';

export default function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="VISITRA beranda">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#fitur" className="hover:text-brand-600">Fitur</Link>
          <Link href="/#alur" className="hover:text-brand-600">Alur Kunjungan</Link>
          <Link href="/cek" className="hover:text-brand-600">Cek Tiket</Link>
          <Link href="/jadwalkan" className="hover:text-brand-600">Jadwalkan</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">Masuk Staf</Link>
          <Link href="/daftar" className="btn-primary">Daftar Kunjungan</Link>
        </div>
      </div>
    </header>
  );
}
