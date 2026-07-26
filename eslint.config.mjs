import { defineConfig, globalIgnores } from "eslint/config";
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
  {
    files: ["apps/plataforma/lib/public-data.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off"
    }
  },
  globalIgnores([
    "**/.next/**",
    "**/dist/**",
    "**/node_modules/**",
    "packages/**/src/generated.types.ts"
  ])
]);
