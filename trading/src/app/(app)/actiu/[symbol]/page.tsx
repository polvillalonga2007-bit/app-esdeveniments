"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { BackLink, Card, Disclaimer, ErrorBox, Field, SectionTitle, inputClass } from "@/components/ui";
import { PriceChart } from "@/components/price-chart";
import { useApp } from "@/lib/app-context";
import { HOURS_LABEL, findAsset, shortTicker } from "@/lib/assets";
import { dateTime, money, pct, price, qty, signedMoney, tone } from "@/lib/format";
import { applyTrade, errorText, TradeError } from "@/lib/store";
import type { Quote } from "@/lib/market";

const RANGES = [
  ["1d", "Avui"],
  ["5d", "5 dies"],
  ["1mo", "1 mes"],
  ["6mo", "6 mesos"],
  ["1y", "1 any"],
] as const;

export default function Actiu({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: raw } = use(params);
  const symbol = decodeURIComponent(raw);
  const asset = findAsset(symbol);
  const { state, setState, quote } = useApp();
  const q = quote(symbol);
  const [range, setRange] = useState<string>("1d");
  const [points, setPoints] = useState<{ t: number; p: number }[] | null>(null);
  const [chartError, setChartError] = useState(false);
  const [side, setSide] = useState<"compra" | "venda">("compra");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => {
    let alive = true;
    setPoints(null);
    setChartError(false);
    fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`)
      .then((r) => r.json())
      .then((j) => alive && (j.points ? setPoints(j.points) : setChartError(true)))
      .catch(() => alive && setChartError(true));
    return () => {
      alive = false;
    };
  }, [symbol, range]);

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
  const amountNum = Number(amount.replace(",", "."));
  const sellAll = side === "venda" && pos && amountNum >= posValue * 0.999;
  const chartChange = points && points.length > 1 ? ((points[points.length - 1].p - points[0].p) / points[0].p) * 100 : null;

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
      <header className="flex items-center gap-1">
        <BackLink href="/mercat" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">{asset.name}</h1>
          <p className="text-sm text-muted">{shortTicker(symbol)}</p>
        </div>
      </header>

      <Card className="flex flex-col gap-3">
        <div>
          <div className="text-[32px] font-bold leading-tight tracking-tight">{q ? price(q.price) : "–"}</div>
          <div className={`text-[15px] font-semibold ${tone(range === "1d" ? q?.changePct : chartChange)}`}>
            {pct(range === "1d" ? q?.changePct : chartChange)} <span className="font-normal text-muted">{RANGES.find((r) => r[0] === range)?.[1].toLowerCase()}</span>
          </div>
        </div>
        {points ? <PriceChart points={points} range={range} /> : chartError ? <div className="flex h-[200px] items-center justify-center text-sm text-muted">No s&apos;ha pogut carregar el gràfic</div> : <div className="h-[200px] animate-pulse rounded-xl bg-ground" />}
        <div className="grid grid-cols-5 gap-1 rounded-xl bg-ground p-1 text-sm font-semibold">
          {RANGES.map(([r, l]) => (
            <button key={r} type="button" onClick={() => setRange(r)} className={`h-9 rounded-lg ${range === r ? "bg-white shadow-sm" : "text-muted"}`}>
              {l}
            </button>
          ))}
        </div>
        <p className="flex items-center gap-2 text-xs text-muted">
          <span className={`inline-block h-2 w-2 rounded-full ${q?.open ? "bg-up" : "bg-muted"}`} />
          {q?.open ? "Mercat obert" : "Mercat tancat"} · {HOURS_LABEL[asset.type]}
        </p>
      </Card>

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

      <Card>
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
          <Field label={side === "compra" ? "Quants euros vols invertir?" : "Quants euros en vols vendre?"} hint={`Màxim: ${money(max)}`}>
            <div className="relative">
              <input
                className={`${inputClass} pr-10`}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="0"
                required
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">€</span>
            </div>
          </Field>
          <div className="flex flex-wrap gap-2">
            {quick.map((v) => (
              <button key={v} type="button" onClick={() => setAmount(String(v))} className="h-9 rounded-full border border-line px-3.5 text-sm font-semibold hover:bg-black/[0.03]">
                {money(v).replace(",00", "")}
              </button>
            ))}
            <button type="button" onClick={() => setAmount((Math.floor(max * 100) / 100).toFixed(2))} className="h-9 rounded-full border border-line px-3.5 text-sm font-semibold hover:bg-black/[0.03]">
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

      {myTrades.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>Les teves últimes operacions</SectionTitle>
          <Card className="divide-y divide-line p-0">
            {myTrades.map((t) => (
              <div key={t.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold">{t.side === "compra" ? "Compra" : "Venda"} · {money(t.total)}</div>
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
