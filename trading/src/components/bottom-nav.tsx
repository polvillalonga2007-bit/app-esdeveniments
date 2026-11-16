"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/cartera", label: "Cartera", icon: <path d="M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2" /> },
  { href: "/mercat", label: "Mercat", icon: <path d="M3 17l5-5 4 4 8-8M15 8h5v5" /> },
  { href: "/diari", label: "Diari", icon: <path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4" /> },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md pb-[env(safe-area-inset-bottom)]">
        {items.map((it) => {
          const active = path.startsWith(it.href) || (it.href === "/mercat" && path.startsWith("/actiu"));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium ${active ? "text-brand" : "text-muted"}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {it.icon}
              </svg>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
