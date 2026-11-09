import type { Metadata } from "next";
import { formatWhen } from "@/lib/format";
import { supabase } from "@/lib/supabase";

// Títol i descripció que surten a la previsualització de l'enllaç al WhatsApp
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase.rpc("get_event", { p_slug: slug });
  if (!data) return { title: "Quedem" };
  const desc = `${formatWhen(data.starts_at)}${data.location ? ` · ${data.location}` : ""}. Digues si hi vens!`;
  return {
    title: `${data.title} · Quedem`,
    description: desc,
    openGraph: { title: data.title, description: desc },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
