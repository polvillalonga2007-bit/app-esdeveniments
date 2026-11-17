import { NextResponse } from "next/server";
import { getQuotes } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  const { quotes, eurUsd } = await getQuotes();
  return NextResponse.json({ quotes, eurUsd }, { headers: { "Cache-Control": "no-store" } });
}
