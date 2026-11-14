"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, ErrorBox, Field, Loading, SectionTitle, inputClass, primaryButton } from "@/components/ui";
import { formatDayLong, formatDuration, formatPrice, formatTime, nextDays } from "@/lib/format";
import { errorText, rpc, type PublicBusiness, type Service } from "@/lib/supabase";

const CUSTOMER_KEY = "torn:client";

export default function BookPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [biz, setBiz] = useState<PublicBusiness | null | undefined>(undefined);
  const [service, setService] = useState<Service | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dayRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rpc<PublicBusiness | null>("rs_public_business", { p_slug: slug }).then(setBiz).catch(() => setBiz(null));
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "null");
      if (saved) setForm((f) => ({ ...f, ...saved }));
    } catch {}
  }, [slug]);

  const days = useMemo(() => nextDays(28), []);
  const openDays = useMemo(() => new Set(biz?.hours.map((h) => h.weekday) ?? []), [biz]);

  useEffect(() => {
    if (!service || !day) return;
    setSlots(null);
    setSlot(null);
    rpc<string[]>("rs_slots", { p_slug: slug, p_service_id: service.id, p_date: day })
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [service, day, slug]);

  const scrollTo = (r: React.RefObject<HTMLDivElement | null>) =>
    setTimeout(() => r.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !slot) return;
    setBusy(true);
    setError("");
    try {
      const r = await rpc<{ token: string }>("rs_book", {
        p_slug: slug, p_service_id: service.id, p_starts_at: slot,
        p_name: form.name, p_phone: form.phone, p_email: form.email, p_note: form.note,
      });
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: form.name, phone: form.phone, email: form.email }));
      } catch {}
      router.push(`/reserva/${r.token}?nova=1`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
      if (day) rpc<string[]>("rs_slots", { p_slug: slug, p_service_id: service.id, p_date: day }).then(setSlots).catch(() => {});
    }
  }

  if (biz === undefined) return <Loading />;
  if (biz === null)
    return (
      <main className="p-8 text-center">
        <p className="font-semibold">Aquest negoci no existeix</p>
        <p className="mt-1 text-muted">Revisa l&apos;enllaç que t&apos;han passat.</p>
      </main>
    );

  return (
    <main className="pb-16">
      <header className="bg-brand px-5 pb-7 pt-10 text-white">
        <p className="text-sm font-medium text-white/75">Reserva hora a</p>
        <h1 className="mt-1 font-display text-[30px] font-bold leading-tight tracking-tight">{biz.name}</h1>
        {biz.description && <p className="mt-2 text-[15px] leading-relaxed text-white/90">{biz.description}</p>}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
          {biz.address && <span>{biz.address}</span>}
          {biz.phone && <a href={`tel:${biz.phone}`} className="underline">{biz.phone}</a>}
        </div>
      </header>

      <div className="flex flex-col gap-8 px-5 pt-6">
        <section className="flex flex-col gap-2.5">
          <SectionTitle>1. Què vols fer?</SectionTitle>
          {biz.services.length === 0 && <p className="text-muted">Aquest negoci encara no ha afegit serveis.</p>}
          {biz.services.map((s) => {
            const sel = service?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setService(s);
                  if (!day) scrollTo(dayRef);
                }}
                className={`flex items-center justify-between rounded-2xl border bg-white p-4 text-left ${sel ? "border-brand ring-2 ring-brand/25" : "border-line"}`}
              >
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-muted">{formatDuration(s.duration_min)}</p>
                </div>
                {s.price_cents != null && <span className="font-semibold">{formatPrice(s.price_cents)}</span>}
              </button>
            );
          })}
        </section>

        {service && (
          <section ref={dayRef} className="flex scroll-mt-4 flex-col gap-2.5">
            <SectionTitle>2. Quin dia?</SectionTitle>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {days.map((d) => {
                const closed = !openDays.has(d.weekday);
                const sel = day === d.key;
                return (
                  <button
                    key={d.key}
                    disabled={closed}
                    onClick={() => {
                      setDay(d.key);
                      scrollTo(slotRef);
                    }}
                    className={`flex w-[58px] shrink-0 flex-col items-center rounded-2xl border py-2.5 ${
                      sel ? "border-brand bg-brand text-white" : closed ? "border-transparent bg-black/[0.03] text-muted/50" : "border-line bg-white"
                    }`}
                  >
                    <span className="text-xs font-medium uppercase">{d.short}</span>
                    <span className="text-xl font-bold tabular-nums">{d.day}</span>
                    <span className={`text-[11px] ${sel ? "text-white/80" : "text-muted"}`}>{d.month}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {service && day && (
          <section ref={slotRef} className="flex scroll-mt-4 flex-col gap-2.5">
            <SectionTitle>3. A quina hora?</SectionTitle>
            {slots === null && <p className="text-muted">Buscant hores lliures…</p>}
            {slots?.length === 0 && (
              <Card className="text-center text-[15px] text-muted">No queden hores lliures aquest dia. Prova un altre dia.</Card>
            )}
            {slots && slots.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSlot(t);
                      scrollTo(formRef);
                    }}
                    className={`h-11 rounded-xl border text-[15px] font-semibold tabular-nums ${slot === t ? "border-brand bg-brand text-white" : "border-line bg-white"}`}
                  >
                    {formatTime(t)}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {service && slot && (
          <section ref={formRef} className="flex scroll-mt-4 flex-col gap-3">
            <SectionTitle>4. Les teves dades</SectionTitle>
            <Card className="bg-brand-soft/50">
              <p className="font-semibold">{service.name}</p>
              <p className="text-[15px] text-ink/80">{formatDayLong(slot)} a les {formatTime(slot)}</p>
            </Card>
            <form onSubmit={book} className="flex flex-col gap-3.5">
              <Field label="Nom i cognom">
                <input required maxLength={80} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Telèfon" hint="Només el veurà el negoci, per si ha de contactar-te.">
                <input required type="tel" minLength={6} maxLength={30} autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Correu electrònic (opcional)">
                <input type="email" maxLength={120} autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Comentari (opcional)">
                <input maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputClass} placeholder="Ex.: tinc els cabells molt llargs" />
              </Field>
              <ErrorBox>{error}</ErrorBox>
              <button disabled={busy} className={`${primaryButton} mt-1`}>{busy ? "Reservant…" : "Confirmar reserva"}</button>
            </form>
          </section>
        )}
      </div>

      <p className="pt-12 text-center text-xs text-muted">
        Reserves amb <Link href="/" className="font-semibold">Torn</Link>
      </p>
    </main>
  );
}
