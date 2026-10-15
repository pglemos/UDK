import { Anybody, Geist, JetBrains_Mono } from "next/font/google";
import "./results-report.css";

// Mesmas fontes do relatório oficial da P1 Academy (/campeonatos): títulos, texto e números tabulares.
const headline = Anybody({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["700", "800", "900"],
  display: "swap",
});

const body = Geist({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "700", "800"],
  display: "swap",
});

export default function ResultadosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`udkr-fonts ${headline.variable} ${body.variable} ${mono.variable}`}>{children}</div>
  );
}
