'use client';

export default function Error({ error, reset }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-xl font-bold">Terjadi kesalahan</h1>
        <p className="mt-1 max-w-md text-sm text-slate-500">{error?.message || 'Silakan coba lagi.'}</p>
        <p className="mt-1 text-xs text-slate-400">Pastikan database PostgreSQL berjalan dan DATABASE_URL di file .env benar.</p>
        <button onClick={reset} className="btn-primary mt-6">Coba Lagi</button>
      </div>
    </div>
  );
}
