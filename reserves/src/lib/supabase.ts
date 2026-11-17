import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false } },
);

export type Service = { id: string; name: string; duration_min: number; price_cents: number | null; active?: boolean };
export type Hour = { weekday: number; opens: string; closes: string };
export type Booking = {
  id: string;
  service_name: string;
  starts_at: string;
  ends_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  note: string | null;
  status: "confirmada" | "cancelada";
  cancelled_by: "negoci" | "client" | null;
};
export type Business = {
  slug: string;
  name: string;
  email?: string;
  phone: string | null;
  address: string | null;
  description: string | null;
  capacity?: number;
  slot_step?: number;
};
export type Dashboard = { business: Business; services: Service[]; hours: Hour[]; bookings: Booking[] };
export type PublicBusiness = Business & { services: Service[]; hours: Hour[] };

const messages: Record<string, string> = {
  SESSIO_INVALIDA: "La sessió ha caducat. Torna a entrar.",
  CONTRASENYA_CURTA: "La contrasenya ha de tenir almenys 6 caràcters.",
  EMAIL_JA_EXISTEIX: "Ja hi ha un negoci amb aquest correu. Prova d'entrar.",
  LOGIN_INCORRECTE: "Correu o contrasenya incorrectes.",
  HORA_OCUPADA: "Aquesta hora s'acaba d'ocupar. Tria'n una altra.",
  NO_TROBAT: "No s'ha trobat.",
};

export function errorText(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? "";
  for (const key of Object.keys(messages)) if (msg.includes(key)) return messages[key];
  return "Alguna cosa no ha anat bé. Torna-ho a provar.";
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data as T;
}
