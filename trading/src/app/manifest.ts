import type { MetadataRoute } from "next";

// Fa que l'app es pugui afegir a la pantalla d'inici del mòbil amb la seva icona i a pantalla completa.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TradeLab",
    short_name: "TradeLab",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#4338ca",
    lang: "ca",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
