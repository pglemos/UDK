# Official UDK Media Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic external racing imagery with optimized official UDK photos and video across all nine public routes, while preserving performance, accessibility, deterministic fallbacks, and the existing 18-screen visual audit.

**Architecture:** Official derivatives live under `apps/plataforma/public/media/official/` and are referenced only through `apps/plataforma/lib/visual-assets.ts`. A focused client component controls the Home hero video and leaves the poster visible when motion is reduced, the viewport is small, or playback fails. Existing shared hero, driver, stage, news, and podium components continue consuming deterministic catalog functions instead of route-specific media logic.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Vitest 3, Playwright/Chromium visual audit, FFmpeg for video derivatives, Pillow or equivalent offline image processing, Vercel deployment.

## Global Constraints

- Node.js must remain `>=22` and pnpm must remain `10.12.1`.
- Do not add runtime image-processing dependencies.
- Do not stream production assets from Google Drive.
- Do not alter Supabase tables, policies, authentication, functions, storage, or API contracts.
- Use WebP for image derivatives and H.264 MP4 for the single Home loop.
- Keep the Home video muted, looping, inline, poster-backed, and nonessential to understanding the page.
- Disable video playback for `prefers-reduced-motion: reduce` and narrow mobile viewports.
- Preserve deterministic `driverVisual`, `stageVisual`, `newsVisual`, and `pageHeroVisual` behavior.
- Generate and inspect all 9 desktop and 9 mobile screenshots before merge.
- Keep `diagnostics.json` generation and fail on invalid media dimensions, `pageerror`, `console.error`, request failure, or route capture failure.

---

## File Structure

**Create**

- `apps/plataforma/public/media/official/source-manifest.json`: provenance, source file, derivative dimensions, crop, and page purpose.
- `apps/plataforma/public/media/official/home/hero-desktop.webp`: Home poster for large screens.
- `apps/plataforma/public/media/official/home/hero-mobile.webp`: static Home visual for mobile and reduced motion.
- `apps/plataforma/public/media/official/home/hero-loop.mp4`: short muted Home loop.
- `apps/plataforma/public/media/official/heroes/{calendario,classificacao,resultados,pilotos,noticias,regulamento,inscricao,login}.webp`: route-specific hero artwork.
- `apps/plataforma/public/media/official/drivers/{dpto,flavio,fallback-01,fallback-02,fallback-03}.webp`: pilot portraits and real-photo fallbacks.
- `apps/plataforma/public/media/official/stages/stage-{01,02,03,04,05}.webp`: stage card fallbacks.
- `apps/plataforma/public/media/official/news/news-{01,02,03}.webp`: editorial fallbacks.
- `apps/plataforma/components/race/home-hero-media.tsx`: motion-aware video/poster renderer.
- `apps/plataforma/tests/official-media.test.ts`: source-level and filesystem regressions.

**Modify**

- `apps/plataforma/lib/visual-assets.ts`: replace external URLs with official local media and add Home video metadata.
- `apps/plataforma/app/page.tsx`: replace direct hero `<Image>` with `HomeHeroMedia`.
- `apps/plataforma/app/race.css`: import final official-media stylesheet.
- `apps/plataforma/app/official-media.css`: style the Home video layer and mobile/reduced-motion fallbacks.
- `.github/scripts/capture-visual-audit.mjs`: include video/poster diagnostics without weakening existing image checks.
- `apps/plataforma/tests/audit-round-three.test.ts`: retain previous audit guarantees and assert video/poster diagnostics.

---

### Task 1: Produce the curated official derivative set

**Files:**
- Create: `apps/plataforma/public/media/official/source-manifest.json`
- Create: all binary derivatives listed in **File Structure**

**Interfaces:**
- Consumes: Google Drive sources explicitly catalogued in the approved design, including `ULT-DPTO-Cover.jpg`, `ULT-FLAVIO-Cover.jpg`, `DSC00414-1.jpg`, `215A.mp4`, and selected UDK event footage.
- Produces: stable public paths beginning with `/media/official/` and a manifest entry for every derivative.

- [ ] **Step 1: Build a visual contact sheet for candidate stills and video frames**

Extract 6 evenly spaced frames from each shortlisted clip and render labelled contact sheets. Use commands equivalent to:

```bash
mkdir -p /tmp/udk-official-media/frames
ffmpeg -hide_banner -loglevel error -i SOURCE.mp4 \
  -vf "fps=1/2,scale=640:-2" \
  /tmp/udk-official-media/frames/SOURCE-%03d.jpg
```

Expected: contact sheets show enough context to judge subject position, motion blur, logos, and safe text areas.

- [ ] **Step 2: Select the minimum nonrepeating editorial set**

Record a selection table with these exact purposes: Home desktop, Home mobile, Calendário, Classificação, Resultados, Pilotos, Notícias, Regulamento, Inscrição, Login, three driver fallbacks, five stage fallbacks, and three news fallbacks.

Expected: no two adjacent page heroes use the same source frame, and no pilot identity is inferred from facial recognition.

- [ ] **Step 3: Generate WebP derivatives**

Process selected stills with crop and output constraints:

```python
from PIL import Image, ImageEnhance

image = Image.open(source).convert("RGB")
image = ImageEnhance.Contrast(image).enhance(1.04)
image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
image.save(destination, "WEBP", quality=86, method=6)
```

Create dedicated mobile crops at no more than 900 px wide. Never upscale a source.

Expected: every WebP opens successfully, preserves official colors, and is small enough for web delivery without obvious compression artifacts.

- [ ] **Step 4: Generate the Home loop**

```bash
ffmpeg -hide_banner -loglevel error -ss START -t 9 -i SOURCE.mp4 \
  -an -vf "scale=1920:-2:force_original_aspect_ratio=decrease,fps=24" \
  -c:v libx264 -profile:v high -level 4.1 -pix_fmt yuv420p \
  -movflags +faststart -crf 24 \
  apps/plataforma/public/media/official/home/hero-loop.mp4
```

Expected: duration is 6–12 seconds, no audio stream exists, dimensions do not exceed 1920×1080, and the loop is approximately 8 MB or smaller unless visual inspection proves a larger file necessary.

- [ ] **Step 5: Write the provenance manifest**

Use this schema for each item:

```json
{
  "path": "/media/official/heroes/resultados.webp",
  "source": "DSC00414-1.jpg",
  "purpose": "Resultados page hero",
  "width": 1920,
  "height": 1080,
  "crop": "center",
  "transform": "WebP quality 86, contrast +4%"
}
```

Expected: every committed derivative has exactly one manifest entry, and no Drive URL is used by production code.

- [ ] **Step 6: Commit the derivative set**

```bash
git add apps/plataforma/public/media/official
git commit -m "assets: add optimized official UDK media"
```

---

### Task 2: Lock the official media contract with failing tests

**Files:**
- Create: `apps/plataforma/tests/official-media.test.ts`
- Test: `apps/plataforma/tests/official-media.test.ts`

**Interfaces:**
- Consumes: derivative paths and manifest from Task 1.
- Produces: regression contract for local media, route diversity, Home video metadata, and deterministic fallbacks.

- [ ] **Step 1: Write the failing filesystem and catalog tests**

```ts
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

const requiredAssets = [
  "public/media/official/home/hero-desktop.webp",
  "public/media/official/home/hero-mobile.webp",
  "public/media/official/home/hero-loop.mp4",
  "public/media/official/heroes/calendario.webp",
  "public/media/official/heroes/classificacao.webp",
  "public/media/official/heroes/resultados.webp",
  "public/media/official/heroes/pilotos.webp",
  "public/media/official/heroes/noticias.webp",
  "public/media/official/heroes/regulamento.webp",
  "public/media/official/heroes/inscricao.webp",
  "public/media/official/heroes/login.webp",
];

describe("official UDK media", () => {
  it("ships every required derivative", () => {
    for (const asset of requiredAssets) {
      expect(fs.statSync(path.join(appRoot, asset)).size).toBeGreaterThan(1024);
    }
  });

  it("uses only local official media in the editorial catalog", () => {
    const catalog = read("lib/visual-assets.ts");
    expect(catalog).not.toContain("images.unsplash.com");
    expect(catalog).toContain('/media/official/home/hero-loop.mp4');
    expect(catalog).toContain('/media/official/heroes/resultados.webp');
  });

  it("keeps page heroes contextually distinct", () => {
    const catalog = read("lib/visual-assets.ts");
    const matches = [...catalog.matchAll(/src: "(\/media\/official\/heroes\/[^"]+)"/g)].map((match) => match[1]);
    expect(new Set(matches).size).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
pnpm --filter @udk/plataforma test -- tests/official-media.test.ts
```

Expected: FAIL because `visual-assets.ts` still contains Unsplash URLs and Home video metadata does not exist.

- [ ] **Step 3: Commit the RED test**

```bash
git add apps/plataforma/tests/official-media.test.ts
git commit -m "test: define official UDK media contract"
```

---

### Task 3: Replace the generic catalog with official local assets

**Files:**
- Modify: `apps/plataforma/lib/visual-assets.ts`
- Test: `apps/plataforma/tests/official-media.test.ts`

**Interfaces:**
- Consumes: public paths from Task 1.
- Produces: `premiumVisuals`, `homeHeroMedia`, `pageHeroVisual(index)`, `driverVisual(seed)`, `stageVisual(index)`, and `newsVisual(index)`.

- [ ] **Step 1: Add the Home media type and metadata**

```ts
export type HomeHeroMedia = {
  poster: string;
  mobile: string;
  video: string;
};

export const homeHeroMedia: HomeHeroMedia = {
  poster: "/media/official/home/hero-desktop.webp",
  mobile: "/media/official/home/hero-mobile.webp",
  video: "/media/official/home/hero-loop.mp4",
};
```

- [ ] **Step 2: Replace every external `PremiumVisual.src`**

Use local official paths, for example:

```ts
hero: {
  src: homeHeroMedia.poster,
  alt: "Karts do UDK disputando uma etapa no Kartódromo de Betim",
  position: "52% center",
},
```

Map page indices exactly:

```ts
const pageHeroVisuals: Record<string, PremiumVisual> = {
  "01": { src: "/media/official/heroes/calendario.webp", alt: "Grid do UDK antes de uma etapa", position: "50% center" },
  "02": { src: "/media/official/heroes/classificacao.webp", alt: "Disputa de posição durante uma prova do UDK", position: "52% center" },
  "03": { src: "/media/official/heroes/resultados.webp", alt: "Painel de cronometragem e resultados do UDK", position: "50% center" },
  "04": { src: "/media/official/heroes/pilotos.webp", alt: "Pilotos do UDK no paddock", position: "50% center" },
  "05": { src: "/media/official/heroes/noticias.webp", alt: "Bastidores de uma etapa do UDK", position: "50% center" },
  "06": { src: "/media/official/heroes/regulamento.webp", alt: "Briefing oficial antes da corrida", position: "50% center" },
  "07": { src: "/media/official/heroes/inscricao.webp", alt: "Preparação de piloto para entrar na pista", position: "50% center" },
};
```

- [ ] **Step 3: Replace fallback arrays with official derivatives**

Keep modulo-based deterministic selection and use only `/media/official/drivers/`, `/media/official/stages/`, and `/media/official/news/` paths.

- [ ] **Step 4: Run the catalog tests**

```bash
pnpm --filter @udk/plataforma test -- tests/official-media.test.ts
```

Expected: PASS for file existence, no Unsplash URLs, Home video metadata, and hero diversity.

- [ ] **Step 5: Run existing visual safeguard tests**

```bash
pnpm --filter @udk/plataforma test -- tests/audit-round-three.test.ts
```

Expected: PASS with the existing contextual hero and deterministic fallback guarantees intact.

- [ ] **Step 6: Commit the catalog migration**

```bash
git add apps/plataforma/lib/visual-assets.ts apps/plataforma/tests/official-media.test.ts
git commit -m "feat: use official UDK media catalog"
```

---

### Task 4: Add a motion-aware Home hero renderer

**Files:**
- Create: `apps/plataforma/components/race/home-hero-media.tsx`
- Modify: `apps/plataforma/app/page.tsx`
- Create: `apps/plataforma/app/official-media.css`
- Modify: `apps/plataforma/app/race.css`
- Test: `apps/plataforma/tests/official-media.test.ts`

**Interfaces:**
- Consumes: `homeHeroMedia: HomeHeroMedia` from Task 3.
- Produces: `HomeHeroMediaLayer(): JSX.Element`, preserving the existing `.cinema-home-hero-media` container contract.

- [ ] **Step 1: Extend the RED test for video behavior**

```ts
it("renders a poster-backed motion-aware Home hero", () => {
  const component = read("components/race/home-hero-media.tsx");
  expect(component).toContain('"use client"');
  expect(component).toContain("prefers-reduced-motion: reduce");
  expect(component).toContain("max-width: 767px");
  expect(component).toContain("poster={homeHeroMedia.poster}");
  expect(component).toContain("muted");
  expect(component).toContain("playsInline");
  expect(component).toContain("onError");
});
```

Run the targeted test and expect failure because the component does not exist.

- [ ] **Step 2: Implement the focused client component**

```tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { homeHeroMedia } from "../../lib/visual-assets";

export function HomeHeroMediaLayer() {
  const [allowVideo, setAllowVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrowViewport = window.matchMedia("(max-width: 767px)");
    const update = () => setAllowVideo(!reducedMotion.matches && !narrowViewport.matches);
    update();
    reducedMotion.addEventListener("change", update);
    narrowViewport.addEventListener("change", update);
    return () => {
      reducedMotion.removeEventListener("change", update);
      narrowViewport.removeEventListener("change", update);
    };
  }, []);

  return (
    <div className="cinema-home-hero-media" aria-hidden="true">
      <Image
        className="official-home-poster"
        src={allowVideo ? homeHeroMedia.poster : homeHeroMedia.mobile}
        alt=""
        fill
        priority
        quality={90}
        sizes="100vw"
      />
      {allowVideo && !videoFailed ? (
        <video
          className="official-home-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={homeHeroMedia.poster}
          onError={() => setVideoFailed(true)}
        >
          <source src={homeHeroMedia.video} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Replace the Home hero image usage**

In `apps/plataforma/app/page.tsx`:

```tsx
import { HomeHeroMediaLayer } from "../components/race/home-hero-media";
```

Replace the existing `cinema-home-hero-media` `<div>` with:

```tsx
<HomeHeroMediaLayer />
```

Remove only imports made unused by this replacement. Keep `Image` if lower Home sections still use it.

- [ ] **Step 4: Add final CSS after prior audit overrides**

Create `apps/plataforma/app/official-media.css`:

```css
.cinema-home-hero-media .official-home-poster,
.cinema-home-hero-media .official-home-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cinema-home-hero-media .official-home-video {
  z-index: 1;
}

.cinema-home-hero-media .official-home-poster {
  z-index: 0;
}

@media (prefers-reduced-motion: reduce), (max-width: 767px) {
  .cinema-home-hero-media .official-home-video {
    display: none;
  }
}
```

Import it last from `apps/plataforma/app/race.css` so earlier overrides cannot collapse the media layer.

- [ ] **Step 5: Run targeted tests**

```bash
pnpm --filter @udk/plataforma test -- tests/official-media.test.ts tests/audit-round-three.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run lint and typecheck**

```bash
pnpm --filter @udk/plataforma lint
pnpm --filter @udk/plataforma typecheck
```

Expected: PASS with no unused import and no client/server boundary error.

- [ ] **Step 7: Commit the Home renderer**

```bash
git add apps/plataforma/components/race/home-hero-media.tsx apps/plataforma/app/page.tsx apps/plataforma/app/official-media.css apps/plataforma/app/race.css apps/plataforma/tests/official-media.test.ts
git commit -m "feat: add motion-aware official Home hero"
```

---

### Task 5: Extend browser diagnostics to cover the Home video

**Files:**
- Modify: `.github/scripts/capture-visual-audit.mjs`
- Modify: `apps/plataforma/tests/audit-round-three.test.ts`

**Interfaces:**
- Consumes: existing per-route diagnostic object and Home `<video>` element.
- Produces: `videos` diagnostics with source, poster, ready state, dimensions, and playback error; adds video failures to the final `failures` array.

- [ ] **Step 1: Write the failing audit source test**

Add:

```ts
it("audits poster-backed video dimensions and playback errors", () => {
  const audit = readRepositoryFile(".github/scripts/capture-visual-audit.mjs");
  expect(audit).toContain('document.querySelectorAll("video")');
  expect(audit).toContain("videoWidth");
  expect(audit).toContain("videoHeight");
  expect(audit).toContain("videoFailures");
  expect(audit).toContain("...videoFailures");
});
```

Run:

```bash
pnpm --filter @udk/plataforma test -- tests/audit-round-three.test.ts
```

Expected: FAIL because video diagnostics are not present.

- [ ] **Step 2: Collect video diagnostics without requiring playback on mobile**

Inside the page evaluation, collect:

```js
const videos = [...document.querySelectorAll("video")].map((video) => {
  const rect = video.getBoundingClientRect();
  return {
    src: video.currentSrc || video.querySelector("source")?.src || "",
    poster: video.poster,
    readyState: video.readyState,
    networkState: video.networkState,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    width: rect.width,
    height: rect.height,
    error: video.error?.message ?? null,
  };
});
```

Fail only when a rendered video has an error, missing poster, invalid rendered dimensions, or reaches metadata-ready state with invalid natural dimensions. Do not fail mobile routes merely because the video is intentionally absent.

- [ ] **Step 3: Aggregate video failures**

Use:

```js
const failures = [
  ...mediaFailures,
  ...videoFailures,
  ...runtimeFailures,
  ...captureFailures,
];
```

Include `videos` in each route diagnostic record.

- [ ] **Step 4: Run targeted tests**

```bash
pnpm --filter @udk/plataforma test -- tests/audit-round-three.test.ts tests/official-media.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit diagnostics**

```bash
git add .github/scripts/capture-visual-audit.mjs apps/plataforma/tests/audit-round-three.test.ts
git commit -m "test: audit official Home video and poster"
```

---

### Task 6: Run full verification and visual review

**Files:**
- Potentially modify: `apps/plataforma/lib/visual-assets.ts`, `apps/plataforma/app/official-media.css`, or individual derivatives when visual inspection reveals crop or contrast problems.
- Output: GitHub Actions visual audit artifact with 18 PNGs and `diagnostics.json`.

**Interfaces:**
- Consumes: all tasks above.
- Produces: deployable branch, green CI, manually inspected gallery, and final audit ZIP.

- [ ] **Step 1: Run the complete local verification suite**

```bash
pnpm verify
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Expected: all commands exit 0.

- [ ] **Step 2: Verify the media files independently**

```bash
ffprobe -v error -show_entries format=duration,size -show_streams \
  apps/plataforma/public/media/official/home/hero-loop.mp4
```

Expected: one H.264 video stream, no audio stream, duration 6–12 seconds, `yuv420p`, and valid dimensions.

Open every WebP and confirm it decodes. Verify the manifest count equals the derivative count.

- [ ] **Step 3: Open a pull request**

PR title:

```text
feat: integrate official UDK photos and video
```

PR body must list source provenance, pages changed, no-Supabase statement, performance rules, test results, and visual audit expectations.

- [ ] **Step 4: Wait for Application CI and Visual Audit**

Expected:

- lint success;
- TypeScript success;
- all Vitest files success;
- production build success;
- quality gates success;
- 18 screenshots generated;
- zero image failures;
- zero video failures;
- zero runtime or console errors;
- zero request or capture failures;
- Vercel preview Ready.

- [ ] **Step 5: Download and inspect the audit artifact**

Inspect at minimum:

- Home desktop and mobile;
- Calendário desktop;
- Classificação desktop and mobile;
- Resultados desktop;
- Pilotos desktop and mobile;
- Login desktop and mobile.

Check text contrast, subject crop, sponsor/logo integrity, image repetition, mobile focal points, video poster transition, and absence of black or zero-height media blocks.

- [ ] **Step 6: Fix defects and repeat verification**

For crop corrections, change only `position` or regenerate the affected derivative. For contrast, adjust overlay CSS rather than destructively darkening every source. Repeat the entire visual audit after each final media or CSS change.

- [ ] **Step 7: Review and merge**

Resolve all valid review threads, confirm the final head SHA has green CI and Vercel Ready, then squash merge into `main`.

- [ ] **Step 8: Generate the user-facing audit package**

Package:

```text
UDK_Auditoria_Visual_Midia_Oficial/
  gallery.html
  desktop/*.png
  mobile/*.png
  contact-desktop.jpg
  contact-mobile.jpg
  diagnostics.json
  source-manifest.json
```

Create `UDK_Auditoria_Visual_Midia_Oficial_Desktop_Mobile.zip` and provide sandbox download links for the HTML gallery, ZIP, both contact sheets, and diagnostics.
