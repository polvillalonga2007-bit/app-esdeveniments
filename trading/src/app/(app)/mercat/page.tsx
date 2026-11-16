"use client";

import Link from "next/link";
import { Card, Disclaimer, Loading, SectionTitle } from "@/components/ui";
import { Sparkline } from "@/components/sparkline";
import { useApp } from "@/lib/app-context";
import { ASSETS, AssetType, TYPE_LABEL, shortTicker } from "@/lib/assets";
import { pct, price, tone } from "@/lib/format";

const ORDER: AssetType[] = ["cripto", "eua", "espanya", "fons"];

export default function Mercat() {
  const { quote, quotes, quotesError } = useApp();

  return (
    <main className="flex flex-col gap-5 px-4 pt-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Mercat</h1>
        <p className="text-sm text-muted">Preus en euros, s&apos;actualitzen cada 30 segons.</p>
      </header>
      {quotes.length === 0 && !quotesError && <Loading text="Carregant preus…" />}
      {quotesError && quotes.length === 0 && (
        <p className="rounded-xl bg-down-soft px-3.5 py-3 text-sm text-down">No hem pogut carregar els preus. Torna-ho a provar d&apos;aquí a un moment.</p>
      )}
      {quotes.length > 0 &&
        ORDER.map((type) => (
          <section key={type} className="flex flex-col gap-2">
            <SectionTitle>{TYPE_LABEL[type]}</SectionTitle>
            <Card className="divide-y divide-line p-0">
              {ASSETS.filter((a) => a.type === type).map((a) => {
                const q = quote(a.symbol);
                return (
                  <Link key={a.symbol} href={`/actiu/${encodeURIComponent(a.symbol)}`} className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02]">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{a.name}</div>
                      <div className="flex items-center gap-1.5 text-sm text-muted">
                        {shortTicker(a.symbol)}
                        {q && !q.open && <span className="rounded bg-ground px-1.5 text-[11px] font-medium">tancat</span>}
                      </div>
                    </div>
                    <Sparkline values={q?.spark ?? []} />
                    <div className="w-24 text-right">
                      <div className="font-semibold">{q ? price(q.price) : "–"}</div>
                      <div className={`text-sm font-medium ${tone(q?.changePct)}`}>{pct(q?.changePct)}</div>
                    </div>
                  </Link>
                );
              })}
            </Card>
          </section>
        ))}
      <Disclaimer />
    </main>
  );
}
