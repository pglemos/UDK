import Image from "next/image";
import { premiumVisuals } from "../../lib/visual-assets";

export function HomeHeroMediaLayer() {
  return (
    <div className="cinema-home-hero-media official-home-hero-media">
      <Image
        className="official-home-hero-poster"
        src={premiumVisuals.opening.src}
        alt={premiumVisuals.opening.alt}
        fill
        preload
        quality={86}
        sizes="(max-width: 760px) calc(100vw - 56px), (max-width: 1100px) 56vw, 58vw"
      />
    </div>
  );
}
