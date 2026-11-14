import Link from "next/link";

export function BackLink({ href, label = "Tornar" }: { href: string; label?: string }) {
  return (
    <Link href={href} aria-label={label} className="-ml-2.5 flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{children}</h2>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-white p-4 ${className}`}>{children}</div>;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[16px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export const primaryButton =
  "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-60";

export const secondaryButton =
  "flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white text-[15px] font-semibold text-ink hover:bg-black/[0.03] disabled:opacity-60";

export function ErrorBox({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="rounded-xl bg-bad-soft px-3.5 py-3 text-sm text-bad">{children}</p>;
}

export function Loading() {
  return <p className="p-8 text-center text-muted">Carregant…</p>;
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      </span>
      Torn
    </span>
  );
}
