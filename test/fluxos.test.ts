import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lintConteudo } from "../src/changelog/bloqueio";
import { carregarTermosLocais } from "../src/changelog/carregar-termos";
import { carregarFluxos } from "../src/fluxos/carregar";
import { achadosSaneamento, esquemaFluxo } from "../src/fluxos/esquema";
import { caixaDoCanvas, caminhoLigacao, linhasDoRotulo } from "../src/fluxos/geometria";

const raiz = join(import.meta.dirname, "..");
const pasta = join(raiz, "src", "data", "fluxos");
const arquivos = readdirSync(pasta).filter((n) => n.endsWith(".json"));

// F5 (2026-11-20): o Explorador reproduz 5 fluxos reais do n8n do Pedro, a partir de uma versão DERIVADA e
// saneada (lista de permissões, gerada fora do repositório). O export bruto nunca entra aqui (CLAUDE.md).
describe("fluxos do Explorador: dados", () => {
  it("existem os 5 fluxos escolhidos", () => {
    expect(arquivos.sort()).toEqual([
      "agente-producao-teares.json",
      "gateway-producao-teares.json",
      "lina-atendimento-whatsapp.json",
      "pcp-no-asana.json",
      "transcritor-de-audio.json",
    ]);
  });

  it.each(arquivos)("%s segue o esquema, com ids únicos e ligações entre nós que existem", (nome) => {
    const dado = esquemaFluxo.parse(JSON.parse(readFileSync(join(pasta, nome), "utf8")));
    expect(`${dado.slug}.json`).toBe(nome);
    const ids = new Set(dado.nos.map((n) => n.id));
    expect(ids.size).toBe(dado.nos.length);
    for (const l of dado.ligacoes) {
      expect(ids.has(l.de), `${nome}: ${l.de}`).toBe(true);
      expect(ids.has(l.para), `${nome}: ${l.para}`).toBe(true);
    }
  });

  it.each(arquivos)("%s não traz nada do export bruto (URL, e-mail, IP, id, número longo, campo do n8n)", (nome) => {
    const texto = readFileSync(join(pasta, nome), "utf8");
    expect(achadosSaneamento(texto)).toEqual([]);
    expect(lintConteudo(texto, carregarTermosLocais(raiz))).toEqual([]);
  });

  it("canário: o saneamento reprova um nó sujo", () => {
    const sujo = JSON.stringify({
      rotulo: "POST https://exemplo.com/webhook/abc",
      a: "contato@empresa.com.br",
      b: "10.0.0.12",
      c: "ssnVYtFbGYwrrBgA",
      d: "5585900001111",
      parameters: {},
      credentials: {},
      webhookId: "x",
    });
    const achados = achadosSaneamento(sujo);
    for (const tipo of ["URL", "e-mail", "IPv4", "id do n8n", "número longo", "campo parameters", "campo credentials", "campo webhookId"]) {
      expect(achados, tipo).toContain(tipo);
    }
  });

  it("carregarFluxos devolve os 5, do mais simples ao mais complexo", () => {
    const f = carregarFluxos();
    expect(f.map((x) => x.slug)).toEqual([
      "transcritor-de-audio",
      "agente-producao-teares",
      "gateway-producao-teares",
      "pcp-no-asana",
      "lina-atendimento-whatsapp",
    ]);
    for (let i = 1; i < f.length; i++) expect(f[i].nos.length).toBeGreaterThanOrEqual(f[i - 1].nos.length);
  });

  it("cada fluxo aponta uma entrada publicada do diário de obra", () => {
    const prs = readdirSync(join(raiz, "src", "content", "prs")).map((n) => Number(n.slice(0, 3)));
    for (const f of carregarFluxos()) expect(prs, f.slug).toContain(f.pr);
  });
});

describe("fluxos do Explorador: geometria", () => {
  it("a caixa do canvas cobre todos os nós com margem", () => {
    const c = caixaDoCanvas([
      { x: 0, y: 0 },
      { x: 400, y: 200 },
    ]);
    expect(c.largura).toBeGreaterThan(400);
    expect(c.altura).toBeGreaterThan(200);
  });

  it("ligação de fluxo sai da direita da origem e chega à esquerda do destino", () => {
    const d = caminhoLigacao({ x: 0, y: 0 }, { x: 300, y: 0 }, "fluxo");
    expect(d.startsWith("M")).toBe(true);
    expect(d).toContain("C");
  });

  it("rótulo longo quebra em linhas curtas, sem perder palavras", () => {
    const linhas = linhasDoRotulo("Apaga a versão antiga no Asana");
    expect(linhas.length).toBeGreaterThan(1);
    expect(linhas.join(" ")).toBe("Apaga a versão antiga no Asana");
    for (const l of linhas) expect(l.length).toBeLessThanOrEqual(18);
  });
});
