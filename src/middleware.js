import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from './lib/session';

export async function middleware(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') && !session) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/login'] };
