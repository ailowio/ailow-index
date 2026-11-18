import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Prova no build de verdade (critérios 2, 3 e 10 do plano): cada cenário de
 * test/fixtures/feeds/<cenario>/ vira a collection `prs` de um `astro build` isolado.
 */
const raiz = resolve(import.meta.dirname, "../..");
const temp = join(raiz, "test", ".tmp-build");

function construir(cenario: string) {
  const outDir = join(temp, cenario, "dist");
  const r = spawnSync(process.execPath, [join(raiz, "scripts", "build-cenario.mjs")], {
    cwd: raiz,
    encoding: "utf8",
    timeout: 120_000,
    env: {
      ...process.env,
      ASTRO_TELEMETRY_DISABLED: "1",
      AILOW_PRS_DIR: `./test/fixtures/feeds/${cenario}`,
      AILOW_OUT_DIR: outDir,
      AILOW_CACHE_DIR: join(temp, cenario, "cache"),
    },
  });
  return { status: r.status, saida: `${r.stdout}\n${r.stderr}`, outDir };
}

function todoTexto(dir: string): string {
  let texto = "";
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    texto += statSync(p).isDirectory() ? todoTexto(p) : readFileSync(p, "utf8");
  }
  return texto;
}

afterAll(() => rmSync(temp, { recursive: true, force: true }));

describe("build do feed com conteúdo válido", () => {
  const r = construir("valido");

  it("termina com sucesso", () => {
    expect(r.saida).not.toContain("Feed do changelog inválido");
    expect(r.status).toBe(0);
  });

  it("publica em /pedro/feed.json só as entradas confirmadas, com o + ferramenta derivado", () => {
    const feed = JSON.parse(readFileSync(join(r.outDir, "pedro", "feed.json"), "utf8"));
    expect(feed.prs.map((p: { numero: number }) => p.numero)).toEqual([1, 3]);
    expect(feed.prs.map((p: { novas: string[] }) => p.novas)).toEqual([["docker", "react"], ["n8n"]]);
  });

  it("não deixa texto de entrada pendente ou fora em nenhum arquivo do dist/", () => {
    expect(existsSync(r.outDir)).toBe(true);
    const tudo = todoTexto(r.outDir);
    expect(tudo).not.toContain("MARCADOR-PENDENTE");
    expect(tudo).not.toContain("MARCADOR-FORA");
  });

  it("informa no log quantas entradas existem e quantas foram publicadas", () => {
    expect(r.saida).toContain("feed: 4 entradas, 2 publicadas");
  });
});

describe("o build reprova feed inválido (canários)", () => {
  it.each([
    ["duplicado", "#001 duplicado"],
    ["ordem", "#002 (2026-01) é anterior a #001 (2026-03)"],
    ["ferramenta-desconhecida", "ferramenta desconhecida: kubernetes"],
    ["bloqueio", "padrão bloqueado: grafia ILO"],
    ["bloqueio-pendente", "padrão bloqueado: endereço IPv4"],
    ["data-invalida", "AAAA-MM"],
  ])(
    "cenário %s",
    (cenario, mensagem) => {
      const r = construir(cenario);
      expect(r.status).not.toBe(0);
      expect(r.saida).toContain(mensagem);
    },
    60_000,
  );
});
