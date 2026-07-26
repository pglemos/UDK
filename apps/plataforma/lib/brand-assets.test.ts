import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(appRoot, "../..");

const officialAssets = {
  "public/brand/udk-logo-principal.svg": "da44f28c268bf7fd872cbf3054da5732a41aa6ac21b6483ce9cb2457c9e96f54",
  "public/brand/udk-logo-negativa.svg": "1041461a1157862bf52ce796068e1cc128965f3f6fccf4ecacaf0424c258607a",
  "public/brand/udk-logo-monocromatica-escura.svg": "a2d61f20d63ec69e75f8aeead4159b2693b27162c02a1e8c00bebc950217d3c6",
  "public/brand/udk-marca-branca.svg": "7c90e431f12b5df043e725383d17e70c0c3eca2edf56b8d49a1d8aaa5408ed86",
  "public/brand/udk-marca-escura.svg": "d6141ec3f250f9f05c8cbc1c1db2e538293ad07b70c681861aaa4982bfe13d29",
  "public/icons/udk-avatar-512.png": "15997ebc97457e085d23007ead2e18f7e266b99948fecf047746ce0d7642c382",
  "public/icons/udk-avatar-1080.png": "42d7f0e22fe9c04eca725a28b1cfa8f5fdf7682c62fe90af1c75cd77316b2845",
} as const;

const textExtensions = new Set([".css", ".html", ".js", ".jsx", ".json", ".md", ".mjs", ".ts", ".tsx", ".yaml", ".yml"]);
const ignoredDirectories = new Set([".git", ".next", "node_modules"]);

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function collectTextFiles(directory: string, files: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const path = join(directory, entry);
    const metadata = statSync(path);
    if (metadata.isDirectory()) collectTextFiles(path, files);
    else if (textExtensions.has(extname(entry)) && entry !== "pnpm-lock.yaml" && entry !== "brand-assets.test.ts") files.push(path);
  }
  return files;
}

function readApp(path: string): string {
  return readFileSync(resolve(appRoot, path), "utf8");
}

describe("official UDK brand contract", () => {
  it("ships the exact official vector and avatar files", () => {
    const problems: string[] = [];

    for (const [relativePath, expectedHash] of Object.entries(officialAssets)) {
      const path = resolve(appRoot, relativePath);
      if (!existsSync(path)) {
        problems.push(`missing ${relativePath}`);
        continue;
      }
      const actualHash = sha256(path);
      if (actualHash !== expectedHash) problems.push(`${relativePath} has ${actualHash}`);
    }

    expect(problems).toEqual([]);
  });

  it("removes the synthetic cyan logo and all legacy references", () => {
    const problems: string[] = [];
    const legacyAsset = resolve(appRoot, "public/udk.svg");
    if (existsSync(legacyAsset)) problems.push("apps/plataforma/public/udk.svg still exists");

    for (const path of collectTextFiles(workspaceRoot)) {
      const text = readFileSync(path, "utf8");
      if (/\/udk\.svg\b/i.test(text)) problems.push(`${relative(workspaceRoot, path)} references /udk.svg`);
    }

    expect(problems).toEqual([]);
  });

  it("uses Roboto Condensed and Roboto instead of the retired interface fonts", () => {
    const problems: string[] = [];

    for (const path of collectTextFiles(workspaceRoot)) {
      const text = readFileSync(path, "utf8");
      if (/Barlow\s+Condensed/i.test(text)) problems.push(`${relative(workspaceRoot, path)} uses Barlow Condensed`);
      if (/font-family\s*:[^;]*\bInter\b/i.test(text)) problems.push(`${relative(workspaceRoot, path)} uses Inter`);
    }

    const globals = readApp("app/globals.css");
    if (!globals.includes("family=Roboto+Condensed")) problems.push("globals.css does not import Roboto Condensed");
    if (!globals.includes("family=Roboto:")) problems.push("globals.css does not import Roboto");
    if (!/font-family:\s*"Roboto",\s*Arial,\s*sans-serif/.test(globals)) problems.push("globals.css does not use Roboto for body copy");
    if (!/font-family:\s*"Roboto Condensed",\s*Arial,\s*sans-serif/.test(globals)) problems.push("globals.css does not use Roboto Condensed for display text");

    expect(problems).toEqual([]);
  });

  it("uses the correct official variants in every application surface", () => {
    const negativeLogo = "/brand/udk-logo-negativa.svg";
    const avatar512 = "/icons/udk-avatar-512.png";
    const avatar1080 = "/icons/udk-avatar-1080.png";
    const problems: string[] = [];

    for (const file of [
      "components/auth-screen.tsx",
      "components/public-layout.tsx",
      "app/painel/[[...slug]]/page.tsx",
      "public/offline.html",
    ]) {
      if (!readApp(file).includes(negativeLogo)) problems.push(`${file} does not use the official negative logo`);
    }

    const layout = readApp("app/layout.tsx");
    if (!layout.includes(avatar512) || !layout.includes(avatar1080)) problems.push("layout metadata does not expose both official avatars");

    const manifest = readApp("app/manifest.ts");
    if (!manifest.includes(avatar512) || !manifest.includes(avatar1080)) problems.push("manifest does not expose both official avatars");

    const serviceWorker = readApp("public/sw.js");
    if (!serviceWorker.includes(negativeLogo) || !serviceWorker.includes(avatar512)) problems.push("service worker does not pre-cache official brand assets");

    expect(problems).toEqual([]);
  });
});
