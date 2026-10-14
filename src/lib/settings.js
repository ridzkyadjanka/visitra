import 'server-only';
import { one, query } from './db';

export async function getSettings() {
  let s = await one('SELECT * FROM settings WHERE id = 1');
  if (!s) {
    await query('INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING');
    s = await one('SELECT * FROM settings WHERE id = 1');
  }
  return { ...s, purposeList: s.purposes.split(',').map((p) => p.trim()).filter(Boolean) };
}
