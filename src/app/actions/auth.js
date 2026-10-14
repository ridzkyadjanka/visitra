'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { one, query } from '@/lib/db';
import { signSession, SESSION_COOKIE } from '@/lib/session';
import { getSession, audit } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

// Pembatasan percobaan login sederhana (per email, di memori server)
const attempts = globalThis.__visitraAttempts || (globalThis.__visitraAttempts = new Map());
const MAX = 5, WINDOW = 15 * 60 * 1000;

export async function login(_prev, fd) {
  const email = String(fd.get('email') || '').trim().toLowerCase();
  const password = String(fd.get('password') || '');
  const next = String(fd.get('next') || '/admin');
  if (!email || !password) return { error: 'Email dan password wajib diisi.', email };

  const a = attempts.get(email);
  if (a && a.count >= MAX && Date.now() - a.first < WINDOW)
    return { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.', email };

  const user = await one('SELECT * FROM users WHERE lower(email) = $1', [email]);
  const ok = user && user.active && (await bcrypt.compare(password, user.password_hash));
  if (!ok) {
    const cur = a && Date.now() - a.first < WINDOW ? a : { count: 0, first: Date.now() };
    attempts.set(email, { ...cur, count: cur.count + 1 });
    if (user && !user.active) return { error: 'Akun dinonaktifkan. Hubungi administrator.', email };
    return { error: 'Email atau password salah.', email };
  }
  attempts.delete(email);

  const s = await getSettings();
  const remember = fd.get('remember') === 'on';
  const hours = remember ? 24 * 7 : s.session_hours;
  const token = await signSession({ uid: user.id, role: user.role }, hours);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: hours * 3600,
  });
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  await audit(user, 'LOGIN', 'User', user.id, user.email);
  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function logout() {
  const user = await getSession();
  if (user) await audit(user, 'LOGOUT', 'User', user.id, user.email);
  cookies().delete(SESSION_COOKIE);
  redirect('/login');
}

export async function changeOwnPassword(_prev, fd) {
  const user = await getSession();
  if (!user) return { error: 'Sesi berakhir.' };
  const current = String(fd.get('current') || '');
  const next = String(fd.get('next') || '');
  if (next.length < 8) return { error: 'Password baru minimal 8 karakter.' };
  const row = await one('SELECT password_hash FROM users WHERE id = $1', [user.id]);
  if (!(await bcrypt.compare(current, row.password_hash))) return { error: 'Password saat ini salah.' };
  await query('UPDATE users SET password_hash = $2 WHERE id = $1', [user.id, await bcrypt.hash(next, 10)]);
  await audit(user, 'UPDATE', 'User', user.id, 'Ganti password sendiri');
  return { ok: 'Password berhasil diperbarui.' };
}
