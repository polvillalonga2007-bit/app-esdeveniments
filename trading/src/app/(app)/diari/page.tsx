"use client";

import Link from "next/link";
import { Card, Disclaimer, SectionTitle } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { dateTime, money, pct, price, qty, signedMoney, tone } from "@/lib/format";
import { shortTicker } from "@/lib/assets";
import { tradeLabel } from "@/lib/store";

export default function Diari() {
  const { state, totals } = useApp();
  const trades = state.trades;
  const sells = trades.filter((t) => t.realized != null); // vendes i tancaments d'operacions
  const wins = sells.filter((t) => (t.realized ?? 0) > 0);
  const realized = sells.reduce((a, t) => a + (t.realized ?? 0), 0);
  const best = sells.reduce<(typeof sells)[number] | null>((b, t) => (!b || (t.realized ?? 0) > (b.realized ?? 0) ? t : b), null);
  const worst = sells.reduce<(typeof sells)[number] | null>((b, t) => (!b || (t.realized ?? 0) < (b.realized ?? 0) ? t : b), null);
  const unrealized = totals.pnl - realized;
  const days = Math.max(1, Math.ceil((Date.now() - new Date(state.user.started_at).getTime()) / 86400000));

  const stats: [string, string, string?][] = [
    ["Resultat total", `${signedMoney(totals.pnl)} (${pct(totals.pnlPct)})`, tone(totals.pnl)],
    ["Guanyat en operacions tancades", signedMoney(realized), tone(realized)],
    ["Pendent (el que tens ara)", signedMoney(unrealized), tone(unrealized)],
    ["Operacions amb guany", sells.length ? `${wins.length} de ${sells.length} (${Math.round((wins.length / sells.length) * 100)} %)` : "–"],
    ["Millor operació", best && (best.realized ?? 0) > 0 ? `${signedMoney(best.realized ?? 0)} · ${shortTicker(best.symbol)}` : "–", "text-up"],
    ["Pitjor operació", worst && (worst.realized ?? 0) < 0 ? `${signedMoney(worst.realized ?? 0)} · ${shortTicker(worst.symbol)}` : "–", "text-down"],
    ["Operacions", String(trades.length)],
    ["Dies jugant", String(days)],
  ];

  return (
    <main className="flex flex-col gap-5 px-4 pt-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Diari i estadístiques</h1>
        <p className="text-sm text-muted">Com t&apos;està anant i per què vas fer cada operació.</p>
      </header>

      <section className="grid grid-cols-2 gap-2">
        {stats.map(([label, value, cls]) => (
          <Card key={label} className="flex flex-col gap-0.5 p-3.5">
            <span className="text-xs text-muted">{label}</span>
            <span className={`text-[15px] font-semibold ${value === "–" ? "text-muted" : (cls ?? "")}`}>{value}</span>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Totes les operacions</SectionTitle>
        {trades.length === 0 ? (
          <Card className="text-center text-[15px] text-muted">
            Aquí apareixeran les teves compres i vendes. <Link href="/mercat" className="font-semibold text-brand">Fes-ne la primera →</Link>
          </Card>
        ) : (
          <Card className="divide-y divide-line p-0">
            {trades.map((t) => (
              <Link key={t.id} href={`/actiu/${encodeURIComponent(t.symbol)}`} className="flex flex-col gap-1 px-4 py-3.5 hover:bg-black/[0.02]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      <span className={`mr-1.5 rounded px-1.5 py-0.5 text-[11px] font-bold uppercase ${t.side === "compra" ? "bg-up-soft text-up" : "bg-down-soft text-down"}`}>
                        {tradeLabel(t)}
                      </span>
                      {t.asset_name}
                    </div>
                    <div className="text-sm text-muted">
                      {qty(t.qty)} {shortTicker(t.symbol)} a {price(t.price)} · {dateTime(t.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{money(t.total)}</div>
                    {t.realized != null && <div className={`text-sm font-semibold ${tone(t.realized)}`}>{signedMoney(t.realized)}</div>}
                  </div>
                </div>
                {t.note && <p className="rounded-lg bg-ground px-3 py-2 text-sm italic text-ink/80">“{t.note}”</p>}
              </Link>
            ))}
          </Card>
        )}
      </section>
      <Disclaimer />
    </main>
  );
}
