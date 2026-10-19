import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { dateRulesConfig } from "./eslint.fechas.config.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Las reglas de fechas: ver eslint.fechas.config.mjs.
  dateRulesConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
