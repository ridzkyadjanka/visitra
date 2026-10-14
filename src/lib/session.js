// JWT session (dipakai di middleware Edge & server)
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'visitra_session';
const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-only-secret-change-me-dev-only-secret');

export async function signSession(payload, hours = 8) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(secret());
}
export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}
