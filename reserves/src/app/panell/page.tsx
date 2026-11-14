"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card, Loading, Logo } from "@/components/ui";
import { Agenda } from "./agenda";
import { Services } from "./services";
import { HoursEditor } from "./hours";
import { Settings } from "./settings";
import { ShareCard } from "./share";
import { errorText, rpc, type Dashboard } from "@/lib/supabase";
import { session } from "@/lib/session";

const tabs = [
  { id: "agenda", label: "Agenda" },
  { id: "serveis", label: "Serveis" },
  { id: "horari", label: "Horari" },
  { id: "negoci", label: "Negoci" },
] as const;
type Tab = (typeof tabs)[number]["id"];

export default function Panel() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>("agenda");
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (t: string) => {
    try {
      setData(await rpc<Dashboard>("rs_dashboard", { p_token: t }));
    } catch (e) {
      const msg = errorText(e);
      if (msg.includes("sessió")) {
        session.clear();
        router.replace("/entrar");
      } else setError(msg);
    }
  }, [router]);

  useEffect(() => {
    const t = session.get();
    if (!t) {
      router.replace("/entrar");
      return;
    }
    setToken(t);
    if (new URLSearchParams(window.location.search).get("nou")) {
      setIsNew(true);
      setTab("serveis");
    }
    load(t);
  }, [load, router]);

  if (error) return <p className="p-8 text-center text-bad">{error}</p>;
  if (!data || !token) return <Loading />;

  const reload = () => load(token);

  return (
    <main className="pb-16">
      <header className="flex items-center justify-between px-5 pt-6">
        <Logo />
        <span className="max-w-[55%] truncate text-sm font-medium text-muted">{data.business.name}</span>
      </header>

      <div className="px-5 pt-5">
        {isNew && (
          <Card className="mb-4 border-brand/30 bg-brand-soft/60">
            <p className="font-semibold">Benvingut! Tres passos i ja està:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px] text-ink/80">
              <li className={data.services.length ? "line-through opacity-60" : ""}>Afegeix els teus serveis (tall, massatge…)</li>
              <li>Revisa l&apos;horari a la pestanya Horari</li>
              <li>Comparteix el teu enllaç amb els clients</li>
            </ol>
          </Card>
        )}
        <ShareCard slug={data.business.slug} />
      </div>

      <nav className="sticky top-0 z-10 mt-5 border-b border-line bg-ground/95 px-3 backdrop-blur">
        <div className="flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 border-b-2 py-3 text-[15px] font-semibold ${tab === t.id ? "border-brand text-brand" : "border-transparent text-muted"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="px-5 pt-5">
        {tab === "agenda" && <Agenda token={token} bookings={data.bookings} onChange={reload} />}
        {tab === "serveis" && <Services token={token} services={data.services} onChange={reload} />}
        {tab === "horari" && <HoursEditor token={token} hours={data.hours} onChange={reload} />}
        {tab === "negoci" && <Settings token={token} business={data.business} onChange={reload} />}
      </div>
    </main>
  );
}
