"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { homeHeroMedia } from "../../lib/visual-assets";

export function HomeHeroMediaLayer() {
  const [allowVideo, setAllowVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    <>
      <div
        className="cinema-home-hero-media official-home-hero-media"
        aria-hidden="true"
        data-video-state={videoState}
      >
        <picture>
          <source media="(max-width: 767px)" srcSet={homeHeroMedia.mobile} type="image/webp" />
          {/* The responsive picture prevents both priority posters from downloading. */}
          <img
            className="official-home-hero-poster"
            src={homeHeroMedia.poster}
            alt=""
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        {allowVideo && !videoFailed ? (
          <video
            ref={videoRef}
            className={`official-home-hero-video${videoReady ? " is-ready" : ""}`}
            src={homeHeroMedia.video}
            poster={homeHeroMedia.poster}
            autoPlay={!videoPaused}
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
      {allowVideo && videoReady && !videoFailed ? (
        <button
          className="cinema-video-control"
          type="button"
          aria-label={videoPaused ? "Reproduzir vídeo da corrida" : "Pausar vídeo da corrida"}
          onClick={async () => {
            const video = videoRef.current;
            if (!video) return;
            if (videoPaused) {
              try {
                await video.play();
                setVideoPaused(false);
              } catch {
                setVideoFailed(true);
              }
            } else {
              video.pause();
              setVideoPaused(true);
            }
          }}
        >
          {videoPaused ? (
            <Play aria-hidden="true" size={16} />
          ) : (
            <Pause aria-hidden="true" size={16} />
          )}
          <span>{videoPaused ? "Reproduzir" : "Pausar vídeo"}</span>
        </button>
      ) : null}
    </>
  );
}
