"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { currencySymbol, fromDisp, money, price, signedMoney } from "@/lib/format";
import { Dir, errorText, openOp } from "@/lib/store";
import { freshQuote, parseNum } from "@/lib/fresh-price";
import { shortTicker } from "@/lib/assets";

export type Plan = { dir: Dir; sl: number; tp: number }; // en €

const VOL_KEY = "parquet:volum";
const small = "h-10 w-full rounded-lg border border-line bg-white px-2.5 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

// Panell de compra i venda amb un sol clic, enganxat al gràfic
export function QuickTrade({ symbol, name, plan, livePrice }: { symbol: string; name: string; plan: Plan | null; livePrice?: number | null }) {
  const { state, setState, quote, notify } = useApp();
  const q = quote(symbol);
  const [amount, setAmount] = useState("100");
  const [levels, setLevels] = useState(false);
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [busy, setBusy] = useState<Dir | "pla" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const v = localStorage.getItem(VOL_KEY);
      if (v) setAmount(v);
    } catch {}
  }, []);
  function changeAmount(v: string) {
    const clean = v.replace(/[^0-9.,]/g, "");
    setAmount(clean);
    try {
      localStorage.setItem(VOL_KEY, clean);
    } catch {}
  }

  async function open(dir: Dir, fromPlan = false) {
    setError("");
    setBusy(fromPlan ? "pla" : dir);
    try {
      const a = parseNum(amount);
      const fq = await freshQuote(symbol);
      const slE = fromPlan ? plan!.sl : levels && parseNum(sl) != null ? fromDisp(parseNum(sl)!) : null;
      const tpE = fromPlan ? plan!.tp : levels && parseNum(tp) != null ? fromDisp(parseNum(tp)!) : null;
      const next = openOp(state, { symbol, name, dir, price: fq.price, amount: a == null ? 0 : fromDisp(a), sl: slE, tp: tpE });
      setState(next);
      const o = next.ops![0];
      notify(`${dir === "llarg" ? "Compra" : "Venda"} oberta: ${money(o.margin)} de ${shortTicker(symbol)} a ${price(o.entry)}`);
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(null);
  }

  const closed = q != null && !q.open;
  const px = livePrice ? price(livePrice) : q ? price(q.price) : "–";

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_minmax(0,0.9fr)_1fr] items-stretch gap-1.5">
        <button
          type="button"
          onClick={() => open("curt")}
          disabled={!!busy || closed}
          className="flex flex-col items-center justify-center rounded-xl bg-down px-1 py-1.5 text-white disabled:opacity-50"
        >
          <span className="text-[11px] font-bold tracking-wider">{busy === "curt" ? "UN MOMENT…" : "VENDRE"}</span>
          <span className="text-[15px] font-bold tabular-nums">{px}</span>
        </button>
        <label className="flex flex-col items-center justify-center rounded-xl border border-line bg-white px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Import</span>
          <span className="flex items-baseline gap-0.5">
            <input
              aria-label="Import de l'operació"
              inputMode="decimal"
              value={amount}
              onChange={(e) => changeAmount(e.target.value)}
              className="w-full min-w-0 bg-transparent text-center text-[17px] font-bold outline-none"
            />
            <span className="text-sm font-semibold text-muted">{currencySymbol()}</span>
          </span>
        </label>
        <button
          type="button"
          onClick={() => open("llarg")}
          disabled={!!busy || closed}
          className="flex flex-col items-center justify-center rounded-xl bg-up px-1 py-1.5 text-white disabled:opacity-50"
        >
          <span className="text-[11px] font-bold tracking-wider">{busy === "llarg" ? "UN MOMENT…" : "COMPRAR"}</span>
          <span className="text-[15px] font-bold tabular-nums">{px}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-[13px]">
        <button type="button" onClick={() => setLevels((v) => !v)} className="font-semibold text-brand" aria-expanded={levels}>
          {levels ? "− Sense stop ni objectiu" : "+ Afegir stop i objectiu"}
        </button>
        <span className="text-muted">Disponible: {money(state.user.cash)}</span>
      </div>
      {levels && (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-down">
            Stop (tanca si perds)
            <input className={small} inputMode="decimal" value={sl} onChange={(e) => setSl(e.target.value.replace(/[^0-9.,]/g, ""))} placeholder={q ? `Preu en ${currencySymbol()}` : ""} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-up">
            Objectiu (tanca si guanyes)
            <input className={small} inputMode="decimal" value={tp} onChange={(e) => setTp(e.target.value.replace(/[^0-9.,]/g, ""))} placeholder={q ? `Preu en ${currencySymbol()}` : ""} />
          </label>
          <p className="col-span-2 text-xs text-muted">
            A COMPRAR, l&apos;stop va per sota del preu i l&apos;objectiu per sobre. A VENDRE, al revés.
          </p>
        </div>
      )}

      {plan && q && (
        <div className="flex flex-col gap-2 rounded-xl border border-brand/30 bg-brand/5 p-2.5 text-[13px]">
          <span>
            <strong>Pla dibuixat:</strong> {plan.dir === "llarg" ? "compra" : "venda"} · objectiu {price(plan.tp)} · stop {price(plan.sl)}
            <span className="text-muted"> (amb {money(fromDisp(parseNum(amount) ?? 0))}: {signedMoney(((plan.tp - q.price) / q.price) * fromDisp(parseNum(amount) ?? 0) * (plan.dir === "llarg" ? 1 : -1))} / {signedMoney(((plan.sl - q.price) / q.price) * fromDisp(parseNum(amount) ?? 0) * (plan.dir === "llarg" ? 1 : -1))})</span>
          </span>
          <button
            type="button"
            disabled={!!busy || closed}
            onClick={() => open(plan.dir, true)}
            className={`h-10 rounded-lg font-semibold text-white disabled:opacity-50 ${plan.dir === "llarg" ? "bg-up" : "bg-down"}`}
          >
            {busy === "pla" ? "Un moment…" : `Obrir aquesta ${plan.dir === "llarg" ? "compra" : "venda"} ara`}
          </button>
        </div>
      )}

      {closed && <p className="px-1 text-xs text-muted">Mercat tancat: podràs operar quan torni a obrir.</p>}
      {error && <p role="alert" className="rounded-lg bg-down-soft px-3 py-2 text-[13px] text-down">{error}</p>}
    </div>
  );
}
