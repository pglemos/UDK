import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UDK • Ultras do Kart",
    short_name: "UDK",
    description: "Portal e operação oficial do campeonato Ultras do Kart.",
    start_url: "/",
    display: "standalone",
    background_color: "#1C191F",
    theme_color: "#DAFC08",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/udk.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Painel UDK",
        short_name: "Painel",
        description: "Abrir a operação autenticada.",
        url: "/painel",
      },
      {
        name: "Classificação",
        short_name: "Classificação",
        description: "Consultar a classificação pública.",
        url: "/classificacao",
      },
    ],
  };
}
