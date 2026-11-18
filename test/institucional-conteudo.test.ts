import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGINAS = ["sobre", "pulse", "cloud"];
const raiz = join(import.meta.dirname, "..");

/** Termos que nunca entram no texto público (CLAUDE.md, "Conteúdo público"). */
const PROIBIDOS: { nome: string; padrao: RegExp }[] = [
  { nome: "grafia ilo. isolada", padrao: /\bilo\.(?!\w)/i },
  { nome: "venda por voz", padrao: /venda\s+por\s+voz/i },
  { nome: "software house", padrao: /software\s+house/i },
  { nome: "fazemos qualquer sistema", padrao: /fazemos\s+qualquer\s+sistema/i },
  { nome: "endereço IPv4", padrao: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
];

function achados(texto: string): string[] {
  return PROIBIDOS.filter((p) => p.padrao.test(texto)).map((p) => p.nome);
}

describe("conteúdo público das páginas institucionais", () => {
  for (const pagina of PAGINAS) {
    it(`/${pagina} não contém termo proibido`, () => {
      const texto = readFileSync(join(raiz, "src", "pages", `${pagina}.astro`), "utf8");
      expect(achados(texto)).toEqual([]);
    });
  }

  it("o detector reprova termos proibidos (canário permanente)", () => {
    expect(achados("fale com a ilo. hoje")).toContain("grafia ilo. isolada");
    expect(achados("recurso de venda por voz")).toContain("venda por voz");
    expect(achados("somos uma Software House")).toContain("software house");
    expect(achados("servidor em 10.0.0.1")).toContain("endereço IPv4");
  });

  it("não confunde Ailow, hosts e frases comuns", () => {
    expect(achados("Ailow publica em ailow.com.br e cloud.ailow.com.br.")).toEqual([]);
  });
});
