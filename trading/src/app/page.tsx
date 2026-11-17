"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Disclaimer, ErrorBox, Field, Logo, inputClass, primaryButton } from "@/components/ui";
import { loadState, newState, saveState } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loadState()) router.replace("/cartera");
  }, [router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (nick.trim().length < 2) return setError("Escriu un nom d'almenys 2 lletres.");
    if (!saveState(newState(nick))) return setError("El teu navegador no deixa guardar dades. Prova de sortir de la navegació privada.");
    router.replace("/cartera");
  }

  return (
    <main className="flex flex-col gap-6 px-4 pb-6 pt-8">
      <Logo />
      <div className="flex flex-col gap-3">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">Aprèn a invertir sense jugar-te ni un euro</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Comences amb <strong className="text-ink">10.000 € ficticis</strong> i compres i vens accions i criptomonedes amb els
          preus reals del mercat. Apunta per què fas cada operació i mira, amb números, si t&apos;ha sortit bé.
        </p>
      </div>

      <ul className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
        {[
          ["📈", "Preus reals"],
          ["📒", "Diari d'operacions"],
          ["🎯", "Estadístiques"],
        ].map(([i, t]) => (
          <li key={t} className="rounded-2xl border border-line bg-white px-2 py-3">
            <div className="text-xl" aria-hidden="true">{i}</div>
            {t}
          </li>
        ))}
      </ul>

      <Card className="flex flex-col gap-4">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Com et dius?" hint="La cartera es guarda en aquest dispositiu.">
            <input className={inputClass} value={nick} onChange={(e) => setNick(e.target.value)} autoComplete="nickname" required minLength={2} maxLength={24} placeholder="Ex: Pol" />
          </Field>
          <ErrorBox>{error}</ErrorBox>
          <button className={primaryButton}>Rebre els meus 10.000 €</button>
        </form>
      </Card>
      <Disclaimer />
    </main>
  );
}
