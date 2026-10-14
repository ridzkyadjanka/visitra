import pg from 'pg';

// Kolom DATE dikembalikan sebagai string 'YYYY-MM-DD' (hindari pergeseran zona waktu)
pg.types.setTypeParser(1082, (v) => v);
// COUNT/SUM bigint -> number
pg.types.setTypeParser(20, (v) => Number(v));
pg.types.setTypeParser(1700, (v) => Number(v));

const globalForPg = globalThis;
export const pool =
  globalForPg.__visitraPool ||
  new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
if (process.env.NODE_ENV !== 'production') globalForPg.__visitraPool = pool;

export async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows;
}
export async function one(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
