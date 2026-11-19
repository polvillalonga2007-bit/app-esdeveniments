import "server-only";
import { findAsset } from "./assets";

export type NewsItem = { title: string; link: string; source: string; date: string };

const GENERAL = '(bolsa OR "Wall Street" OR "Ibex 35" OR Nasdaq OR "Reserva Federal" OR BCE OR bitcoin OR mercados)';

// Paraules de cerca per a cada actiu (en castellà, perquè hi ha més notícies)
const QUERY: Record<string, string> = {
  "BTC-EUR": "bitcoin",
  "ETH-EUR": "ethereum",
  "SOL-EUR": "solana criptomoneda",
  "XRP-EUR": "XRP Ripple",
  "DOGE-EUR": "dogecoin",
  "ADA-EUR": "cardano criptomoneda",
  GOOGL: "Google Alphabet",
  META: "Meta Zuckerberg",
  SPY: '"S&P 500"',
  QQQ: '"Nasdaq 100"',
};

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function tag(item: string, name: string): string {
  const m = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
}

export async function getNews(symbol?: string): Promise<NewsItem[] | null> {
  let q = GENERAL;
  if (symbol) {
    const a = findAsset(symbol);
    if (!a) return null;
    q = QUERY[symbol] ?? `"${a.name}"`;
  }
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:7d`)}&hl=es&gl=ES&ceid=ES:es`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } });
    if (!res.ok) return null;
    const xml = await res.text();
    const items = xml.split("<item>").slice(1).map((it) => {
      const source = tag(it, "source");
      let title = tag(it, "title");
      if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
      return { title, link: tag(it, "link"), source, date: new Date(tag(it, "pubDate")).toISOString() };
    });
    const seen = new Set<string>();
    return items
      .filter((i) => i.title && i.link && !seen.has(i.title) && seen.add(i.title))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 40);
  } catch {
    return null;
  }
}
