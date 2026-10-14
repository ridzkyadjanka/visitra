import Link from 'next/link';
import {
  ArrowRight, QrCode, Hash, ShieldCheck, BarChart3, Bell, CalendarCheck, Printer, History,
  Smartphone, Tablet, Monitor, CheckCircle2, ClipboardList, ScanLine, LogOut, FileSpreadsheet,
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import Logo from '@/components/Logo';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const features = [
  { icon: ClipboardList, title: 'Registrasi Cepat', text: 'Tamu mengisi identitas dan tujuan kunjungan dari ponsel sendiri dalam hitungan detik.' },
  { icon: Hash, title: 'Nomor Otomatis', text: 'Nomor antrean harian (A-015) dan kode kunjungan unik (VIS-20261014-0015).' },
  { icon: QrCode, title: 'Tiket QR Code', text: 'Tiket digital ber-QR untuk verifikasi check-in dan check-out tanpa antre.' },
  { icon: Bell, title: 'Notifikasi PIC', text: 'Orang yang ditemui langsung mendapat pemberitahuan saat tamu tiba.' },
  { icon: CalendarCheck, title: 'Janji Temu', text: 'Kunjungan terjadwal dengan alur persetujuan sebelum hari H.' },
  { icon: BarChart3, title: 'Laporan & Analitik', text: 'Rekap harian–bulanan, grafik tren, ekspor Excel dan PDF.' },
  { icon: Printer, title: 'Visitor Badge', text: 'Cetak tiket dan kartu tamu langsung dari meja resepsionis.' },
  { icon: History, title: 'Audit Log', text: 'Setiap perubahan data tercatat lengkap: siapa, kapan, dan apa.' },
  { icon: ShieldCheck, title: 'Privasi Terjaga', text: 'Hak akses berbasis peran dan penyamaran data pribadi tamu.' },
];

const flow = [
  { icon: ClipboardList, t: 'Isi Formulir', d: 'Tamu mendaftar via web atau tablet lobby' },
  { icon: Hash, t: 'Nomor Terbit', d: 'Sistem menerbitkan nomor & kode kunjungan' },
  { icon: QrCode, t: 'Dapat QR Code', d: 'Tiket digital tersimpan di ponsel tamu' },
  { icon: ScanLine, t: 'Verifikasi', d: 'Resepsionis memindai QR, tamu check-in' },
  { icon: LogOut, t: 'Check-out', d: 'Waktu keluar & durasi tercatat otomatis' },
  { icon: FileSpreadsheet, t: 'Laporan', d: 'Data masuk ke rekap & analitik' },
];

export default async function Home() {
  const s = await getSettings();
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_80%_10%,#DCE7FF_0%,transparent_60%),radial-gradient(40%_40%_at_0%_100%,#EEF4FF_0%,transparent_70%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Visitor Information &amp; Reception Management
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-navy-900 sm:text-5xl lg:text-[56px]">
              Sistem Pencatatan <span className="text-brand-600">Tamu Digital</span> yang Rapi &amp; Aman
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Catat setiap kunjungan dengan lebih mudah, cepat, dan terintegrasi. Cocok untuk perusahaan, instansi pemerintah, maupun kampus.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/daftar" className="btn-primary px-6 py-3 text-base">
                Catat Kunjungan Sekarang <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/jadwalkan" className="btn-outline px-6 py-3 text-base">Jadwalkan Kunjungan</Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              {['Tanpa aplikasi tambahan', 'Responsif di semua perangkat', 'Hak akses berbasis peran'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{t}</span>
              ))}
            </div>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="card overflow-hidden rounded-3xl">
              <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="ml-3 text-xs text-slate-400">visitra.app/admin</span>
              </div>
              <div className="grid grid-cols-[88px_1fr]">
                <div className="space-y-2 bg-navy-900 p-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-2.5 rounded ${i === 1 ? 'bg-brand-500' : 'bg-white/15'}`} />
                  ))}
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[['Hari ini', '56'], ['Di dalam', '18'], ['Durasi', '45m']].map(([l, v]) => (
                      <div key={l} className="rounded-xl border border-slate-100 p-2.5">
                        <p className="text-[10px] text-slate-400">{l}</p>
                        <p className="text-lg font-bold">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex h-24 items-end gap-1.5 rounded-xl border border-slate-100 p-3">
                    {[30, 45, 60, 40, 85, 55, 70, 95, 50, 65].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-brand-500/80" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {['A-015 · Meeting', 'A-014 · Interview', 'A-013 · Dokumen'].map((r, i) => (
                      <div key={r} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px]">
                        <span className="font-medium">{r}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${i === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'}`}>
                          {i === 0 ? 'Di Dalam' : 'Selesai'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* floating ticket */}
            <div className="card absolute -bottom-8 -left-4 w-44 rotate-[-4deg] rounded-2xl p-4 sm:-left-10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nomor Pengunjung</p>
              <p className="text-3xl font-extrabold tracking-tight">A-015</p>
              <div className="mt-2 grid grid-cols-5 gap-0.5">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={`aspect-square ${[0, 1, 2, 4, 5, 7, 9, 10, 12, 14, 15, 18, 20, 21, 22, 24].includes(i) ? 'bg-navy-900' : 'bg-slate-100'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fitur" className="border-t border-slate-100 bg-slate-50/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Fitur</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Semua yang dibutuhkan meja resepsionis modern</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-6 transition hover:-translate-y-0.5 hover:border-brand-200">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FLOW */}
      <section id="alur" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Alur Kunjungan</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Dari formulir sampai laporan, tanpa kertas</h2>
          </div>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {flow.map(({ icon: Icon, t, d }, i) => (
              <li key={t} className="relative rounded-2xl border border-slate-200 p-5">
                <span className="text-xs font-bold text-brand-600">0{i + 1}</span>
                <Icon className="mt-3 h-6 w-6 text-navy-900" />
                <p className="mt-3 font-bold">{t}</p>
                <p className="mt-1 text-sm text-slate-500">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* DEVICES + CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-12 text-white sm:px-12">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Siap menyambut tamu Anda di {s.company_name}?</h2>
                <p className="mt-3 text-slate-300">Gunakan di desktop admin, tablet resepsionis, maupun smartphone pengunjung.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/daftar" className="btn bg-white text-navy-900 hover:bg-brand-50">Daftar Kunjungan</Link>
                  <Link href="/login" className="btn border border-white/30 text-white hover:bg-white/10">Masuk sebagai Staf</Link>
                </div>
              </div>
              <div className="flex justify-center gap-6 text-slate-300 lg:justify-end">
                {[[Monitor, 'Desktop'], [Tablet, 'Tablet'], [Smartphone, 'Ponsel']].map(([I, l]) => (
                  <div key={l} className="text-center"><I className="mx-auto h-10 w-10 text-brand-200" /><p className="mt-2 text-sm">{l}</p></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="kontak" className="border-t border-slate-100 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo sub />
          <div className="text-sm text-slate-500">
            <p className="font-semibold text-navy-900">{s.company_name}</p>
            <p>{s.address} · {s.phone}</p>
            <p>Jam operasional {s.open_time}–{s.close_time}</p>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} VISITRA</p>
        </div>
      </footer>
    </div>
  );
}
