"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { dateKey, formatDayLong, formatTime } from "@/lib/format";
import { errorText, rpc, type Booking } from "@/lib/supabase";

export function Agenda({ token, bookings, onChange }: { token: string; bookings: Booking[]; onChange: () => void }) {
  const [showCancelled, setShowCancelled] = useState(false);
  const list = bookings.filter((b) => showCancelled || b.status === "confirmada");
  const today = dateKey(new Date());

  const groups = new Map<string, Booking[]>();
  for (const b of list) {
    const k = dateKey(new Date(b.starts_at));
    groups.set(k, [...(groups.get(k) ?? []), b]);
  }
  const cancelledCount = bookings.filter((b) => b.status === "cancelada").length;

  return (
    <div className="flex flex-col gap-6">
      {groups.size === 0 && (
        <Card className="border-dashed text-center">
          <p className="font-semibold">Encara no hi ha reserves</p>
          <p className="mt-1 text-sm text-muted">Quan un client reservi, sortirà aquí.</p>
        </Card>
      )}
      {[...groups.entries()].map(([day, items]) => (
        <section key={day} className="flex flex-col gap-2.5">
          <SectionTitle>{day === today ? "Avui" : formatDayLong(items[0].starts_at)}</SectionTitle>
          {items.map((b) => <BookingRow key={b.id} b={b} token={token} onChange={onChange} />)}
        </section>
      ))}
      {cancelledCount > 0 && (
        <button onClick={() => setShowCancelled(!showCancelled)} className="text-sm font-semibold text-muted underline">
          {showCancelled ? "Amagar les anul·lades" : `Veure les anul·lades (${cancelledCount})`}
        </button>
      )}
    </div>
  );
}

function BookingRow({ b, token, onChange }: { b: Booking; token: string; onChange: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelled = b.status === "cancelada";

  async function cancel() {
    setBusy(true);
    try {
      await rpc("rs_cancel_booking", { p_token: token, p_id: b.id });
      onChange();
    } catch (e) {
      alertText(errorText(e));
      setBusy(false);
    }
  }

  return (
    <Card className={cancelled ? "opacity-60" : ""}>
      <div className="flex items-start gap-3.5">
        <div className="w-14 shrink-0">
          <p className={`text-lg font-bold tabular-nums ${cancelled ? "line-through" : ""}`}>{formatTime(b.starts_at)}</p>
          <p className="text-xs text-muted tabular-nums">fins {formatTime(b.ends_at)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{b.customer_name}</p>
          <p className="text-[15px] text-muted">{b.service_name}</p>
          {b.note && <p className="mt-1 rounded-lg bg-ground px-2.5 py-1.5 text-sm">“{b.note}”</p>}
          {cancelled && (
            <p className="mt-1 text-sm font-medium text-bad">Anul·lada {b.cancelled_by === "client" ? "pel client" : "per tu"}</p>
          )}
        </div>
      </div>
      {!cancelled && (
        <div className="mt-3 flex gap-2">
          <a href={`tel:${b.customer_phone}`} className="flex h-10 flex-1 items-center justify-center rounded-xl border border-line text-sm font-semibold">
            Trucar · {b.customer_phone}
          </a>
          {confirming ? (
            <button disabled={busy} onClick={cancel} className="h-10 rounded-xl bg-bad px-3 text-sm font-semibold text-white">
              {busy ? "…" : "Sí, anul·lar"}
            </button>
          ) : (
            <button onClick={() => setConfirming(true)} className="h-10 rounded-xl px-3 text-sm font-semibold text-bad hover:bg-bad-soft">
              Anul·lar
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function alertText(msg: string) {
  console.error(msg);
}
