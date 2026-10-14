'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ScanLine, Users, CalendarCheck, Contact, BarChart3, UserCog, Settings, History,
  Bell, LogOut, Menu, X, Search, Plus,
} from 'lucide-react';
import Logo from './Logo';
import { can, ROLES } from '@/lib/constants';
import { logout } from '@/app/actions/auth';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/check-in', label: 'Check-in / Out', icon: ScanLine, perm: 'visits.write' },
  { href: '/admin/visitors', label: 'Data Tamu', icon: Users },
  { href: '/admin/appointments', label: 'Janji Temu', icon: CalendarCheck },
  { href: '/admin/pics', label: 'Manajemen PIC', icon: Contact },
  { href: '/admin/reports', label: 'Laporan', icon: BarChart3, perm: 'reports.view' },
  { href: '/admin/users', label: 'User Management', icon: UserCog, perm: 'users.manage' },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings, perm: 'settings.manage' },
  { href: '/admin/audit', label: 'Log Aktivitas', icon: History, perm: 'audit.view' },
];

export default function AdminShell({ user, unread, children }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const items = NAV.filter((n) => !n.perm || can(user.role, n.perm));
  const isActive = (href) => (href === '/admin' ? path === '/admin' : path.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900 text-slate-300">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin" onClick={() => setOpen(false)}><Logo light /></Link>
        <button className="text-slate-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu"><X className="h-5 w-5" /></button>
      </div>
      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive(href) ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="h-[18px] w-[18px]" /> {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/admin/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{ROLES[user.role]}</p>
          </div>
        </Link>
        <form action={logout}>
          <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/5 hover:text-white">
            <LogOut className="h-[18px] w-[18px]" /> Keluar
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block no-print">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden no-print">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 no-print">
          <button className="btn-ghost -ml-2 px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu className="h-5 w-5" /></button>
          <form
            className="relative max-w-md flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get('q');
              router.push(`/admin/visitors?q=${encodeURIComponent(q)}`);
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" className="input bg-slate-50 py-2 pl-9" placeholder="Cari nama tamu, instansi, atau nomor..." />
          </form>
          <div className="ml-auto flex items-center gap-2">
            {can(user.role, 'visits.write') && (
              <Link href="/admin/visitors/new" className="btn-primary hidden py-2 sm:inline-flex"><Plus className="h-4 w-4" /> Tamu Baru</Link>
            )}
            <Link href="/admin/notifications" className="btn-ghost relative px-2.5" aria-label="Notifikasi">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
