"use client";

import { useEffect, useRef } from "react";

export function HomeOpeningVideo() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void video.current?.play().catch(() => {});
    }
  }, []);

  return (
    <section className="udk-opening-video" aria-label="Vídeo de abertura Ultras do Kart">
      <video
        ref={video}
        src="/media/official/home/ultras-opening.mp4"
        poster="/media/official/home/ultras-opening.webp"
        width={2048}
        height={512}
        muted
        playsInline
        loop
        controls
        preload="metadata"
        aria-label="Filme oficial Ultras do Kart"
      >
        Seu navegador não suporta vídeo.
      </video>
      <a href="#apresentacao" className="udk-opening-skip">
        Pular vídeo
      </a>
    </section>
  );
}
