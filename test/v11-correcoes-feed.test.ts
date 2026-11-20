import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { lintConteudo } from "../src/changelog/bloqueio";
import { carregarTermosLocais } from "../src/changelog/carregar-termos";
import { frasesProibidas } from "../src/data/chao-de-fabrica";
import principal from "./fixtures/v09-feed-main.json";

/**
 * V11 (2026-11-20; ok do orquestrador por delegação do Pedro, 2026-11-18 e 2026-11-20; ADR 002, ADR 006):
 * correções X7-X10 da colheita de IoT no feed. Cada correção só deixa a afirmação mais precisa ou mais fraca, e a
 * prova (arquivo:linha da colheita) fica citada no campo `prova` da entrada. As entradas novas (#083, #084) são
 * candidatas: `verificacao: pendente`, não publicam até a curadoria do Pedro.
 */
const raiz = resolve(import.meta.dirname, "..");
const pasta = join(raiz, "src", "content", "prs");

function entrada(n: number): string {
  const nome = readdirSync(pasta).find((f) => f.startsWith(`${String(n).padStart(3, "0")}-`));
  if (!nome) throw new Error(`#${n} não existe no feed`);
  return readFileSync(join(pasta, nome), "utf8");
}
const campo = (md: string, nome: string) => new RegExp(`^${nome}:\\s*(.*)$`, "m").exec(md)?.[1]?.trim() ?? "";
const corpo = (md: string) => md.split("---").slice(2).join("---");

describe("X7 · #063 firmware v1.8: a data, a quantidade e o que foi gravado", () => {
  const md = entrada(63);
  it("diz 2 de setembro para as 25 entradas e 31 de agosto para o início (17 entradas)", () => {
    expect(corpo(md)).toMatch(/31 de agosto/);
    expect(corpo(md)).toMatch(/17 entradas/);
    expect(corpo(md)).toMatch(/2 de setembro/);
    expect(corpo(md)).toMatch(/25 entradas/);
  });
  it("a v1.8 foi gravada só no gateway 1; o gateway 2 recebeu a v1.7", () => {
    expect(corpo(md)).toMatch(/só no gateway 1/);
    expect(corpo(md)).toMatch(/gateway 2 recebeu a v1\.7/);
    expect(md).not.toMatch(/gravado nas caixas|nas caixas\./);
  });
  it("não diz Modbus (o módulo fala o protocolo próprio da fabricante no barramento)", () => {
    expect(campo(md, "titulo")).not.toMatch(/modbus/i);
    expect(corpo(md)).not.toMatch(/modbus/i);
    expect(campo(md, "ferramentas")).not.toMatch(/modbus/);
    expect(corpo(md)).toMatch(/protocolo próprio/);
  });
  it("cita a prova (arquivo:linha da colheita)", () => {
    expect(campo(md, "prova")).toMatch(/IOT-COLHEITA\.md/);
    expect(campo(md, "prova")).toMatch(/443-452/);
  });
});

describe("X8 · #056: a v1.6 não foi gravada em hardware", () => {
  const md = entrada(56);
  it("diz que foi escrita, mas não gravada; o primeiro MQTT em equipamento foi a v1.7 em bancada", () => {
    expect(corpo(md)).toMatch(/não chegou a ser gravad/);
    expect(corpo(md)).toMatch(/v1\.7/);
    expect(corpo(md)).not.toMatch(/passa a publicar por MQTT/);
  });
  it("cita a prova", () => {
    expect(campo(md, "prova")).toMatch(/IOT-COLHEITA\.md/);
    expect(campo(md, "prova")).toMatch(/453-455/);
  });
});

describe("X9 · #081: implantação em andamento, não concluída", () => {
  const md = entrada(81);
  it("nenhuma frase forte (todas as máquinas, concluída, rodando…) no corpo, no resumo ou no título", () => {
    expect(frasesProibidas(md.replace(/^prova:.*$/m, ""))).toEqual([]);
  });
  it("diz em andamento, em parte das máquinas, com o mapa canal-máquina em conferência", () => {
    expect(corpo(md)).toMatch(/em andamento/);
    expect(corpo(md)).toMatch(/parte das máquinas/);
    expect(corpo(md)).toMatch(/em conferência/);
  });
  it("status_fato = construindo (a bancada diz 'em implantação'); estado = open", () => {
    expect(campo(md, "status_fato")).toBe("construindo");
    expect(campo(md, "estado")).toBe("open");
  });
  it("cita a prova da colheita e o resumo para empresários concorda", () => {
    expect(campo(md, "prova")).toMatch(/IOT-COLHEITA\.md/);
    expect(campo(md, "prova")).toMatch(/456-459/);
    expect(campo(md, "resumo_dono")).toMatch(/em andamento/);
  });
});

describe("X10 · #080: o aceite formal da v1.9 segue pendente", () => {
  const md = entrada(80);
  it("diz em validação e aceite pendente; nunca aceita/validada/aprovada", () => {
    expect(campo(md, "resumo_dono")).toMatch(/em validação/);
    expect(corpo(md)).toMatch(/conferência formal/);
    expect(corpo(md)).toMatch(/pendente/);
    expect(frasesProibidas(md.replace(/^prova:.*$/m, ""))).toEqual([]);
    expect(campo(md, "status_fato")).toBe("testando");
  });
  it("cita a prova", () => {
    expect(campo(md, "prova")).toMatch(/IOT-COLHEITA\.md/);
    expect(campo(md, "prova")).toMatch(/460-463/);
  });
});

describe("entradas novas candidatas: v1.7 no gateway 2 e gravação de campo", () => {
  const numeros = [83, 84];
  it("são #083 e #084 (próximos números livres), pendentes: não publicam", () => {
    for (const n of numeros) {
      const md = entrada(n);
      expect(campo(md, "numero")).toBe(String(n));
      expect(campo(md, "verificacao")).toBe("pendente");
      expect(md).not.toMatch(/^resumo_dono:/m);
      expect(md).not.toMatch(/^status_fato:/m);
    }
  });
  it("têm prova privada que cita a colheita", () => {
    for (const n of numeros) {
      expect(campo(entrada(n), "prova")).toMatch(/privada/);
      expect(campo(entrada(n), "prova")).toMatch(/IOT-COLHEITA\.md/);
    }
  });
  it("o conteúdo diz outubro de 2026 e passa no linter de conteúdo", () => {
    const termos = carregarTermosLocais(raiz);
    for (const n of numeros) {
      expect(corpo(entrada(n))).toMatch(/outubro de 2026/);
      expect(lintConteudo(entrada(n), termos), `#${n}`).toEqual([]);
    }
  });
  it("as publicadas seguem iguais às da main (fixture V09): as novas só somam no total geral", () => {
    const todas = readdirSync(pasta).filter((f) => f.endsWith(".md"));
    const publicadas = todas
      .map((f) => readFileSync(join(pasta, f), "utf8"))
      .filter((md) => campo(md, "verificacao") === "confirmado")
      .map((md) => Number(campo(md, "numero")))
      .sort((a, b) => a - b);
    expect(publicadas).toEqual(principal.publicadas);
    expect(todas).toHaveLength(principal.publicadas.length + 1 + 2);
  });
});

describe("texto visível fora do feed", () => {
  it("o /pulse não diz mais 'instalados em todas as máquinas'", () => {
    const pulse = readFileSync(join(raiz, "src", "pages", "pulse.astro"), "utf8");
    expect(pulse).not.toMatch(/todas as m[aá]quinas/i);
    expect(pulse).toMatch(/em andamento/);
  });
});
