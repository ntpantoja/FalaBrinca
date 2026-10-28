import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "FalaBrinca • Uma aventura de palavras",
  description:
    "Brincadeiras educativas de linguagem para crianças de 3 a 5 anos, com acompanhamento de um adulto.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "FalaBrinca" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#226749",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
