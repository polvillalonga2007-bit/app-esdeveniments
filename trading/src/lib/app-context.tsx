"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Quote } from "./market";
import { loadState, opValue, runTriggers, saveState, START_CASH, State } from "./store";
import { Currency, setDisplayCurrency, signedMoney } from "./format";
import { shortTicker } from "./assets";

type Ctx = {
  state: State;
  setState: (s: State) => void;
  quotes: Quote[];
  quotesError: boolean;
  quote: (symbol: string) => Quote | undefined;
  totals: { positionsValue: number; total: number; pnl: number; pnlPct: number };
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rate: number; // 1 € en la moneda triada
  notify: (text: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp fora del proveïdor");
  return c;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setRaw] = useState<State | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesError, setQuotesError] = useState(false);
  const [eurUsd, setEurUsd] = useState<number | null>(null);
  const [currency, setCurrencyRaw] = useState<Currency>("USD");
  useEffect(() => {
    try {
      const c = localStorage.getItem("parquet:moneda");
      if (c === "EUR" || c === "USD") setCurrencyRaw(c);
      const fx = Number(localStorage.getItem("parquet:eurusd"));
      if (fx > 0.5 && fx < 2) setEurUsd(fx);
    } catch {}
  }, []);
  const setCurrency = useCallback((c: Currency) => {
    setCurrencyRaw(c);
    try {
      localStorage.setItem("parquet:moneda", c);
    } catch {}
  }, []);

  const setState = useCallback((s: State) => {
    setRaw(s);
    saveState(s);
  }, []);

  const loadQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      const j = await res.json();
      if (Array.isArray(j.quotes) && j.quotes.length) {
        setQuotes(j.quotes);
        setQuotesError(false);
        if (typeof j.eurUsd === "number") {
          setEurUsd(j.eurUsd);
          try {
            localStorage.setItem("parquet:eurusd", String(j.eurUsd));
          } catch {}
        }
      } else setQuotesError(true);
    } catch {
      setQuotesError(true);
    }
  }, []);

  useEffect(() => {
    const s = loadState();
    if (!s) {
      router.replace("/");
      return;
    }
    setRaw(s);
    loadQuotes();
    const id = setInterval(loadQuotes, 30_000);
    return () => clearInterval(id);
  }, [router, loadQuotes]);

  const quote = useCallback((symbol: string) => quotes.find((q) => q.symbol === symbol), [quotes]);

  const [notices, setNotices] = useState<{ id: number; text: string }[]>([]);
  const notify = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setNotices((n) => [...n, { id, text }]);
    setTimeout(() => setNotices((n) => n.filter((x) => x.id !== id)), 7000);
  }, []);

  // Stops, objectius i liquidacions de les operacions obertes (cada cop que arriben preus nous)
  useEffect(() => {
    if (!state?.ops?.length || !quotes.length) return;
    const { state: next, closed } = runTriggers(state, (sym) => {
      const q = quotes.find((x) => x.symbol === sym);
      return q?.open ? q.price : undefined;
    });
    if (!closed.length) return;
    setState(next);
    for (const c of closed) {
      const what = c.reason === "sl" ? "ha tocat l'stop" : c.reason === "tp" ? "ha arribat a l'objectiu" : "s'ha tancat perquè has perdut tota la garantia";
      notify(`${c.op.dir === "llarg" ? "Compra" : "Venda"} de ${shortTicker(c.op.symbol)} ${what}: ${signedMoney(c.pnl)}`);
    }
  }, [quotes, state, setState, notify]);

  const totals = useMemo(() => {
    const cash = state?.user.cash ?? START_CASH;
    let positionsValue = 0;
    for (const p of state?.positions ?? []) {
      const q = quote(p.symbol);
      positionsValue += q ? q.price * p.qty : p.cost;
    }
    for (const o of state?.ops ?? []) {
      const q = quote(o.symbol);
      positionsValue += q ? opValue(o, q.price) : o.margin;
    }
    const total = cash + positionsValue;
    return { positionsValue, total, pnl: total - START_CASH, pnlPct: ((total - START_CASH) / START_CASH) * 100 };
  }, [state, quote]);

  if (!state) return null;

  // Fins que no tenim el canvi del dia, mostrem euros
  const effective: Currency = currency === "USD" && eurUsd ? "USD" : "EUR";
  const rate = effective === "USD" ? (eurUsd as number) : 1;
  setDisplayCurrency(effective, rate);

  return (
    <AppCtx.Provider value={{ state, setState, quotes, quotesError, quote, totals, currency: effective, setCurrency, rate, notify }}>
      {children}
      {notices.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-50 mx-auto flex max-w-md flex-col gap-2 px-4" role="status">
          {notices.map((n) => (
            <div key={n.id} className="rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg">{n.text}</div>
          ))}
        </div>
      )}
    </AppCtx.Provider>
  );
}
