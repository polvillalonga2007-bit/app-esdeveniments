import type { Metadata } from "next";
import { fontVars } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vora Digital · Webs per a negocis",
  description: "Eina interna de Vora Digital per crear webs per a negocis locals.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Vora", statusBarStyle: "default" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ca" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
