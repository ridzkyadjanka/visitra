import { CheckCircle2 } from 'lucide-react';

export default function FormShell({ title, sub, side, children }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.25fr] lg:py-14">
      <aside className="relative hidden overflow-hidden rounded-3xl bg-navy-900 p-10 text-white lg:block">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-200">{side.kicker}</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">{side.title}</h2>
          <ul className="mt-8 space-y-4">
            {side.points.map((p) => (
              <li key={p} className="flex gap-3 text-slate-200"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" />{p}</li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{sub}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
