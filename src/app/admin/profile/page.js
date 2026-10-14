import { requireUser } from '@/lib/auth';
import { ROLES, ROLE_DESC } from '@/lib/constants';
import { PageHeader } from '@/components/ui';
import { PasswordForm } from '../settings/SettingsForm';

export const metadata = { title: 'Profil Saya' };

export default async function ProfilePage() {
  const u = await requireUser();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Profil Saya" />
      <div className="card flex items-center gap-4 p-6">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
          {u.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </span>
        <div>
          <p className="text-lg font-bold">{u.name}</p>
          <p className="text-sm text-slate-500">{u.email}</p>
          <p className="mt-1 text-xs"><b>{ROLES[u.role]}</b> · {ROLE_DESC[u.role]}</p>
        </div>
      </div>
      <PasswordForm />
    </div>
  );
}
