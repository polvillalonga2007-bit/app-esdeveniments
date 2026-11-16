"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Quote } from "./market";
import { loadState, saveState, START_CASH, State } from "./store";
import { Currency, setDisplayCurrency } from "./format";

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

  const totals = useMemo(() => {
    const cash = state?.user.cash ?? START_CASH;
    let positionsValue = 0;
    for (const p of state?.positions ?? []) {
      const q = quote(p.symbol);
      positionsValue += q ? q.price * p.qty : p.cost;
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
    <AppCtx.Provider value={{ state, setState, quotes, quotesError, quote, totals, currency: effective, setCurrency, rate }}>
      {children}
    </AppCtx.Provider>
  );
}
