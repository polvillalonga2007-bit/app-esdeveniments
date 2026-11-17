import { NextRequest, NextResponse } from "next/server";
import { getCandles } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const tf = req.nextUrl.searchParams.get("tf") ?? "5m";
  const candles = await getCandles(symbol, tf);
  if (!candles) return NextResponse.json({ error: "NO_DISPONIBLE" }, { status: 502 });
  return NextResponse.json({ candles });
}
