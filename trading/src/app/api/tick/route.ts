import { NextRequest, NextResponse } from "next/server";
import { getTick } from "@/lib/market";

export const dynamic = "force-dynamic";

// Últim preu per moure el gràfic en directe
export async function GET(req: NextRequest) {
  const t = await getTick(req.nextUrl.searchParams.get("symbol") ?? "");
  if (!t) return NextResponse.json({ error: "PREU_NO_DISPONIBLE" }, { status: 502 });
  return NextResponse.json(t, { headers: { "Cache-Control": "no-store" } });
}
