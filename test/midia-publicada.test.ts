import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TETOS } from "../src/midia/pacote";
import { validarPacote } from "../src/midia/validar";
import { apresentacao } from "../src/data/apresentacao";

// V06 (2026-11-20, ADR 005 e 008): tudo o que está em public/midia é pacote importado da bancada e respeita os tetos.
const raiz = join(import.meta.dirname, "..");

function listarMidia(base: string): { pasta: string; arquivo: string; caminho: string }[] {
  if (!existsSync(base)) return [];
  const saida: { pasta: string; arquivo: string; caminho: string }[] = [];
  for (const pasta of readdirSync(base)) {
    const dir = join(base, pasta);
    if (!statSync(dir).isDirectory()) continue;
    for (const arquivo of readdirSync(dir)) saida.push({ pasta, arquivo, caminho: join(dir, arquivo) });
  }
  return saida;
}

/** Devolve o que está fora da regra; lista vazia = ok. Usado pelo teste e pelo canário. */
function violacoes(base: string): string[] {
  const v: string[] = [];
  const itens = listarMidia(base);
  for (const i of itens) {
    const bytes = statSync(i.caminho).size;
    if (bytes > TETOS.videoBytes) v.push(`${i.pasta}/${i.arquivo}: ${bytes} B acima de 8 MB`);
  }
  for (const pasta of new Set(itens.map((i) => i.pasta))) {
    const nomes = itens.filter((i) => i.pasta === pasta).map((i) => i.arquivo);
    if (nomes.includes("video-720p.mp4")) {
      if (!nomes.includes("legenda.vtt")) v.push(`${pasta}: vídeo sem legenda.vtt`);
      if (!nomes.includes("poster.webp")) v.push(`${pasta}: vídeo sem pôster`);
    }
  }
  return v;
}

describe("public/midia (V06)", () => {
  const base = join(raiz, "public", "midia");

  it("há pacotes importados e nenhum arquivo passa de 8 MB; todo vídeo tem .vtt e pôster", () => {
    expect(listarMidia(base).length).toBeGreaterThan(0);
    expect(violacoes(base)).toEqual([]);
  });

  it("cada pasta continua sendo um pacote válido do contrato (schema, tetos, cabeçalhos, linter)", () => {
    const pastas = readdirSync(base).filter((p) => statSync(join(base, p)).isDirectory());
    expect(pastas.length).toBeGreaterThanOrEqual(5);
    for (const p of pastas) {
      const r = validarPacote(join(base, p));
      expect(r.erros, p).toEqual([]);
      expect(JSON.parse(readFileSync(join(base, p, "site.json"), "utf8")).aprovado_por, p).toBe("Pedro");
    }
  });

  // V06 · 2026-11-20 · P3 retirado pelo orquestrador: valor/lista de pedidos em tela (o pacote segue na bancada, em final/site/).
  it("os slugs importados são os da V06 e o vídeo da bancada longo (E6, 76 s) não entrou", () => {
    const pastas = readdirSync(base).sort();
    expect(pastas).toEqual([
      "chao-1-dois-quadros",
      "chao-2-sinal-chegou",
      "fixado-00-o-que-eu-faco",
      "teaser-p1-improvisar-sob-pressao",
      "teaser-p2-teoria-na-pratica",
    ]);
  });

  it("peça com voz ou imagem gerada por IA leva selo_ia true", () => {
    for (const p of ["fixado-00-o-que-eu-faco", "chao-1-dois-quadros", "chao-2-sinal-chegou"]) {
      expect(JSON.parse(readFileSync(join(base, p, "site.json"), "utf8")).selo_ia, p).toBe(true);
    }
  });
});

describe("/apresentacao liga um pacote (V06)", () => {
  it("o slot de vídeo aponta para o Fixado 00 em public/midia, com pôster e legenda", () => {
    const v = apresentacao.video;
    expect(v).not.toBeNull();
    expect(v?.mp4).toBe("/midia/fixado-00-o-que-eu-faco/video-720p.mp4");
    expect(v?.poster).toBe("/midia/fixado-00-o-que-eu-faco/poster.webp");
    expect(v?.vtt).toBe("/midia/fixado-00-o-que-eu-faco/legenda.vtt");
    expect(v?.selo_ia).toBe(true);
  });
});

describe("canário do gate de mídia (L-0006)", () => {
  it("reprova arquivo acima de 8 MB, vídeo sem .vtt e vídeo sem pôster", () => {
    const tmp = mkdtempSync(join(tmpdir(), "midia-canario-"));
    try {
      mkdirSync(join(tmp, "grande"));
      writeFileSync(join(tmp, "grande", "video-720p.mp4"), Buffer.alloc(TETOS.videoBytes + 1));
      mkdirSync(join(tmp, "sem-legenda"));
      writeFileSync(join(tmp, "sem-legenda", "video-720p.mp4"), "x");
      writeFileSync(join(tmp, "sem-legenda", "poster.webp"), "x");
      mkdirSync(join(tmp, "sem-poster"));
      writeFileSync(join(tmp, "sem-poster", "video-720p.mp4"), "x");
      writeFileSync(join(tmp, "sem-poster", "legenda.vtt"), "x");
      const v = violacoes(tmp).join("\n");
      expect(v).toContain("grande/video-720p.mp4");
      expect(v).toContain("sem-legenda: vídeo sem legenda.vtt");
      expect(v).toContain("sem-poster: vídeo sem pôster");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
