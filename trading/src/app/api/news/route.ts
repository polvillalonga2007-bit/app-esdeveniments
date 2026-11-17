import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || undefined;
  const items = await getNews(symbol);
  if (!items) return NextResponse.json({ error: "NO_DISPONIBLE" }, { status: 502 });
  return NextResponse.json({ items });
}
