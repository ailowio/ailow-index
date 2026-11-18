// Build isolado usado pelos testes de test/build/: cada cenário tem outDir e cacheDir próprios
// (o cache do content layer não pode vazar de um cenário para outro).
// Variáveis (só de teste): AILOW_PRS_DIR (lida em src/content.config.ts), AILOW_OUT_DIR, AILOW_CACHE_DIR.
import { build } from "astro";

const outDir = process.env.AILOW_OUT_DIR;
const cacheDir = process.env.AILOW_CACHE_DIR;
if (!outDir || !cacheDir) {
  console.error("build-cenario: defina AILOW_OUT_DIR e AILOW_CACHE_DIR");
  process.exit(2);
}

try {
  await build({ root: process.cwd(), outDir, cacheDir, logLevel: "info" });
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : String(erro));
  process.exit(1);
}
