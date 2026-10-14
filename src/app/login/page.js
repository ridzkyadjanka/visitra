import Link from 'next/link';
import Logo from '@/components/Logo';
import LoginForm from './LoginForm';

export const metadata = { title: 'Login Staf' };

export default function LoginPage({ searchParams }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/"><Logo /></Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold tracking-tight">Login Staf</h1>
          <p className="mt-2 text-sm text-slate-500">Masuk untuk mengelola data tamu dan resepsionis.</p>
          <div className="mt-8"><LoginForm next={searchParams.next || '/admin'} /></div>
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-semibold text-navy-900">Akun demo</p>
            <p className="mt-1">admin@visitra.id · resepsionis@visitra.id</p>
            <p>Password: <span className="font-mono">admin123</span></p>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            Akun staf dibuat oleh administrator. Pengunjung tidak perlu akun — <Link href="/daftar" className="font-semibold text-brand-600">daftar kunjungan di sini</Link>.
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-brand-600/50 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-end p-14 text-white">
          <p className="text-4xl font-bold leading-tight">Senang melihat<br />Anda kembali.</p>
          <p className="mt-4 max-w-md text-slate-300">Kelola data tamu, pantau kunjungan secara real-time, dan buat laporan dengan mudah.</p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {[['QR', 'Check-in cepat'], ['RBAC', 'Hak akses peran'], ['Audit', 'Riwayat lengkap']].map(([a, b]) => (
              <div key={a} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-lg font-bold text-brand-200">{a}</p>
                <p className="text-xs text-slate-300">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
