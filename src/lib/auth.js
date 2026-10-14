import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession } from './session';
import { one, query } from './db';
import { can } from './constants';

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) return null;
  // Pastikan akun masih aktif & ambil peran terbaru
  const user = await one('SELECT id, name, email, role, active FROM users WHERE id = $1', [payload.uid]);
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser() {
  const user = await getSession();
  if (!user) redirect('/login');
  return user;
}

export async function requirePerm(perm) {
  const user = await requireUser();
  if (!can(user.role, perm)) redirect('/admin?denied=1');
  return user;
}

// Untuk server action: lempar error, bukan redirect
export async function assertPerm(perm) {
  const user = await getSession();
  if (!user) throw new Error('Sesi berakhir, silakan login kembali.');
  if (!can(user.role, perm)) throw new Error('Anda tidak memiliki hak akses untuk tindakan ini.');
  return user;
}

export async function audit(user, action, entity, entityId, detail) {
  await query(
    'INSERT INTO audit_logs (user_id, actor, action, entity, entity_id, detail) VALUES ($1,$2,$3,$4,$5,$6)',
    [user?.id || null, user?.name || 'Pengunjung', action, entity, entityId ? String(entityId) : null, detail || null],
  );
}
