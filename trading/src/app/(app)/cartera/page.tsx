"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, Disclaimer, Logo, SectionTitle, secondaryButton } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { money, pct, qty, signedMoney, tone } from "@/lib/format";
import { shortTicker } from "@/lib/assets";
import { resetState, START_CASH } from "@/lib/store";

export default function Cartera() {
  const { state, setState, quote, totals, quotesError } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  function reset() {
    setState(resetState(state));
    setConfirmReset(false);
  }

  const cashPct = totals.total ? (state.user.cash / totals.total) * 100 : 100;

  return (
    <main className="flex flex-col gap-5 px-4 pt-5">
      <header className="flex items-center justify-between">
        <Logo />
        <span className="text-sm text-muted">Hola, {state.user.nickname}</span>
      </header>

      <div className="flex flex-col gap-1 rounded-2xl bg-brand p-4 text-white">
        <span className="text-sm text-white/75">Valor total de la cartera</span>
        <span className="text-[34px] font-bold leading-tight tracking-tight">{money(totals.total)}</span>
        <span className="text-[15px] font-semibold">
          {signedMoney(totals.pnl)} ({pct(totals.pnlPct)}) <span className="font-normal text-white/75">des que vas començar amb {money(START_CASH)}</span>
        </span>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
          <div className="h-full rounded-full bg-white" style={{ width: `${100 - cashPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-white/80">
          <span>Invertit: {money(totals.positionsValue)}</span>
          <span>Disponible: {money(state.user.cash)}</span>
        </div>
      </div>

      {quotesError && <p className="rounded-xl bg-down-soft px-3.5 py-3 text-sm text-down">Ara mateix no arriben els preus. Els valors poden no estar al dia.</p>}

      <section className="flex flex-col gap-2">
        <SectionTitle>El que tens</SectionTitle>
        {state.positions.length === 0 ? (
          <Card className="flex flex-col gap-3 text-center">
            <p className="text-[15px] text-muted">Encara no has comprat res. Fes un cop d&apos;ull al mercat i tria la teva primera inversió.</p>
            <Link href="/mercat" className="font-semibold text-brand">Anar al mercat →</Link>
          </Card>
        ) : (
          <Card className="divide-y divide-line p-0">
            {state.positions.map((p) => {
              const q = quote(p.symbol);
              const value = q ? q.price * p.qty : p.cost;
              const pnl = value - p.cost;
              const pnlPct = p.cost ? (pnl / p.cost) * 100 : 0;
              return (
                <Link key={p.symbol} href={`/actiu/${encodeURIComponent(p.symbol)}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-black/[0.02]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{p.asset_name}</div>
                    <div className="text-sm text-muted">{qty(p.qty)} {shortTicker(p.symbol)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{money(value)}</div>
                    <div className={`text-sm font-medium ${tone(pnl)}`}>{signedMoney(pnl)} ({pct(pnlPct)})</div>
                  </div>
                </Link>
              );
            })}
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Compte</SectionTitle>
        {confirmReset ? (
          <Card className="flex flex-col gap-3">
            <p className="text-[15px]">Es vendrà tot, s&apos;esborrarà el diari i tornaràs a tenir {money(START_CASH)}. Segur?</p>
            <div className="grid grid-cols-2 gap-2">
              <button className={secondaryButton} onClick={() => setConfirmReset(false)}>No</button>
              <button className="flex h-12 items-center justify-center rounded-2xl bg-down font-semibold text-white disabled:opacity-60" onClick={reset}>
                Sí, tornar a començar
              </button>
            </div>
          </Card>
        ) : (
          <button className={secondaryButton} onClick={() => setConfirmReset(true)}>Tornar a començar amb 10.000 €</button>
        )}
      </section>
      <Disclaimer />
    </main>
  );
}
