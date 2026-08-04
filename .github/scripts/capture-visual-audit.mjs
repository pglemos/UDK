import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.VISUAL_AUDIT_BASE_URL ?? "http://127.0.0.1:3000";
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

    window.scrollTo({ top: 0, behavior: "instant" });
    await wait(500);
  });
}

async function collectDiagnostics(page, route, viewportName, failures) {
  const media = await page.locator(".tg-driver-poster-media img, .tg-standing-podium-visual img").evaluateAll(
    (images) => images.map((image) => {
      const style = window.getComputedStyle(image);
      const bounds = image.getBoundingClientRect();
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
      };
    }),
  );

  const broken = media.filter((item) => !item.complete || item.naturalWidth < 2 || item.width < 2 || item.height < 2);
  if (broken.length) {
    failures.push({ route, viewport: viewportName, broken });
  }

  return { route, viewport: viewportName, media };
}

await fs.rm(outputDirectory, { recursive: true, force: true });
await fs.mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const diagnostics = [];
const failures = [];

try {
  for (const [viewportName, viewport] of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });

    for (const [route, slug] of routes) {
      const page = await context.newPage();
      const pageErrors = [];
      const requestFailures = [];

      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("requestfailed", (request) => {
        const url = request.url();
        if (url.includes("/_next/image") || url.includes("images.unsplash.com")) {
          requestFailures.push({ url, error: request.failure()?.errorText ?? "unknown" });
        }
      });

      await page.goto(`${baseUrl}/${route}`, { waitUntil: "networkidle", timeout: 45_000 });
      await scrollAndHydrate(page);
      await sleep(800);

      const routeDiagnostics = await collectDiagnostics(page, route || "home", viewportName, failures);
      diagnostics.push({ ...routeDiagnostics, pageErrors, requestFailures });

      await page.screenshot({
        path: path.join(outputDirectory, `${slug}-${viewportName}.png`),
        fullPage: true,
      });
      await page.close();
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(outputDirectory, "diagnostics.json"),
  `${JSON.stringify({ diagnostics, failures }, null, 2)}\n`,
  "utf8",
);

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
