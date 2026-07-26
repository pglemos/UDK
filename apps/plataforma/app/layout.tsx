import type { Metadata, Viewport } from "next";
import { PwaRegister } from "../components/pwa-register";
import "./globals.css";
import "./race.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://udkkart.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UDK • Ultras do Kart",
    template: "%s • UDK",
  },
  description: "Portal e plataforma oficial do campeonato Ultras do Kart.",
  applicationName: "UDK",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/icons/udk-avatar-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/udk-avatar-512.png", sizes: "512x512", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Ultras do Kart",
    title: "UDK • Ultras do Kart",
    description: "Calendário, classificação, resultados, pilotos e inscrições da temporada UDK.",
    images: [{ url: "/media/udk-race-hero.webp", width: 713, height: 560, alt: "Ultras do Kart" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UDK",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090C",
  colorScheme: "dark",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
