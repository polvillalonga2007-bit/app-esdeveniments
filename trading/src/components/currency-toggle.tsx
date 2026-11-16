"use client";

import { useApp } from "@/lib/app-context";

export function CurrencyToggle({ dark = false }: { dark?: boolean }) {
  const { currency, setCurrency } = useApp();
  return (
    <div className={`inline-grid grid-cols-2 rounded-full p-0.5 text-[13px] font-bold ${dark ? "bg-white/20" : "bg-black/[0.06]"}`} role="group" aria-label="Moneda">
      {(["USD", "EUR"] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={currency === c}
          onClick={() => setCurrency(c)}
          className={`h-7 w-9 rounded-full ${currency === c ? (dark ? "bg-white text-brand" : "bg-white text-ink shadow-sm") : dark ? "text-white/80" : "text-muted"}`}
        >
          {c === "USD" ? "$" : "€"}
        </button>
      ))}
    </div>
  );
}
