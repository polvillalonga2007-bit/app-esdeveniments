"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { currencySymbol, fromDisp, money, pct, price, qty, signedMoney, toDisp, tone } from "@/lib/format";
import { closeOp, errorText, Op, opPnl, State, updateOpLevels } from "@/lib/store";
import { freshQuote, parseNum } from "@/lib/fresh-price";
import { shortTicker } from "@/lib/assets";

const small = "h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

// Llista d'operacions obertes amb el guany en directe i el botó de tancar
export function OpenOps({ symbol, title = "Operacions obertes" }: { symbol?: string; title?: string }) {
  const { state, setState, quote, notify } = useApp();
  const ops = (state.ops ?? []).filter((o) => !symbol || o.symbol === symbol);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  if (!ops.length) return null;

  const livePnl = (o: Op) => {
    const q = quote(o.symbol);
    return q ? opPnl(o, q.price) : 0;
  };
  const total = ops.reduce((a, o) => a + livePnl(o), 0);

  async function close(list: Op[]) {
    setError("");
    setBusy(list.length > 1 ? "totes" : list[0].id);
    try {
      let s: State = state;
      let sum = 0;
      const prices = new Map<string, number>();
      for (const o of list) {
        if (!prices.has(o.symbol)) prices.set(o.symbol, (await freshQuote(o.symbol)).price);
        s = closeOp(s, o.id, prices.get(o.symbol)!, "manual");
        sum += s.trades[0].realized ?? 0;
      }
      setState(s);
      notify(list.length > 1 ? `Has tancat ${list.length} operacions: ${signedMoney(sum)}` : `Operació tancada: ${signedMoney(sum)}`);
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(null);
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{title}</h2>
        <span className={`text-sm font-bold ${tone(total)}`}>{signedMoney(total)}</span>
      </div>
      <div className="divide-y divide-line rounded-2xl border border-line bg-white">
        {ops.map((o) => {
          const q = quote(o.symbol);
          const pnl = livePnl(o);
          const long = o.dir === "llarg";
          return (
            <div key={o.id} className="flex flex-col gap-2 px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase ${long ? "bg-up-soft text-up" : "bg-down-soft text-down"}`}>
                      {long ? "Compra" : "Venda"}
                    </span>
                    {symbol ? (
                      <span className="font-semibold">{money(o.margin)}</span>
                    ) : (
                      <Link href={`/actiu/${encodeURIComponent(o.symbol)}`} className="truncate font-semibold hover:underline">
                        {o.asset_name} · {money(o.margin)}
                      </Link>
                    )}
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted">
                    {qty(o.qty)} {shortTicker(o.symbol)} · {price(o.entry)} → {q ? price(q.price) : "–"}
                  </div>
                  {(o.sl != null || o.tp != null) && (
                    <div className="text-[13px] text-muted">
                      {o.sl != null && <span className="text-down">Stop {price(o.sl)}</span>}
                      {o.sl != null && o.tp != null && " · "}
                      {o.tp != null && <span className="text-up">Objectiu {price(o.tp)}</span>}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-bold ${tone(pnl)}`}>{signedMoney(pnl)}</div>
                  <div className={`text-[13px] font-medium ${tone(pnl)}`}>{pct((pnl / o.margin) * 100)}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(editing === o.id ? null : o.id)}
                  className="h-9 flex-1 rounded-lg border border-line text-[13px] font-semibold"
                >
                  Stop / objectiu
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => close([o])}
                  className="h-9 flex-1 rounded-lg bg-ink text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  {busy === o.id ? "Tancant…" : `Tancar (${long ? "vendre" : "recomprar"})`}
                </button>
              </div>
              {editing === o.id && <LevelsEditor op={o} onDone={() => setEditing(null)} />}
            </div>
          );
        })}
      </div>
      {ops.length > 1 && (
        <button type="button" disabled={!!busy} onClick={() => close(ops)} className="h-10 rounded-xl border border-line bg-white text-sm font-semibold disabled:opacity-50">
          {busy === "totes" ? "Tancant…" : `Tancar-les totes (${signedMoney(total)})`}
        </button>
      )}
      {error && <p role="alert" className="rounded-lg bg-down-soft px-3 py-2 text-[13px] text-down">{error}</p>}
    </section>
  );
}

function LevelsEditor({ op, onDone }: { op: Op; onDone: () => void }) {
  const { state, setState, quote } = useApp();
  const fmt = (v: number | null) => (v == null ? "" : (Math.round(toDisp(v) * 100) / 100).toString().replace(".", ","));
  const [sl, setSl] = useState(fmt(op.sl));
  const [tp, setTp] = useState(fmt(op.tp));
  const [error, setError] = useState("");

  function save() {
    setError("");
    const q = quote(op.symbol);
    try {
      const s = parseNum(sl);
      const t = parseNum(tp);
      setState(updateOpLevels(state, op.id, q?.price ?? op.entry, s == null ? null : fromDisp(s), t == null ? null : fromDisp(t)));
      onDone();
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-ground p-2.5">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-down">
          Stop ({currencySymbol()})
          <input className={small} inputMode="decimal" value={sl} onChange={(e) => setSl(e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="Cap" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-up">
          Objectiu ({currencySymbol()})
          <input className={small} inputMode="decimal" value={tp} onChange={(e) => setTp(e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="Cap" />
        </label>
      </div>
      <p className="text-xs text-muted">Deixa-ho en blanc per treure&apos;l. Es comprova cada cop que s&apos;actualitzen els preus mentre tens l&apos;app oberta.</p>
      {error && <p role="alert" className="text-[13px] text-down">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className="h-9 flex-1 rounded-lg border border-line bg-white text-[13px] font-semibold">Cancel·lar</button>
        <button type="button" onClick={save} className="h-9 flex-1 rounded-lg bg-brand text-[13px] font-semibold text-white">Desar</button>
      </div>
    </div>
  );
}
