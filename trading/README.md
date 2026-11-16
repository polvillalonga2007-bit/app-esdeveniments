# Parquet · Simulador de trading

Simulador de borsa amb **10.000 € ficticis** i preus reals (accions dels EUA i d'Espanya, fons indexats i criptomonedes).

- `src/lib/assets.ts`: llista d'actius que es poden comprar.
- `src/lib/market.ts`: obté els preus de Yahoo Finance (i CoinGecko de reserva per a cripto), els passa a euros i diu si el mercat és obert.
- `src/lib/store.ts`: la cartera, les compres i vendes i el diari. Ara es guarda al navegador (localStorage).
- `supabase/migrations/0001_trading.sql`: versió amb base de dades (taules `tr_*`), preparada però **encara no aplicada**. Servirà per a comptes i rànquings entre amics.

Desplegament: projecte Vercel `parquet-trading`, carpeta arrel `trading`.
