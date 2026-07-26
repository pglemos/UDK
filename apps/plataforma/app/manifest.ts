import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UDK • Ultras do Kart",
    short_name: "UDK",
    description: "Portal e plataforma oficial do campeonato Ultras do Kart.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090C",
    theme_color: "#08090C",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/udk-avatar-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    shortcuts: [
      {
        name: "Classificação UDK",
        short_name: "Classificação",
        description: "Consultar a classificação oficial.",
        url: "/classificacao",
        icons: [{ src: "/icons/udk-avatar-512.png", sizes: "512x512" }],
      },
      {
        name: "Calendário UDK",
        short_name: "Calendário",
        description: "Consultar as próximas etapas.",
        url: "/calendario",
        icons: [{ src: "/icons/udk-avatar-512.png", sizes: "512x512" }],
      },
      {
        name: "Plataforma UDK",
        short_name: "Entrar",
        description: "Acessar a plataforma oficial.",
        url: "/login",
        icons: [{ src: "/icons/udk-avatar-512.png", sizes: "512x512" }],
      },
    ],
  };
}
