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
  return <div className={`rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] ${className}`}>{children}</div>;
}

export const inputClass =
  "h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export const primaryButton =
  "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-60";

export const darkButton =
  "flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white hover:bg-black disabled:opacity-60";

export function SurpriseBadge() {
  return <span className="rounded-full bg-warm-soft px-2.5 py-1 text-xs font-semibold text-warm-ink">Mode sorpresa</span>;
}

export function Loading() {
  return <p className="p-8 text-center text-muted">Carregant…</p>;
}
