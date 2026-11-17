"use client";

import { useState } from "react";
import { Disclaimer } from "@/components/ui";
import { NewsList } from "@/components/news-list";
import { ASSETS, shortTicker } from "@/lib/assets";
import { useApp } from "@/lib/app-context";

export default function Noticies() {
  const { state } = useApp();
  const [symbol, setSymbol] = useState<string | undefined>(undefined);
  // Primer el que tens a la cartera, després la resta
  const mine = new Set(state.positions.map((p) => p.symbol));
  const ordered = [...ASSETS.filter((a) => mine.has(a.symbol)), ...ASSETS.filter((a) => !mine.has(a.symbol))];

  return (
    <main className="flex flex-col gap-4 px-4 pt-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Notícies</h1>
        <p className="text-sm text-muted">El que pot moure el mercat aquests dies. S&apos;obren a la web original.</p>
      </header>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
        <button
          type="button"
          onClick={() => setSymbol(undefined)}
          className={`h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold ${!symbol ? "border-ink bg-ink text-white" : "border-line bg-white text-muted"}`}
        >
          Mercat en general
        </button>
        {ordered.map((a) => (
          <button
            key={a.symbol}
            type="button"
            onClick={() => setSymbol(a.symbol)}
            className={`h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold ${symbol === a.symbol ? "border-ink bg-ink text-white" : "border-line bg-white text-muted"}`}
          >
            {mine.has(a.symbol) && "★ "}
            {a.type === "cripto" || a.type === "fons" ? a.name.split(" (")[0] : shortTicker(a.symbol)}
          </button>
        ))}
      </div>
      <NewsList symbol={symbol} />
      <Disclaimer />
    </main>
  );
}
