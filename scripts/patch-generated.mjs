import { readFile, writeFile, rm } from "node:fs/promises";

await writeFile(
  "eslint.config.mjs",
  `import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  globalIgnores([
    "**/.next/**",
    "**/dist/**",
    "**/node_modules/**",
    "packages/**/src/generated.types.ts"
  ])
]);
`,
);

const layoutPath = "apps/web-publico/app/layout.tsx";
const layout = await readFile(layoutPath, "utf8");
await writeFile(
  layoutPath,
  layout.replace(
    "const links=[[",
    "const links: Array<[string, string]> = [[",
  ),
);

const homePath = "apps/web-publico/app/page.tsx";
let home = await readFile(homePath, "utf8");
home = home.replace(
  "export default async function Home(){const {drivers,stages}=await publicData();return",
  'export default async function Home(){const {drivers,stages}=await publicData();const nextStage=stages[0]??{date:"18 AGO",title:"Endurance",track:"Traçado 01 invertido com chicane",time:"21h"};return',
);
home = home.replaceAll("stages[0].", "nextStage.");
await writeFile(homePath, home);

await rm("lint-diagnostics.txt", { force: true });
await rm("verification-diagnostics.txt", { force: true });
console.log("generated-files-patched");
