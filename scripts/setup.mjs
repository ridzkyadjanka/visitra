// Membuat tabel VISITRA dan mengisi data awal.
//   npm run db:setup   -> buat tabel + data contoh (jika database masih kosong)
//   npm run db:reset   -> hapus semua tabel lalu buat ulang dari awal
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TZ = process.env.APP_TIMEZONE || 'Asia/Jakarta';
const RESET = process.argv.includes('--reset');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL belum diatur. Salin .env.example menjadi .env lalu sesuaikan.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const dateKey = (d) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const rand = (a) => a[Math.floor(Math.random() * a.length)];
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
// offset zona waktu (menit) untuk TZ pada tanggal tertentu
const tzOffsetMin = (date) => {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(date);
  const g = (t) => Number(p.find((x) => x.type === t).value);
  return (Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute')) - Math.floor(date.getTime() / 60000) * 60000) / 60000;
};
const localToUtc = (key, minuteOfDay) => {
  const [y, m, d] = key.split('-').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d) + minuteOfDay * 60000);
  return new Date(guess.getTime() - tzOffsetMin(guess) * 60000);
};

async function seed() {
  const hash = await bcrypt.hash('admin123', 10);
  await client.query('INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING');
  const users = [
    ['Admin Utama', 'admin@visitra.id', 'SUPER_ADMIN'],
    ['Resepsionis Lobby', 'resepsionis@visitra.id', 'RECEPTIONIST'],
    ['Staff HR', 'hr@visitra.id', 'ADMIN'],
    ['Security Pos 1', 'security@visitra.id', 'VIEWER'],
  ];
  for (const [name, email, role] of users)
    await client.query('INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4)', [name, email, hash, role]);

  const picData = [
    ['Andi Pratama', 'Corporate', 'Lantai 3 - Ruang Rapat'],
    ['Rina Sari', 'HRD', 'Lantai 2 - HR Office'],
    ['Budi Haryanto', 'Finance', 'Lantai 4 - Finance'],
    ['Siti Aisyah', 'IT', 'Lantai 2 - IT Room'],
    ['Dimas Putra', 'Operation', 'Lantai 1 - Operation'],
    ['Maya Lestari', 'Marketing', 'Lantai 3 - Marketing'],
  ];
  const picIds = [];
  for (const [name, dept, loc] of picData) {
    const r = await client.query(
      'INSERT INTO pics (name,department,location,email,phone) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [name, dept, loc, name.toLowerCase().replace(/ /g, '.') + '@perusahaan.com', '0812' + randInt(10000000, 99999999)],
    );
    picIds.push(r.rows[0].id);
  }

  const names = ['Muhammad Ridzky Adjanka', 'Siti Nurhaliza', 'Budi Santoso', 'Ahmad Fauzi', 'Dewi Lestari', 'Rizky Pratama',
    'Putri Ayu', 'Agus Salim', 'Nadia Rahma', 'Fajar Nugroho', 'Lina Marlina', 'Hendra Wijaya', 'Yusuf Hidayat',
    'Ratna Dewi', 'Eko Prasetyo', 'Indah Permata', 'Bayu Saputra', 'Citra Kirana', 'Gilang Ramadhan', 'Tari Wulandari'];
  const insts = ['PT Contoh Indonesia', 'Universitas ABC', 'PT Maju Bersama', 'PT Sejahtera', 'CV Karya', 'PT Digital Nusantara',
    'PT Logistik Cepat', 'Dinas Tenaga Kerja', 'PT Solusi Data', 'Universitas Sriwijaya'];
  const purposes = ['Meeting', 'Meeting', 'Meeting', 'Interview', 'Interview', 'Pengambilan Dokumen', 'Pengiriman Barang', 'Keperluan Lain'];

  const now = new Date();
  let total = 0;
  for (let day = 29; day >= 0; day--) {
    const key = dateKey(new Date(now.getTime() - day * 86400000));
    const isToday = day === 0;
    const count = isToday ? 22 : randInt(25, 60);
    let n = 0;
    for (let i = 1; i <= count; i++) {
      const minute = 8 * 60 + Math.floor(((i - 1) / count) * 8.5 * 60) + randInt(0, 8);
      const inAt = localToUtc(key, minute);
      if (isToday && inAt > now) break;
      n = i;
      const outAt = new Date(inAt.getTime() + randInt(15, 90) * 60000);
      const inside = isToday && (outAt > now || i > count - 5);
      await client.query(
        `INSERT INTO visits (visit_code,queue_number,queue_date,name,institution,phone,purpose,pic_id,status,check_in_at,check_out_at,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [`VIS-${key.replace(/-/g, '')}-${String(i).padStart(4, '0')}`, `A-${String(i).padStart(3, '0')}`, key,
          rand(names), rand(insts), '08' + randInt(1000000000, 1999999999), rand(purposes), rand(picIds),
          inside ? 'CHECKED_IN' : 'CHECKED_OUT', inAt, inside ? null : outAt, new Date(inAt.getTime() - 120000)],
      );
      total++;
    }
    await client.query('INSERT INTO daily_counters (date,value) VALUES ($1,$2)', [key, n]);
  }

  const upcoming = [
    ['Lukman Hakim', 'PT Mitra Teknologi', 'Meeting', 1, 10, 'PENDING'],
    ['Sarah Amelia', 'Universitas Sriwijaya', 'Interview', 1, 13, 'APPROVED'],
    ['Teguh Santoso', 'PT Bukit Energi', 'Kunjungan Kerja', 2, 9, 'PENDING'],
    ['Wulan Sari', 'CV Kreasi Media', 'Meeting', 3, 14, 'APPROVED'],
  ];
  for (const [name, inst, purpose, inDays, hour, approval] of upcoming) {
    const key = dateKey(new Date(now.getTime() + inDays * 86400000));
    await client.query(
      `INSERT INTO visits (visit_code,queue_number,queue_date,name,institution,phone,purpose,pic_id,status,approval,scheduled_at)
       VALUES ($1,'-',$2,$3,$4,$5,$6,$7,'SCHEDULED',$8,$9)`,
      [`APT-${key.replace(/-/g, '')}-${randInt(1000, 9999)}`, key, name, inst, '08' + randInt(1000000000, 1999999999),
        purpose, rand(picIds), approval, localToUtc(key, hour * 60)],
    );
  }
  await client.query(`INSERT INTO audit_logs (actor,action,entity,detail) VALUES ('Sistem','SETUP','System',$1)`,
    [`Data awal dibuat (${total} kunjungan contoh)`]);
  console.log(`✔ ${total} kunjungan contoh dibuat.`);
}

async function main() {
  await client.connect();
  if (RESET) {
    console.log('Menghapus tabel lama...');
    await client.query('DROP TABLE IF EXISTS audit_logs, notifications, daily_counters, visits, pics, users, settings CASCADE');
  }
  await client.query(readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
  console.log('✔ Tabel siap.');
  const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM users');
  if (rows[0].n === 0) await seed();
  else console.log('Database sudah berisi data, data contoh dilewati. (Gunakan npm run db:reset untuk mengulang.)');
  console.log('\nLogin admin : admin@visitra.id / admin123');
  console.log('Resepsionis : resepsionis@visitra.id / admin123');
}

main()
  .catch((e) => { console.error('Gagal:', e.message); process.exit(1); })
  .finally(() => client.end());
