# VISITRA
**Visitor Information & Reception Management System**

Sistem pencatatan dan manajemen tamu digital — Next.js 14 + Tailwind CSS + PostgreSQL, dengan login berbasis peran (RBAC).

---

## 1. Yang perlu disiapkan

| Kebutuhan | Versi | Catatan |
|---|---|---|
| Node.js | **20.6 atau lebih baru** | Cek dengan `node -v` |
| PostgreSQL | 13+ | Pilih salah satu: install langsung, **atau** pakai Docker (lihat di bawah) |
| VS Code | terbaru | Ekstensi yang disarankan: Tailwind CSS IntelliSense |

## 2. Cara menjalankan (5 langkah)

Buka folder `visitra` di VS Code, lalu buka **Terminal → New Terminal** dan jalankan:

```bash
# 1) Install semua library
npm install

# 2) Buat file konfigurasi
#    Windows (PowerShell):  copy .env.example .env
#    macOS / Linux:         cp .env.example .env
```

3) **Siapkan database.** Pilih salah satu:

- **Pakai Docker** (paling mudah, jika Docker Desktop terpasang):
  ```bash
  docker compose up -d
  ```
  `.env` bawaan sudah cocok, tidak perlu diubah.

- **Pakai PostgreSQL yang sudah terinstall** (misal lewat pgAdmin): buat database bernama `visitra`, lalu ubah baris ini di `.env` sesuai user & password PostgreSQL Anda:
  ```
  DATABASE_URL="postgresql://postgres:PASSWORD_ANDA@localhost:5432/visitra?schema=public"
  ```

```bash
# 4) Buat tabel + isi data contoh (30 hari kunjungan, PIC, akun staf)
npm run db:setup

# 5) Jalankan aplikasi
npm run dev
```

Buka **http://localhost:3000** 🎉

### Akun demo
| Peran | Email | Password |
|---|---|---|
| Super Admin | admin@visitra.id | admin123 |
| Resepsionis | resepsionis@visitra.id | admin123 |
| Admin (HR) | hr@visitra.id | admin123 |
| Viewer (Security) | security@visitra.id | admin123 |

> ⚠️ Sebelum dipakai sungguhan: ganti semua password demo, dan isi `AUTH_SECRET` di `.env` dengan teks acak minimal 32 karakter.

### Perintah lain
| Perintah | Fungsi |
|---|---|
| `npm run db:reset` | Hapus semua data & buat ulang data contoh |
| `npm run build` lalu `npm start` | Menjalankan versi produksi |

---

## 3. Peta halaman

**Portal Pengunjung (tanpa login)**
| URL | Halaman |
|---|---|
| `/` | Landing page |
| `/daftar` | Registrasi kunjungan (walk-in) |
| `/jadwalkan` | Ajukan janji temu (menunggu persetujuan) |
| `/tiket/[token]` | Nomor pengunjung + QR Code + tiket cetak, status diperbarui otomatis |
| `/cek` | Buka kembali tiket (kode kunjungan + 4 digit terakhir HP) |

**Panel Staf (`/login`)**
| URL | Halaman | Peran |
|---|---|---|
| `/admin` | Dashboard: statistik, grafik per jam, tujuan, tren 14 hari, aktivitas real-time | Semua |
| `/admin/check-in` | Scanner QR (kamera) + input manual, check-in / check-out | Super Admin, Admin, Resepsionis |
| `/admin/visitors` | Data tamu: cari, filter (status, PIC, tujuan, tanggal), paginasi | Semua |
| `/admin/visitors/new` | Registrasi tamu walk-in oleh resepsionis | Super Admin, Admin, Resepsionis |
| `/admin/visitors/[id]` | Detail, edit, foto tamu, riwayat perubahan, hapus | Semua (aksi sesuai peran) |
| `/admin/visitors/[id]/badge` | Cetak visitor badge 54×86 mm dengan QR | Semua |
| `/admin/appointments` | Janji temu: mendatang, persetujuan, hari ini, riwayat | Semua |
| `/admin/pics` | Manajemen PIC (departemen, lokasi, kontak) | Super Admin, Admin |
| `/admin/reports` | Laporan + ekspor **Excel** & **PDF** | Super Admin, Admin, Viewer |
| `/admin/users` | User management + matriks hak akses | Super Admin |
| `/admin/settings` | Profil perusahaan, format nomor, jam operasional, keamanan | Super Admin |
| `/admin/audit` | Audit log seluruh aktivitas | Super Admin, Admin |
| `/admin/notifications` | Notifikasi kedatangan tamu untuk PIC (+ tombol kirim WhatsApp) | Semua |
| `/admin/profile` | Profil & ganti password sendiri | Semua |

## 4. Alur kunjungan

```
Pengunjung isi formulir (/daftar)
  → sistem terbitkan nomor antrean A-015 + kode unik VIS-20261014-0015
  → pengunjung dapat tiket digital ber-QR
  → resepsionis scan QR di /admin/check-in → status "Di Dalam", PIC mendapat notifikasi
  → kunjungan berlangsung
  → scan QR lagi saat keluar → check-out, durasi tercatat
  → data masuk ke laporan
```

Janji temu: pengunjung mengajukan di `/jadwalkan` → staf menyetujui di `/admin/appointments` → saat tamu datang, scan QR → nomor antrean hari itu diterbitkan otomatis.

## 5. Penomoran
- **Nomor antrean** (`A-015`): ditampilkan ke tamu, **direset setiap hari**.
- **Kode kunjungan** (`VIS-20261014-0015`): unik selamanya, dipakai di QR Code dan laporan.
- Nomor diambil dari tabel `daily_counters` secara atomik, jadi dua tamu yang mendaftar bersamaan tidak akan mendapat nomor yang sama.
- Prefix keduanya dapat diubah di **Pengaturan**.

## 6. Keamanan & privasi
- Password di-hash (bcrypt); sesi login memakai JWT di cookie `httpOnly`.
- Middleware memblokir `/admin/*` tanpa login; setiap aksi server memeriksa hak akses peran.
- Akun staf hanya dibuat oleh Super Admin (tidak ada registrasi staf publik).
- Pembatasan 5 percobaan login gagal per 15 menit per email.
- Tiket publik memakai token acak, bukan nomor berurutan, sehingga tidak bisa ditebak.
- Nomor HP & email disamarkan untuk peran Viewer (dapat diatur di Pengaturan).
- Semua perubahan data tercatat di Audit Log.

## 7. Struktur folder

```
visitra/
├─ db/schema.sql            # struktur tabel PostgreSQL
├─ scripts/setup.mjs        # membuat tabel + data contoh
├─ docker-compose.yml       # PostgreSQL via Docker (opsional)
└─ src/
   ├─ middleware.js         # proteksi halaman /admin
   ├─ lib/                  # koneksi DB, auth, zona waktu, laporan, QR
   ├─ components/           # komponen UI, grafik, form, layout admin
   └─ app/
      ├─ page.js            # landing page
      ├─ (public)/          # daftar, jadwalkan, cek, tiket
      ├─ login/
      ├─ admin/             # seluruh halaman panel staf
      └─ actions/           # server actions (logika tambah/ubah/hapus)
```

## 8. Catatan
- **Scanner QR kamera** butuh HTTPS atau `localhost`. Jika diakses dari tablet lewat IP lokal (mis. `http://192.168.1.10:3000`), browser akan menolak kamera — gunakan input manual / scanner barcode USB, atau pasang HTTPS saat deploy.
- **Notifikasi PIC** tersimpan di sistem dan bisa diteruskan via tombol WhatsApp. Pengiriman email/WA otomatis memerlukan layanan pihak ketiga (SMTP, WhatsApp Business API) yang bisa ditambahkan di `src/lib/visits.js` → `notifyPic()`.
- **Foto tamu** diperkecil di browser lalu disimpan di database. Untuk volume besar, sebaiknya pindahkan ke object storage (S3/Cloudinary).
- **Zona waktu** diatur lewat `APP_TIMEZONE` di `.env` (default `Asia/Jakarta`; tersedia label WITA/WIT untuk `Asia/Makassar`/`Asia/Jayapura`).
- **Deploy**: bisa ke Vercel/Railway/VPS. Siapkan database PostgreSQL online (Neon, Supabase, Railway), isi `DATABASE_URL` dan `AUTH_SECRET`, lalu jalankan `npm run db:setup` sekali.
