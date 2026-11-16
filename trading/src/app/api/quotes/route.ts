import { NextResponse } from "next/server";
import { getQuotes } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  const quotes = await getQuotes();
  return NextResponse.json({ quotes }, { headers: { "Cache-Control": "no-store" } });
}
