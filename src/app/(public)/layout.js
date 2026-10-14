import PublicNav from '@/components/PublicNav';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/60 to-slate-50">
      <PublicNav />
      <main>{children}</main>
    </div>
  );
}
