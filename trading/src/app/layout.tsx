import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TradeLab · Simulador de borsa",
  appleWebApp: { capable: true, title: "TradeLab", statusBarStyle: "default" },
  description: "Aprèn a invertir amb 10.000 € ficticis i preus reals de borsa i cripto.",
};

export const viewport: Viewport = { themeColor: "#4338ca" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ca">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="mx-auto min-h-dvh max-w-md">{children}</div>
      </body>
    </html>
  );
}
