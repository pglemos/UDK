import type { Metadata, Viewport } from "next";
import { PwaRegister } from "../components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Plataforma UDK",
    template: "%s • Plataforma UDK",
  },
  description: "Operação oficial do campeonato Ultras do Kart.",
  applicationName: "UDK",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UDK",
  },
};

export const viewport: Viewport = {
  themeColor: "#DAFC08",
  colorScheme: "light",
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
