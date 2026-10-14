import 'server-only';
import { tx } from './db';
import { todayKey } from './time';
import { getSettings } from './settings';

// Ambil nomor urut harian secara atomik, lalu bentuk:
//   queue_number: A-015            (ditampilkan ke tamu, reset tiap hari)
//   visit_code  : VIS-20261014-0015 (unik selamanya)
export async function nextNumbers(client, dateKey = todayKey()) {
  const s = await getSettings();
  const { rows } = await client.query(
    `INSERT INTO daily_counters (date, value) VALUES ($1, 1)
     ON CONFLICT (date) DO UPDATE SET value = daily_counters.value + 1
     RETURNING value`,
    [dateKey],
  );
  const n = rows[0].value;
  return {
    queueNumber: `${s.queue_prefix}-${String(n).padStart(3, '0')}`,
    visitCode: `${s.code_prefix}-${dateKey.replace(/-/g, '')}-${String(n).padStart(4, '0')}`,
  };
}

export async function notifyPic(client, visit) {
  if (!visit.pic_id) return;
  await client.query(
    'INSERT INTO notifications (pic_id, visit_id, title, message) VALUES ($1,$2,$3,$4)',
    [visit.pic_id, visit.id, 'Tamu telah tiba',
      `${visit.name} (${visit.institution}) telah check-in untuk ${visit.purpose}. Nomor ${visit.queue_number}.`],
  );
}

export { tx };
