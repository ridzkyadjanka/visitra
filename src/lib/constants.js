export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  RECEPTIONIST: 'Resepsionis',
  VIEWER: 'Viewer',
};
export const ROLE_DESC = {
  SUPER_ADMIN: 'Akses penuh termasuk pengguna & pengaturan',
  ADMIN: 'Kelola tamu, janji temu, PIC, dan laporan',
  RECEPTIONIST: 'Check-in/out tamu dan janji temu',
  VIEWER: 'Hanya melihat data (data pribadi disamarkan)',
};
// Hak akses per fitur
export const PERMS = {
  'visits.write': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'],
  'visits.delete': ['SUPER_ADMIN', 'ADMIN'],
  'appointments.approve': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'],
  'pics.write': ['SUPER_ADMIN', 'ADMIN'],
  'reports.view': ['SUPER_ADMIN', 'ADMIN', 'VIEWER'],
  'users.manage': ['SUPER_ADMIN'],
  'settings.manage': ['SUPER_ADMIN'],
  'audit.view': ['SUPER_ADMIN', 'ADMIN'],
  'personal.view': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'],
};
export const can = (role, perm) => !!PERMS[perm]?.includes(role);

export const STATUS = {
  SCHEDULED: { label: 'Terjadwal', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  REGISTERED: { label: 'Menunggu', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  CHECKED_IN: { label: 'Di Dalam', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  CHECKED_OUT: { label: 'Selesai', cls: 'bg-brand-50 text-brand-700 ring-brand-200' },
  CANCELLED: { label: 'Dibatalkan', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
};
export const APPROVAL = {
  PENDING: { label: 'Menunggu Persetujuan', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  APPROVED: { label: 'Disetujui', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  REJECTED: { label: 'Ditolak', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

export function maskPhone(p) {
  if (!p) return '-';
  return p.length > 6 ? p.slice(0, 4) + '•'.repeat(p.length - 7) + p.slice(-3) : '•••';
}
