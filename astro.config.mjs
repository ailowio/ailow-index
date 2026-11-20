// @ts-check
import { defineConfig } from "astro/config";

// Site estático (ADR 001). `site` gera URLs canônicas e o sitemap futuro.
// Mantido igual a SITE.url em src/config/site.ts (conferido por teste).
export default defineConfig({
  site: "https://ailow.com.br",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "directory" },
  // V07 (ADR 007 item 5): em produção quem responde o 301 é o nginx (ops/web/nginx.conf); o build gera a
  // página de meta refresh (noindex, canonical para /na-tv) para o preview e qualquer servidor sem a regra.
  redirects: {
    "/pedro/entrevistas": { status: 301, destination: "/na-tv" },
  },
});
