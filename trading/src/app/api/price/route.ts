import { NextRequest, NextResponse } from "next/server";
import { getFreshQuote } from "@/lib/market";

export const dynamic = "force-dynamic";

// Preu fresc d'un actiu, just abans de comprar o vendre
export async function GET(req: NextRequest) {
  const q = await getFreshQuote(req.nextUrl.searchParams.get("symbol") ?? "");
  if (!q) return NextResponse.json({ error: "PREU_NO_DISPONIBLE" }, { status: 502 });
  return NextResponse.json({ quote: q }, { headers: { "Cache-Control": "no-store" } });
}
