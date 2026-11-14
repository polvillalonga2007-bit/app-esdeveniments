"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card, Loading, secondaryButton } from "@/components/ui";
import { formatDayLong, formatTime } from "@/lib/format";
import { errorText, rpc } from "@/lib/supabase";

type MyBooking = {
  service_name: string;
  starts_at: string;
  ends_at: string;
  customer_name: string;
  status: "confirmada" | "cancelada";
  cancelled_by: "negoci" | "client" | null;
  business: { slug: string; name: string; phone: string | null; address: string | null };
};

function icsHref(b: MyBooking) {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Torn//Reserves//CA", "BEGIN:VEVENT",
    `UID:${fmt(b.starts_at)}-${b.business.slug}@torn`, `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(b.starts_at)}`, `DTEND:${fmt(b.ends_at)}`,
    `SUMMARY:${b.service_name} · ${b.business.name}`,
    b.business.address ? `LOCATION:${b.business.address}` : "",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

export default function MyBookingPage() {
  const { token } = useParams<{ token: string }>();
  const [b, setB] = useState<MyBooking | null | undefined>(undefined);
  const [isNew, setIsNew] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    rpc<MyBooking | null>("rs_my_booking", { p_token: token }).then(setB).catch(() => setB(null));
  }, [token]);

  useEffect(() => {
    setIsNew(!!new URLSearchParams(window.location.search).get("nova"));
    load();
  }, [load]);

  async function cancel() {
    try {
      await rpc("rs_customer_cancel", { p_token: token });
      setIsNew(false);
      load();
    } catch (e) {
      setError(errorText(e));
    }
  }

  if (b === undefined) return <Loading />;
  if (b === null) return <p className="p-8 text-center text-muted">No hem trobat aquesta reserva.</p>;

  const cancelled = b.status === "cancelada";
  const past = new Date(b.starts_at) < new Date();

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-10 pt-12">
      <div className="flex flex-col items-center text-center">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full ${cancelled ? "bg-bad-soft text-bad" : "bg-ok-soft text-ok"}`}>
          {cancelled ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          )}
        </span>
        <h1 className="mt-4 font-display text-[28px] font-bold tracking-tight">
          {cancelled ? "Reserva anul·lada" : isNew ? "Reserva feta!" : "La teva reserva"}
        </h1>
        {cancelled && (
          <p className="mt-1 text-muted">{b.cancelled_by === "client" ? "L'has anul·lat tu." : "El negoci l'ha anul·lat. Truca'ls si vols una altra hora."}</p>
        )}
        {!cancelled && isNew && <p className="mt-1 text-muted">Guarda aquesta pàgina per si l&apos;has de canviar.</p>}
      </div>

      <Card className="mt-8">
        <p className="text-sm text-muted">{b.business.name}</p>
        <p className="mt-0.5 text-lg font-semibold">{b.service_name}</p>
        <p className={`mt-2 text-[17px] ${cancelled ? "line-through text-muted" : ""}`}>
          {formatDayLong(b.starts_at)}
          <br />
          <span className="font-semibold">{formatTime(b.starts_at)} – {formatTime(b.ends_at)}</span>
        </p>
        {b.business.address && <p className="mt-2 text-sm text-muted">{b.business.address}</p>}
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {!cancelled && !past && (
          <a href={icsHref(b)} download="reserva.ics" className={secondaryButton}>Afegir al calendari</a>
        )}
        {b.business.phone && <a href={`tel:${b.business.phone}`} className={secondaryButton}>Trucar al negoci</a>}
        <Link href={`/r/${b.business.slug}`} className={secondaryButton}>{cancelled ? "Reservar una altra hora" : "Fer una altra reserva"}</Link>
        {!cancelled && !past && (
          confirming ? (
            <button onClick={cancel} className="flex h-12 items-center justify-center rounded-2xl bg-bad text-[15px] font-semibold text-white">Sí, anul·lar la reserva</button>
          ) : (
            <button onClick={() => setConfirming(true)} className="h-12 text-[15px] font-semibold text-bad">Anul·lar la reserva</button>
          )
        )}
        {error && <p className="text-center text-sm text-bad">{error}</p>}
      </div>
    </main>
  );
}
