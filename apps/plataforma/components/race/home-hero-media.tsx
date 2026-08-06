"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { homeHeroMedia } from "../../lib/visual-assets";

export function HomeHeroMediaLayer() {
  const [allowVideo, setAllowVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrowViewport = window.matchMedia("(max-width: 767px)");

    const updatePlaybackEligibility = () => {
      setAllowVideo(!reducedMotion.matches && !narrowViewport.matches);
    };

    updatePlaybackEligibility();
    reducedMotion.addEventListener("change", updatePlaybackEligibility);
    narrowViewport.addEventListener("change", updatePlaybackEligibility);

    return () => {
      reducedMotion.removeEventListener("change", updatePlaybackEligibility);
      narrowViewport.removeEventListener("change", updatePlaybackEligibility);
    };
  }, []);

  const videoState = videoFailed
    ? "failed"
    : videoReady
      ? "ready"
      : allowVideo
        ? "loading"
        : "poster";

  return (
    <div
      className="cinema-home-hero-media official-home-hero-media"
      aria-hidden="true"
      data-video-state={videoState}
    >
      <Image
        className="official-home-hero-poster official-home-hero-poster-desktop"
        src={homeHeroMedia.poster}
        alt=""
        fill
        priority
        quality={88}
        sizes="100vw"
      />
      <Image
        className="official-home-hero-poster official-home-hero-poster-mobile"
        src={homeHeroMedia.mobile}
        alt=""
        fill
        priority
        quality={88}
        sizes="100vw"
      />
      {allowVideo && !videoFailed ? (
        <video
          className={`official-home-hero-video${videoReady ? " is-ready" : ""}`}
          src={homeHeroMedia.video}
          poster={homeHeroMedia.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
        />
      ) : null}
    </div>
  );
}
