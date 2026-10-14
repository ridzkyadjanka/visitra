export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#0B1B3F" />
      <path d="M18 20l14 26 14-26" fill="none" stroke="#2F6BFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="19" r="4.5" fill="#fff" />
    </svg>
  );
}

export default function Logo({ light = false, sub = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className={`block text-lg font-extrabold tracking-[0.14em] ${light ? 'text-white' : 'text-navy-900'}`}>VISITRA</span>
        {sub && (
          <span className={`mt-1 block text-[10px] font-medium ${light ? 'text-slate-300' : 'text-slate-500'}`}>
            Visitor &amp; Reception Management
          </span>
        )}
      </span>
    </span>
  );
}
