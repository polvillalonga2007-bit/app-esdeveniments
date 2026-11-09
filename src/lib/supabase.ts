import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false } },
);

export type Status = "si" | "potser" | "no";

export type EventData = {
  slug: string;
  title: string;
  starts_at: string;
  location: string | null;
  description: string | null;
  organizer_name: string;
  surprise: boolean;
  reminder: boolean;
  counts: { si: number; potser: number; no: number; persones: number };
  announcements: { id: string; body: string; created_at: string }[];
  tasks: { id: string; title: string; assignee: string | null }[];
  me?: { name: string; status: Status; companions: number } | null;
  guests?: { name: string; status: Status; companions: number }[];
};
