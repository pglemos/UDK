import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const playwrightModule = process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright";
const { chromium } = require(playwrightModule);

const baseUrl = process.env.VISUAL_AUDIT_BASE_URL ?? "http://127.0.0.1:3000";
const browserChannel = process.env.VISUAL_AUDIT_BROWSER_CHANNEL;
const outputDirectory = path.resolve("visual-audit");
const routes = [
  ["", "home"],
  ["calendario", "calendario"],
  ["classificacao", "classificacao"],
  ["resultados", "resultados"],
  ["pilotos", "pilotos"],
  ["noticias", "noticias"],
  ["regulamento", "regulamento"],
  ["inscricao", "inscricao"],
  ["login", "login"],
];
const viewports = [
  ["desktop", { width: 1440, height: 1100 }],
  ["mobile", { width: 390, height: 844 }],
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function isAuditedMediaUrl(url) {
  return (
    url.includes("/_next/image") ||
    url.includes("/media/official/") ||
    url.includes("media%2Fofficial") ||
    url.includes("images.unsplash.com")
  );
}

function isExpectedVideoMetadataAbort(url, errorText) {
  return (
    url.includes("/media/official/") &&
    url.includes(".mp4") &&
    errorText.includes("ERR_ABORTED")
  );
}

async function scrollAndHydrate(page) {
  await page.evaluate(async () => {
    const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const viewport = Math.max(window.innerHeight, 640);
    let previousHeight = 0;

    for (let pass = 0; pass < 3; pass += 1) {
      const height = document.documentElement.scrollHeight;
      for (let position = 0; position < height; position += Math.floor(viewport * 0.72)) {
        window.scrollTo({ top: position, behavior: "instant" });
        await wait(140);
      }
      window.scrollTo({ top: height, behavior: "instant" });
      await wait(300);
      if (height === previousHeight) break;
      previousHeight = height;
    }

    const images = Array.from(document.images);
    await Promise.all(
      images.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
          setTimeout(resolve, 8000);
        });
      }),
    );

    await wait(500);

    const videos = Array.from(document.querySelectorAll("video"));
    await Promise.all(
      videos.map((video) => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || video.error) {
          return Promise.resolve();
        }
        return new Promise((resolve) => {
          video.addEventListener("loadeddata", resolve, { once: true });
          video.addEventListener("error", resolve, { once: true });
          setTimeout(resolve, 8000);
        });
      }),
    );

    await Promise.all(
      videos.map(async (video) => {
        if (video.error || video.readyState < HTMLMediaElement.HAVE_METADATA) return;
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;

        const targetTime = Math.min(1.5, Math.max(0, video.duration - 0.25));
        if (Math.abs(video.currentTime - targetTime) > 0.1) {
          await new Promise((resolve) => {
            const finish = () => resolve();
            video.addEventListener("seeked", finish, { once: true });
            setTimeout(finish, 3000);
            video.currentTime = targetTime;
          });
        }
        video.pause();
      }),
    );

    window.scrollTo({ top: 0, behavior: "instant" });
    await wait(500);
  });
}

async function collectDiagnostics(
  page,
  route,
  viewportName,
  mediaFailures,
  videoFailures,
) {
  const media = await page.locator("img").evaluateAll((images) =>
    images
      .filter((image) => {
        const source = `${image.currentSrc || ""} ${image.src || ""}`;
        return source.includes("/media/official/") || source.includes("media%2Fofficial");
      })
      .map((image) => {
        const style = window.getComputedStyle(image);
        const bounds = image.getBoundingClientRect();
        const opacity = Number.parseFloat(style.opacity || "1");
        const visible =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          opacity > 0.01;

        return {
          src: image.currentSrc || image.src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          objectFit: style.objectFit,
          visible,
        };
      }),
  );

  const broken = media.filter(
    (item) =>
      !item.complete ||
      item.naturalWidth < 2 ||
      item.naturalHeight < 2 ||
      (item.visible && (item.width < 2 || item.height < 2)),
  );
  if (broken.length) {
    mediaFailures.push({ type: "media", route, viewport: viewportName, broken });
  }

  const videos = await page.evaluate(() =>
    Array.from(document.querySelectorAll("video")).map((video) => {
      const style = window.getComputedStyle(video);
      const bounds = video.getBoundingClientRect();
      const opacity = Number.parseFloat(style.opacity || "1");
      const visible =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        opacity > 0.01;

      return {
        src: video.currentSrc || video.src,
        poster: video.poster,
        readyState: video.readyState,
        networkState: video.networkState,
        errorCode: video.error?.code ?? null,
        errorMessage: video.error?.message ?? null,
        duration: Number.isFinite(video.duration) ? video.duration : null,
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        visible,
        paused: video.paused,
        muted: video.muted,
        loop: video.loop,
        playsInline: video.playsInline,
      };
    }),
  );

  const expectsVideo = route === "home" && viewportName === "desktop";
  if (expectsVideo && videos.length === 0) {
    videoFailures.push({
      type: "video",
      route,
      viewport: viewportName,
      broken: [{ reason: "missing-home-video" }],
    });
  }

  const brokenVideos = videos.filter(
    (video) =>
      !video.src ||
      !video.poster ||
      video.errorCode !== null ||
      video.networkState === 3 ||
      video.readyState < 2 ||
      (video.visible && (video.width < 2 || video.height < 2)),
  );
  if (brokenVideos.length) {
    videoFailures.push({
      type: "video",
      route,
      viewport: viewportName,
      broken: brokenVideos,
    });
  }

  return { route, viewport: viewportName, media, videos };
}

await fs.rm(outputDirectory, { recursive: true, force: true });
await fs.mkdir(outputDirectory, { recursive: true });

const diagnostics = [];
const mediaFailures = [];
const videoFailures = [];
const runtimeFailures = [];
const captureFailures = [];
let browser;

function writeDiagnostics() {
  return fs.writeFile(
    path.join(outputDirectory, "diagnostics.json"),
    `${JSON.stringify(
      {
        diagnostics,
        failures: [...mediaFailures, ...videoFailures, ...runtimeFailures, ...captureFailures],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

try {
  browser = await chromium.launch({
    headless: true,
    ...(browserChannel ? { channel: browserChannel } : {}),
  });

  for (const [viewportName, viewport] of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });

    try {
      for (const [route, slug] of routes) {
        const page = await context.newPage();
        const routeName = route || "home";
        const pageErrors = [];
        const consoleErrors = [];
        const requestFailures = [];
        let diagnosticsRecorded = false;

        page.on("pageerror", (error) => pageErrors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error") {
            consoleErrors.push(message.text());
          }
        });
        page.on("requestfailed", (request) => {
          const url = request.url();
          const errorText = request.failure()?.errorText ?? "unknown";
          if (isAuditedMediaUrl(url) && !isExpectedVideoMetadataAbort(url, errorText)) {
            requestFailures.push({ url, error: errorText });
          }
        });
        page.on("response", (response) => {
          const url = response.url();
          if (response.status() >= 400 && isAuditedMediaUrl(url)) {
            requestFailures.push({ url, status: response.status() });
          }
        });

        try {
          await page.goto(`${baseUrl}/${route}`, {
            waitUntil: "networkidle",
            timeout: 45_000,
          });
          await scrollAndHydrate(page);
          await sleep(800);

          const routeDiagnostics = await collectDiagnostics(
            page,
            routeName,
            viewportName,
            mediaFailures,
            videoFailures,
          );
          diagnostics.push({
            ...routeDiagnostics,
            pageErrors,
            consoleErrors,
            requestFailures,
          });
          diagnosticsRecorded = true;

          if (pageErrors.length || consoleErrors.length || requestFailures.length) {
            runtimeFailures.push({
              type: "runtime",
              route: routeName,
              viewport: viewportName,
              pageErrors,
              consoleErrors,
              requestFailures,
            });
          }

          await page.screenshot({
            path: path.join(outputDirectory, `${slug}-${viewportName}.png`),
            fullPage: true,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          captureFailures.push({
            type: "capture",
            route: routeName,
            viewport: viewportName,
            error: message,
          });

          if (!diagnosticsRecorded) {
            diagnostics.push({
              route: routeName,
              viewport: viewportName,
              media: [],
              videos: [],
              pageErrors,
              consoleErrors,
              requestFailures,
              captureError: message,
            });
          }
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  }
} catch (error) {
  captureFailures.push({
    type: "capture",
    route: "audit-runner",
    viewport: "all",
    error: error instanceof Error ? error.message : String(error),
  });
} finally {
  try {
    if (browser) {
      await browser.close();
    }
  } finally {
    await writeDiagnostics();
  }
}

const failures = [
  ...mediaFailures,
  ...videoFailures,
  ...runtimeFailures,
  ...captureFailures,
];

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
