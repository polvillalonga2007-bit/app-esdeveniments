"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo, primaryButton, secondaryButton } from "@/components/ui";
import { session } from "@/lib/session";

const points = [
  { t: "Reserven sense trucar", d: "Els teus clients trien servei i hora des del mòbil, a qualsevol hora del dia." },
  { t: "Mai dues persones a la mateixa hora", d: "Només es mostren les hores lliures segons el teu horari i la durada de cada servei." },
  { t: "Tot a la teva agenda", d: "Veus les reserves del dia amb el nom i el telèfon del client, i pots anul·lar-les." },
  { t: "Un enllaç per compartir", d: "Posa'l a Instagram, Google Maps, WhatsApp o a la teva web." },
];

export default function Home() {
  const [logged, setLogged] = useState(false);
  useEffect(() => setLogged(!!session.get()), []);

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-10 pt-8">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href={logged ? "/panell" : "/entrar"} className="rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">
          {logged ? "El meu panell" : "Entrar"}
        </Link>
      </header>

      <section className="pt-12">
        <h1 className="font-display text-[38px] font-bold leading-[1.08] tracking-tight">
          Que et demanin hora <span className="text-brand">sense trucar-te</span>.
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          Reserves online per a perruqueries, fisios, estètica i qualsevol negoci que treballa amb cita prèvia.
        </p>
      </section>

      <ul className="mt-9 flex flex-col gap-5">
        {points.map((p) => (
          <li key={p.t} className="flex gap-3.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <div>
              <p className="font-semibold">{p.t}</p>
              <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{p.d}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-3 pt-10">
        <Link href={logged ? "/panell" : "/registre"} className={primaryButton}>
          {logged ? "Anar al meu panell" : "Crea el teu negoci gratis"}
        </Link>
        {!logged && (
          <Link href="/entrar" className={secondaryButton}>
            Ja tinc compte
          </Link>
        )}
      </div>
    </main>
  );
}
