import { Check, Minus } from 'lucide-react';
import { requirePerm } from '@/lib/auth';
import { query } from '@/lib/db';
import { ROLES, PERMS } from '@/lib/constants';
import { fmtDateTime } from '@/lib/time';
import { PageHeader } from '@/components/ui';
import UserManager from './UserManager';

export const metadata = { title: 'User Management' };

const PERM_LABEL = {
  'visits.write': 'Registrasi, check-in & check-out tamu',
  'visits.delete': 'Hapus data kunjungan',
  'appointments.approve': 'Setujui / tolak janji temu',
  'pics.write': 'Kelola data PIC',
  'reports.view': 'Lihat & ekspor laporan',
  'personal.view': 'Lihat data pribadi tanpa sensor',
  'audit.view': 'Lihat log aktivitas',
  'users.manage': 'Kelola akun pengguna',
  'settings.manage': 'Ubah pengaturan sistem',
};

export default async function UsersPage() {
  const me = await requirePerm('users.manage');
  const users = (await query('SELECT id, name, email, role, active, last_login_at FROM users ORDER BY created_at'))
    .map((u) => ({ ...u, last_login: u.last_login_at ? fmtDateTime(u.last_login_at) : 'Belum pernah', last_login_at: undefined }));
  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="User Management" sub="Kelola akun staf dan hak akses. Akun staf hanya dapat dibuat oleh Super Admin." />
        <UserManager users={users} meId={me.id} />
      </div>
      <div>
        <h2 className="mb-3 text-lg font-bold">Matriks Hak Akses</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr><th className="th">Hak Akses</th>{Object.values(ROLES).map((r) => <th key={r} className="th text-center">{r}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(PERM_LABEL).map(([k, label]) => (
                <tr key={k}>
                  <td className="td">{label}</td>
                  {Object.keys(ROLES).map((r) => (
                    <td key={r} className="td text-center">
                      {PERMS[k].includes(r) ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <Minus className="mx-auto h-4 w-4 text-slate-300" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
