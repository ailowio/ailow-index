// @ts-check
import { defineConfig } from "astro/config";

// Site estático (ADR 001). `site` gera URLs canônicas e o sitemap futuro.
// Mantido igual a SITE.url em src/config/site.ts (conferido por teste).
export default defineConfig({
  site: "https://ailow.com.br",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "directory" },
});
