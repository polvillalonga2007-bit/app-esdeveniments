import { NextRequest, NextResponse } from "next/server";
import { getChart } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const range = req.nextUrl.searchParams.get("range") ?? "1d";
  const points = await getChart(symbol, range);
  if (!points) return NextResponse.json({ error: "NO_DISPONIBLE" }, { status: 502 });
  return NextResponse.json({ points });
}
