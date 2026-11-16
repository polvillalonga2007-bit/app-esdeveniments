"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BackLink, Card, Disclaimer, ErrorBox, Field, SectionTitle, inputClass } from "@/components/ui";
import { Candle, CandleChart, ChartApi, INDICATORS, IndicatorKey } from "@/components/candle-chart";
import { Drawing, DrawingLayer, loadDrawings, saveDrawings, Tool } from "@/components/drawing-layer";
import { DrawToolbar } from "@/components/draw-toolbar";
import { NewsList } from "@/components/news-list";
import { ChartTabs } from "@/components/chart-tabs";
import { SrLayer } from "@/components/sr-layer";
import { useApp } from "@/lib/app-context";
import { HOURS_LABEL, findAsset, shortTicker } from "@/lib/assets";
import { currencySymbol, dateTime, fromDisp, money, moneyRaw, nativeMoney, pct, price, qty, signedMoney, toDisp, tone } from "@/lib/format";
import { applyTrade, errorText, TradeError, tradeLabel } from "@/lib/store";
import { Plan, QuickTrade } from "@/components/quick-trade";
import { OpenOps } from "@/components/open-ops";
import type { Quote } from "@/lib/market";

const TIMEFRAMES = [
  ["1m", "1m"],
  ["5m", "5m"],
  ["15m", "15m"],
  ["1h", "1h"],
  ["4h", "4h"],
  ["1d", "1D"],
  ["1wk", "1S"],
] as const;

const PREFS = "parquet:grafic";
type Prefs = { tf: string; ind: IndicatorKey[]; mode: "espelmes" | "linia" };
function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS) ?? "null");
    if (p && typeof p.tf === "string" && Array.isArray(p.ind)) return p;
  } catch {}
  return { tf: "15m", ind: ["vol", "mm20"], mode: "espelmes" };
}

export default function Actiu({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: raw } = use(params);
  const symbol = decodeURIComponent(raw);
  // key: cada pestanya comença amb l'estat net (formulari, gràfic, dibuixos)
  return <ActiuView key={symbol} symbol={symbol} />;
}

function ActiuView({ symbol }: { symbol: string }) {
  const asset = findAsset(symbol);
  const { state, setState, quote, currency, rate } = useApp();
  const q = quote(symbol);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [chartError, setChartError] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [side, setSide] = useState<"compra" | "venda">("compra");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => setPrefs(loadPrefs()), []);

  function updatePrefs(p: Partial<Prefs>) {
    setPrefs((old) => {
      const next = { ...(old ?? loadPrefs()), ...p };
      try {
        localStorage.setItem(PREFS, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const tf = prefs?.tf;
  useEffect(() => {
    if (!tf) return;
    let alive = true;
    const load = (first: boolean) => {
      if (first) {
        setCandles(null);
        setChartError(false);
      }
      fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&tf=${tf}`)
        .then((r) => r.json())
        .then((j) => alive && (j.candles ? setCandles(j.candles) : first && setChartError(true)))
        .catch(() => alive && first && setChartError(true));
    };
    load(true);
    const id = setInterval(() => load(false), tf === "1m" || tf === "5m" ? 30_000 : 120_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [symbol, tf]);

  const [api, setApi] = useState<ChartApi | null>(null);
  const onReady = useCallback((a: ChartApi | null) => setApi(a), []);
  const [tool, setTool] = useState<Tool>("cursor");
  const [drawings, setDrawingsRaw] = useState<Drawing[]>([]);
  const [history, setHistory] = useState<Drawing[][]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => setDrawingsRaw(loadDrawings(symbol)), [symbol]);
  const drawingsRef = useRef<Drawing[]>([]);
  useEffect(() => {
    drawingsRef.current = drawings;
  }, [drawings]);
  // record = guardar l'estat anterior per poder desfer (durant un arrossegament només es guarda a l'inici)
  const setDrawings = useCallback(
    (d: Drawing[], record = true) => {
      if (record) setHistory((h) => [...h.slice(-30), drawingsRef.current]);
      drawingsRef.current = d;
      setDrawingsRaw(d);
      saveDrawings(symbol, d);
    },
    [symbol],
  );
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    setDrawings(drawingsRef.current.filter((d) => d.id !== selected));
    setSelected(null);
  }, [selected, setDrawings]);
  // Tecla Supr o Retrocés esborra el dibuix seleccionat (si no s'està escrivint en un camp)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea")) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, deleteSelected]);
  // Un toc al gràfic (sense eina) treu la selecció
  useEffect(() => {
    if (!api) return;
    const h = () => setSelected(null);
    api.chart.subscribeClick(h);
    return () => api.chart.unsubscribeClick(h);
  }, [api]);

  const dispCandles = useMemo(
    () => (candles && rate !== 1 ? candles.map((c) => ({ ...c, o: c.o * rate, h: c.h * rate, l: c.l * rate, c: c.c * rate })) : candles),
    [candles, rate],
  );

  const plan: Plan | null = useMemo(() => {
    const d = drawings.find((x) => x.id === selected);
    return d && (d.kind === "long" || d.kind === "short") ? { dir: d.kind === "long" ? "llarg" : "curt", sl: d.stop, tp: d.target } : null;
  }, [drawings, selected]);

  // Línies al gràfic per a les operacions obertes d'aquest actiu (entrada, stop i objectiu)
  const myOps = useMemo(() => (state.ops ?? []).filter((o) => o.symbol === symbol), [state.ops, symbol]);
  useEffect(() => {
    if (!api) return;
    const lines = myOps.flatMap((o) => {
      const long = o.dir === "llarg";
      const out = [
        api.series.createPriceLine({ price: o.entry * rate, color: long ? "#16a34a" : "#dc2626", lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: long ? "Compra" : "Venda" }),
      ];
      if (o.sl != null) out.push(api.series.createPriceLine({ price: o.sl * rate, color: "#dc2626", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "Stop" }));
      if (o.tp != null) out.push(api.series.createPriceLine({ price: o.tp * rate, color: "#16a34a", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "Objectiu" }));
      return out;
    });
    return () => {
      for (const l of lines) {
        try {
          api.series.removePriceLine(l);
        } catch {}
      }
    };
  }, [api, myOps, rate]);

  const activeSet = useMemo(() => new Set(prefs?.ind ?? []), [prefs?.ind]);

  if (!asset) {
    return (
      <main className="flex flex-col gap-4 px-4 pt-5">
        <BackLink href="/mercat" />
        <p>No coneixem aquest actiu.</p>
      </main>
    );
  }

  const pos = state.positions.find((p) => p.symbol === symbol);
  const posValue = pos && q ? pos.qty * q.price : pos?.cost ?? 0;
  const posPnl = pos ? posValue - pos.cost : 0;
  const myTrades = state.trades.filter((t) => t.symbol === symbol).slice(0, 5);
  const max = side === "compra" ? state.user.cash : posValue;
  const amountNum = fromDisp(Number(amount.replace(",", "."))); // en euros
  const sellAll = side === "venda" && pos && amountNum >= posValue * 0.999;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone("");
    setBusy(true);
    try {
      const res = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
      const j = (await res.json()) as { quote?: Quote; error?: string };
      if (!j.quote) throw new TradeError("PREU_NO_DISPONIBLE");
      if (!j.quote.open) throw new TradeError("MERCAT_TANCAT");
      const next = applyTrade(state, {
        symbol,
        name: asset!.name,
        side,
        price: j.quote.price,
        amount: amountNum,
        all: !!sellAll,
        note,
      });
      setState(next);
      const t = next.trades[0];
      setDone(
        side === "compra"
          ? `Has comprat ${qty(t.qty)} ${shortTicker(symbol)} per ${money(t.total)}.`
          : `Has venut ${qty(t.qty)} ${shortTicker(symbol)} per ${money(t.total)}. Resultat: ${signedMoney(t.realized ?? 0)}.`,
      );
      setAmount("");
      setNote("");
    } catch (err) {
      setError(errorText(err));
    }
    setBusy(false);
  }

  const quick = side === "compra" ? [100, 500, 1000] : [];

  return (
    <main className="flex flex-col gap-5 px-4 pt-3">
      <ChartTabs current={symbol} />
      <header className="flex items-center gap-1">
        <BackLink href="/mercat" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">{asset.name}</h1>
          <p className="text-sm text-muted">{shortTicker(symbol)}</p>
        </div>
      </header>

      <Card className="flex flex-col gap-3 px-3">
        <div className="px-1">
          <div className="text-[32px] font-bold leading-tight tracking-tight">{q ? price(q.price) : "–"}</div>
          <div className={`text-[15px] font-semibold ${tone(q?.changePct)}`}>
            {pct(q?.changePct)} <span className="font-normal text-muted">{q && !q.open && asset.type !== "cripto" ? "a l'últim tancament" : "avui"}</span>
          </div>
          {q?.native && (q.native.currency !== currency || q.native.ext != null) && (
            <div className="mt-1 flex flex-col gap-0.5 text-[13px] text-muted">
              {q.native.currency !== currency && <span>
                Preu original: <strong className="text-ink">{nativeMoney(q.native.price, q.native.currency)}</strong> (passat a {currency === "USD" ? "dòlars" : "euros"} al canvi d&apos;avui)
              </span>}
              {q.native.ext != null && (
                <span>
                  Ara al {q.native.extLabel}:{" "}
                  <strong className="text-ink">{nativeMoney(q.native.ext, q.native.currency)}</strong>{" "}
                  <span className={`font-semibold ${tone(q.native.extChangePct)}`}>{pct(q.native.extChangePct)}</span>
                </span>
              )}
            </div>
          )}
          {q && !q.open && asset.type !== "cripto" && (
            <p className="mt-1 text-[13px] text-muted">
              La borsa està tancada: el preu és el del tancament del {new Date(q.updatedAt).toLocaleString("ca-ES", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="no-scrollbar flex flex-1 gap-0.5 overflow-x-auto rounded-xl bg-ground p-1 text-[13px] font-semibold">
            {TIMEFRAMES.map(([k, l]) => (
              <button key={k} type="button" onClick={() => updatePrefs({ tf: k })} className={`h-8 min-w-9 flex-1 rounded-lg px-1 ${tf === k ? "bg-white shadow-sm" : "text-muted"}`}>
                {l}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => updatePrefs({ mode: prefs?.mode === "linia" ? "espelmes" : "linia" })}
            aria-label={prefs?.mode === "linia" ? "Veure espelmes" : "Veure línia"}
            title={prefs?.mode === "linia" ? "Veure espelmes" : "Veure línia"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ground text-ink"
          >
            {prefs?.mode === "linia" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M7 4v16M17 4v16" /><rect x="5" y="8" width="4" height="7" fill="currentColor" /><rect x="15" y="6" width="4" height="9" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l5-5 4 4 8-8" /></svg>
            )}
          </button>
        </div>
        <DrawToolbar
          tool={tool}
          setTool={(t) => { setTool(t); setSelected(null); }}
          canUndo={history.length > 0}
          onUndo={() => {
            const prev = history[history.length - 1];
            if (!prev) return;
            setHistory((h) => h.slice(0, -1));
            setDrawingsRaw(prev);
            saveDrawings(symbol, prev);
          }}
          hasSelection={!!selected}
          hasDrawings={drawings.length > 0}
          onDeleteSelected={deleteSelected}
          onClearAll={() => {
            setDrawings([]);
            setSelected(null);
          }}
        />
        <QuickTrade symbol={symbol} name={asset.name} plan={plan} />
        <div className="relative -mx-1">
          {candles && prefs ? (
            candles.length > 1 ? (
              <>
                <CandleChart
                  candles={dispCandles!}
                  active={activeSet}
                  mode={prefs.mode}
                  intraday={!["1d", "1wk"].includes(prefs.tf)}
                  onReady={onReady}
                  viewKey={`${symbol}|${prefs.tf}`}
                />
                {activeSet.has("sr") && <SrLayer api={api} candles={dispCandles!} />}
                <DrawingLayer
                  api={api}
                  candles={candles}
                  scale={rate}
                  tool={tool}
                  setTool={setTool}
                  drawings={drawings}
                  setDrawings={setDrawings}
                  selected={selected}
                  setSelected={setSelected}
                />
              </>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted">Encara no hi ha dades per a aquesta temporalitat</div>
            )
          ) : chartError ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted">No s&apos;ha pogut carregar el gràfic</div>
          ) : (
            <div className="h-[320px] animate-pulse rounded-xl bg-ground" />
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {INDICATORS.map((ind) => {
            const on = activeSet.has(ind.key);
            return (
              <button
                key={ind.key}
                type="button"
                aria-pressed={on}
                onClick={() => updatePrefs({ ind: on ? (prefs?.ind ?? []).filter((k) => k !== ind.key) : [...(prefs?.ind ?? []), ind.key] })}
                className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold ${on ? "border-ink bg-ink text-white" : "border-line text-muted"}`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: ind.color }} />
                {ind.label}
              </button>
            );
          })}
          <button type="button" onClick={() => setShowHelp((v) => !v)} className="h-8 rounded-full px-2 text-[13px] font-semibold text-brand">
            {showHelp ? "Amagar ajuda" : "Què vol dir?"}
          </button>
        </div>
        {showHelp && (
          <ul className="flex flex-col gap-2 rounded-xl bg-ground p-3 text-[13px] leading-relaxed">
            <li><strong>Espelmes:</strong> cada espelma és un període (p. ex. 15 minuts). El cos va del preu d&apos;obertura al de tancament; verda si ha pujat, vermella si ha baixat. Les línies fines marquen el màxim i el mínim.</li>
            {INDICATORS.map((i) => (
              <li key={i.key}><strong>{i.label}:</strong> {i.help}</li>
            ))}
            <li className="text-muted">Pots fer zoom amb dos dits o la roda del ratolí i arrossegar per veure el passat.</li>
          </ul>
        )}
        <p className="flex items-center gap-2 px-1 text-xs text-muted">
          <span className={`inline-block h-2 w-2 rounded-full ${q?.open ? "bg-up" : "bg-muted"}`} />
          {q?.open ? "Mercat obert" : "Mercat tancat"} · {HOURS_LABEL[asset.type]}
        </p>
      </Card>

      <OpenOps symbol={symbol} title={`Operacions obertes de ${shortTicker(symbol)}`} />

      {pos && (
        <Card className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted">En tens</div>
            <div className="font-semibold">{qty(pos.qty)} {shortTicker(symbol)}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Valen ara</div>
            <div className="font-semibold">{money(posValue)}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Et van costar</div>
            <div className="font-semibold">{money(pos.cost)}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Guany / pèrdua</div>
            <div className={`font-semibold ${tone(posPnl)}`}>{signedMoney(posPnl)} ({pct(pos.cost ? (posPnl / pos.cost) * 100 : 0)})</div>
          </div>
        </Card>
      )}

      <SectionTitle>Comprar i guardar (inversió)</SectionTitle>
      <Card className="-mt-3">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 rounded-xl bg-ground p-1 font-semibold">
            {(["compra", "venda"] as const).map((s) => (
              <button
                key={s}
                type="button"
                disabled={s === "venda" && !pos}
                onClick={() => { setSide(s); setAmount(""); setError(""); setDone(""); }}
                className={`h-11 rounded-lg disabled:opacity-40 ${side === s ? (s === "compra" ? "bg-up text-white" : "bg-down text-white") : "text-muted"}`}
              >
                {s === "compra" ? "Comprar" : "Vendre"}
              </button>
            ))}
          </div>
          <Field label={`${side === "compra" ? "Quants" : "Quants"} ${currency === "USD" ? "dòlars" : "euros"} ${side === "compra" ? "vols invertir?" : "en vols vendre?"}`} hint={`Màxim: ${money(max)}`}>
            <div className="relative">
              <input
                className={`${inputClass} pr-10`}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="0"
                required
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">{currencySymbol()}</span>
            </div>
          </Field>
          <div className="flex flex-wrap gap-2">
            {quick.map((v) => (
              <button key={v} type="button" onClick={() => setAmount(String(v))} className="h-9 rounded-full border border-line px-3.5 text-sm font-semibold hover:bg-black/[0.03]">
                {moneyRaw(v).replace(",00", "")}
              </button>
            ))}
            <button type="button" onClick={() => setAmount((Math.floor(toDisp(max) * 100) / 100).toFixed(2))} className="h-9 rounded-full border border-line px-3.5 text-sm font-semibold hover:bg-black/[0.03]">
              {side === "compra" ? "Tot el disponible" : "Vendre-ho tot"}
            </button>
          </div>
          {q && amountNum > 0 && (
            <p className="text-sm text-muted">
              Seran aproximadament {qty(Math.min(amountNum, max) / q.price)} {shortTicker(symbol)} a {price(q.price)} cadascun.
            </p>
          )}
          <Field label="Per què ho fas? (opcional)" hint="Apuntar-ho t'ajuda a aprendre dels teus encerts i errors.">
            <textarea
              className={`${inputClass} h-20 resize-none py-3`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder={side === "compra" ? "Ex: crec que pujarà després de la presentació de resultats" : "Ex: ja ha pujat un 10 %, recullo guanys"}
            />
          </Field>
          <ErrorBox>{error}</ErrorBox>
          {done && <p role="status" className="rounded-xl bg-up-soft px-3.5 py-3 text-sm font-medium text-up">{done}</p>}
          <button
            className={`flex h-14 w-full items-center justify-center rounded-2xl text-base font-semibold text-white disabled:opacity-60 ${side === "compra" ? "bg-up" : "bg-down"}`}
            disabled={busy || (q != null && !q.open)}
          >
            {busy ? "Un moment…" : q && !q.open ? "Mercat tancat" : side === "compra" ? "Comprar" : sellAll ? "Vendre-ho tot" : "Vendre"}
          </button>
        </form>
      </Card>

      <section className="flex flex-col gap-2">
        <SectionTitle>Notícies de {asset.name}</SectionTitle>
        <NewsList symbol={symbol} limit={6} />
        <Link href="/noticies" className="text-center text-sm font-semibold text-brand">Més notícies →</Link>
      </section>

      {myTrades.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>Les teves últimes operacions</SectionTitle>
          <Card className="divide-y divide-line p-0">
            {myTrades.map((t) => (
              <div key={t.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold">{tradeLabel(t)} · {money(t.total)}</div>
                  <div className="text-muted">{dateTime(t.created_at)}</div>
                </div>
                {t.realized != null && <div className={`font-semibold ${tone(t.realized)}`}>{signedMoney(t.realized)}</div>}
              </div>
            ))}
          </Card>
          <Link href="/diari" className="text-center text-sm font-semibold text-brand">Veure tot el diari →</Link>
        </section>
      )}
      <Disclaimer />
    </main>
  );
}
