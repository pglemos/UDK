import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UDK • Operação Oficial",
    short_name: "UDK",
    description: "Operação esportiva, administrativa e disciplinar do campeonato Ultras do Kart.",
    start_url: "/painel",
    display: "standalone",
    background_color: "#1C191F",
    theme_color: "#DAFC08",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/udk.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
