import type { Metadata } from "next";
import { supabase, type PublicBusiness } from "@/lib/supabase";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase.rpc("rs_public_business", { p_slug: slug });
  const b = data as PublicBusiness | null;
  if (!b) return { title: "Reserva hora" };
  return {
    title: `Reserva hora · ${b.name}`,
    description: b.description ?? `Reserva hora a ${b.name} en un minut, sense trucar.`,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
