import { requirePerm } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { todayKey } from '@/lib/time';
import { PageHeader } from '@/components/ui';
import { SettingsForm, PasswordForm } from './SettingsForm';

export const metadata = { title: 'Pengaturan' };

export default async function SettingsPage() {
  await requirePerm('settings.manage');
  const s = await getSettings();
  const sample = `${s.code_prefix}-${todayKey().replace(/-/g, '')}-0015`;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Pengaturan Sistem" sub="Profil perusahaan, penomoran tamu, jam operasional, dan keamanan." />
      <SettingsForm s={s} sample={sample} />
      <PasswordForm />
    </div>
  );
}
