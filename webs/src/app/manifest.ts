import type { MetadataRoute } from "next";

// Fa que l'app es pugui afegir a la pantalla d'inici del mòbil amb la seva icona i a pantalla completa.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vora Digital",
    short_name: "Vora",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1ea",
    theme_color: "#161513",
    lang: "ca",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
