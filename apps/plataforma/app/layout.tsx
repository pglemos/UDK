import type { Metadata, Viewport } from "next";
import { Manrope, Syne } from "next/font/google";
import { PwaRegister } from "../components/pwa-register";
import { premiumVisuals } from "../lib/visual-assets";
import "./globals.css";
import "./race.css";

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

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
    images: [
      {
        url: premiumVisuals.hero.src,
        width: 2400,
        height: 1600,
        alt: premiumVisuals.hero.alt,
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UDK",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090b",
  colorScheme: "dark",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${body.variable}`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
