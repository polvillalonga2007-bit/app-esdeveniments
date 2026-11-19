export type AssetType = "cripto" | "eua" | "espanya" | "fons";

export type Asset = {
  symbol: string; // identificador intern (el de Yahoo Finance)
  name: string;
  type: AssetType;
  currency: "EUR" | "USD";
  coingecko?: string; // per si Yahoo falla (només cripto)
};

export const ASSETS: Asset[] = [
  { symbol: "BTC-EUR", name: "Bitcoin", type: "cripto", currency: "EUR", coingecko: "bitcoin" },
  { symbol: "ETH-EUR", name: "Ethereum", type: "cripto", currency: "EUR", coingecko: "ethereum" },
  { symbol: "SOL-EUR", name: "Solana", type: "cripto", currency: "EUR", coingecko: "solana" },
  { symbol: "XRP-EUR", name: "XRP", type: "cripto", currency: "EUR", coingecko: "ripple" },
  { symbol: "DOGE-EUR", name: "Dogecoin", type: "cripto", currency: "EUR", coingecko: "dogecoin" },
  { symbol: "ADA-EUR", name: "Cardano", type: "cripto", currency: "EUR", coingecko: "cardano" },
  { symbol: "AAPL", name: "Apple", type: "eua", currency: "USD" },
  { symbol: "MSFT", name: "Microsoft", type: "eua", currency: "USD" },
  { symbol: "NVDA", name: "Nvidia", type: "eua", currency: "USD" },
  { symbol: "ANT", name: "Anthropic", type: "eua", currency: "USD" }, // cotitza al Nasdaq des del 19-11-2026
  { symbol: "TSLA", name: "Tesla", type: "eua", currency: "USD" },
  { symbol: "AMZN", name: "Amazon", type: "eua", currency: "USD" },
  { symbol: "GOOGL", name: "Google (Alphabet)", type: "eua", currency: "USD" },
  { symbol: "META", name: "Meta (Facebook)", type: "eua", currency: "USD" },
  { symbol: "NFLX", name: "Netflix", type: "eua", currency: "USD" },
  { symbol: "ITX.MC", name: "Inditex", type: "espanya", currency: "EUR" },
  { symbol: "SAN.MC", name: "Banco Santander", type: "espanya", currency: "EUR" },
  { symbol: "BBVA.MC", name: "BBVA", type: "espanya", currency: "EUR" },
  { symbol: "IBE.MC", name: "Iberdrola", type: "espanya", currency: "EUR" },
  { symbol: "TEF.MC", name: "Telefónica", type: "espanya", currency: "EUR" },
  { symbol: "SPY", name: "S&P 500 (les 500 grans dels EUA)", type: "fons", currency: "USD" },
  { symbol: "QQQ", name: "Nasdaq 100 (tecnològiques)", type: "fons", currency: "USD" },
];

export const TYPE_LABEL: Record<AssetType, string> = {
  cripto: "Criptomonedes",
  eua: "Accions dels EUA",
  espanya: "Accions d'Espanya",
  fons: "Fons indexats",
};

export const HOURS_LABEL: Record<AssetType, string> = {
  cripto: "Obert 24 hores, cada dia",
  eua: "Borsa de Nova York: de dilluns a divendres, de 15:30 a 22:00 (hora d'aquí)",
  espanya: "Borsa de Madrid: de dilluns a divendres, de 9:00 a 17:30. Preus amb uns 15 minuts de retard",
  fons: "Borsa de Nova York: de dilluns a divendres, de 15:30 a 22:00 (hora d'aquí)",
};

export function findAsset(symbol: string): Asset | undefined {
  return ASSETS.find((a) => a.symbol === symbol);
}

export function shortTicker(symbol: string): string {
  return symbol.replace("-EUR", "").replace(".MC", "");
}
