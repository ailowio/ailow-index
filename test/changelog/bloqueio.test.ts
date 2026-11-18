import { describe, expect, it } from "vitest";
import { lintConteudo } from "../../src/changelog/bloqueio";

describe("linter de conteúdo público", () => {
  it("não acusa texto limpo, mesmo com versões e a marca Ailow", () => {
    expect(lintConteudo("Ailow Cloud v1.4.1 no ar em cloud.ailow.com.br; SGI v2.457.2.")).toEqual([]);
  });

  // Os "segredos" abaixo são montados em tempo de execução para o gitleaks do CI não os
  // confundir com credenciais reais; nenhum valor aqui é real (IP da faixa de documentação RFC 5737).
  const x = (n: number) => "x".repeat(n);
  it.each([
    ["endereço IPv4", "a VPS responde em 203.0.113.10"],
    ["grafia ILO de domínio", "visite ilo.com.br"],
    ["grafia ILO de produto", "o ilopulse conta voltas"],
    ["número de fatura", `fatura H_${"1".repeat(8)} paga`],
    ["chave de API", `sk-${x(32)}`],
    ["token do GitHub", `ghp_${x(36)}`],
    ["JWT", `eyJ${x(16)}.eyJ${x(16)}.${x(8)}`],
    ["chave privada", `-----BEGIN ${"RSA"} PRIVATE KEY-----`],
    ["projeto Supabase", `https://${x(20)}.supabase.co`],
  ])("acusa %s", (_nome, texto) => {
    expect(lintConteudo(texto)).not.toEqual([]);
  });

  it("acusa termos extras da lista local (nomes que não podem ir para o repositório público)", () => {
    expect(lintConteudo("case da Loja Exemplo", ["loja exemplo"])).toEqual([
      expect.stringContaining("termo bloqueado"),
    ]);
  });

  it("compara termos extras sem diferenciar maiúsculas e acentos", () => {
    expect(lintConteudo("projeto JOSÉ", ["jose"])).toHaveLength(1);
  });

  it("não acusa termo extra que aparece só dentro de outra palavra", () => {
    expect(lintConteudo("ferramenta", ["ferra"])).toEqual([]);
  });
});
