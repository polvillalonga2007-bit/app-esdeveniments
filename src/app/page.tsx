"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { formatWhen } from "@/lib/format";
import { local, type MyEvent } from "@/lib/local";

export default function Home() {
  const [events, setEvents] = useState<MyEvent[] | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    setEvents(local.myEvents());
    setName(local.name());
  }, []);

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="px-5 pb-4 pt-14">
        <p className="text-[15px] text-muted">{name ? `Hola, ${name}` : "Hola!"}</p>
        <h1 className="font-display text-[30px] font-bold tracking-tight">Els teus esdeveniments</h1>
      </header>

      <section className="flex flex-1 flex-col gap-3.5 px-5">
        {events?.length === 0 && (
          <Card className="border border-dashed border-line text-center">
            <p className="font-semibold">Encara no has organitzat res</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Crea un esdeveniment, envia l&apos;enllaç pel WhatsApp i oblida&apos;t del grup.
            </p>
          </Card>
        )}
        {events?.map((e) => (
          <Link key={e.slug} href={`/gestio/${e.admin_token}`} className="block">
            <Card className="flex flex-col gap-1">
              <span className="text-[17px] font-semibold">{e.title}</span>
              <span className="text-sm text-muted">{formatWhen(e.starts_at)}</span>
            </Card>
          </Link>
        ))}
      </section>

      <div className="px-5 pb-9 pt-4">
        <Link href="/nou" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-ink text-base font-semibold text-white hover:bg-black">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Crear esdeveniment
        </Link>
      </div>
    </main>
  );
}
