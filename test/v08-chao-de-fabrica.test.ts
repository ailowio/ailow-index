import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APPS, SECOES, appPorId } from "../src/config/apps";
import { ROTAS_INDEXAVEIS } from "../src/config/indexacao";
import {
  arquivosEpisodio,
  EPISODIOS,
  ETAPAS_RELATORIO,
  FRASES_PROIBIDAS,
  frasesProibidas,
  TOPO,
  textoPublico,
} from "../src/data/chao-de-fabrica";

/**
 * V08 (2026-11-20; ADR 007 item 5, ADR 006, ADR 005): /chao-de-fabrica, a série episódio por episódio.
 * #1 e #2 com os vídeos dos pacotes da bancada (V06); #3 como relatório de campo em texto. Cada episódio liga às
 * entradas do Diário de obra. O que a colheita de IoT contradiz (a implantação "em todas as máquinas" da #081 e o
 * aceite da v1.9 da #080) fica como "em validação", e as frases fortes são reprovadas aqui (com canário).
 */

const raiz = join(import.meta.dirname, "..");
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const prs = join(raiz, "src", "content", "prs");

function entrada(n: number): string {
  const nome = readdirSync(prs).find((f) => f.startsWith(`${String(n).padStart(3, "0")}-`));
  if (!nome) throw new Error(`#${n} não existe no feed`);
  return readFileSync(join(prs, nome), "utf8");
}

const pagina = () => ler("src/pages/chao-de-fabrica.astro");

describe("/chao-de-fabrica: a série", () => {
  it("3 episódios, em ordem: #1 Dois quadros na parede, #2 O sinal chegou, #3 Firmware v1.9 (sem #4)", () => {
    expect(EPISODIOS.map((e) => [e.numero, e.titulo])).toEqual([
      [1, "Dois quadros na parede"],
      [2, "O sinal chegou"],
      [3, "Firmware v1.9"],
    ]);
    const datas = EPISODIOS.map((e) => e.data);
    expect(datas).toEqual([...datas].sort());
    expect(textoPublico() + pagina()).not.toMatch(/#\s?4\b|epis[oó]dio\s+(#\s?)?4|quatro epis/i);
  });

  it("#1 e #2 são os pacotes importados (mp4, pôster, .vtt; site.json do tipo episódio, mesmo título, duração e selo)", () => {
    for (const e of EPISODIOS.slice(0, 2)) {
      expect(e.video, `#${e.numero}`).not.toBeNull();
      const v = e.video as NonNullable<typeof e.video>;
      for (const c of Object.values(arquivosEpisodio(v.pacote))) {
        expect(existsSync(join(raiz, "public", c)), c).toBe(true);
      }
      const site = JSON.parse(ler(`public/midia/${v.pacote}/site.json`));
      expect(site.tipo).toBe("episodio");
      expect(site.slug).toBe(v.pacote);
      expect(site.titulo.toLowerCase()).toContain(e.titulo.toLowerCase());
      expect(v.duracaoS).toBe(site.duracao_s);
      expect(v.seloIa).toBe(site.selo_ia);
    }
    expect(EPISODIOS.map((e) => e.video?.pacote ?? null)).toEqual(["chao-1-dois-quadros", "chao-2-sinal-chegou", null]);
  });

  it("os dois vídeos têm selo de IA, e a página mostra 'voz gerada por IA'", () => {
    for (const e of EPISODIOS.slice(0, 2)) expect(e.video?.seloIa).toBe(true);
    expect(pagina()).toMatch(/voz gerada por IA/);
  });

  it("#3 não tem vídeo: é um relatório de campo com as 5 etapas, em ordem", () => {
    const e3 = EPISODIOS[2];
    expect(e3.video).toBeNull();
    expect(ETAPAS_RELATORIO).toEqual(["Sintoma", "Hipótese", "O que era", "Decisão", "Estado"]);
    expect(e3.relatorio?.map((r) => r.etapa)).toEqual([...ETAPAS_RELATORIO]);
    for (const r of e3.relatorio ?? []) expect(r.texto.length, r.etapa).toBeGreaterThan(20);
    for (const e of EPISODIOS.slice(0, 2)) expect(e.relatorio).toBeUndefined();
  });
});

describe("/chao-de-fabrica: fatos (ADR 006: o site é a fonte)", () => {
  it("cada episódio cita entradas confirmadas do Diário de obra: #081 nos dois vídeos, #080 no relatório", () => {
    for (const e of EPISODIOS) {
      expect(e.fatos.length, `#${e.numero}`).toBeGreaterThan(0);
      for (const n of e.fatos) expect(entrada(n), `#${n}`).toMatch(/^verificacao:\s*confirmado/m);
    }
    expect(EPISODIOS[0].fatos).toContain(81);
    expect(EPISODIOS[1].fatos).toContain(81);
    expect(EPISODIOS[2].fatos).toContain(80);
  });

  it("mesma data nos dois canais: #1 em 10/11/2026 (lote da #081), #2 no dia seguinte (o vídeo diz 'ontem'), #3 em 18/11/2026 (#080)", () => {
    expect(EPISODIOS[0].data).toBe("2026-11-10");
    expect(entrada(81)).toContain("10/11/2026");
    const um = new Date(`${EPISODIOS[0].data}T12:00:00Z`).getTime();
    const dois = new Date(`${EPISODIOS[1].data}T12:00:00Z`).getTime();
    expect(dois - um).toBe(24 * 3600 * 1000);
    expect(ler("public/midia/chao-2-sinal-chegou/legenda.vtt")).toMatch(/Ontem os quadros/);
    expect(EPISODIOS[2].data).toBe("2026-11-18");
    expect(entrada(80)).toContain("18 de novembro de 2026");
  });

  it("todo número do texto de um episódio está numa entrada citada por ele ou na legenda do próprio vídeo", () => {
    // Da legenda vale só a fala (os tempos "00:10.030" não contam); o número tem de aparecer inteiro (não "3" de "2026").
    const fala = (vtt: string) =>
      vtt
        .split(/\r?\n/)
        .filter((l) => l.trim() && !l.includes("-->") && !l.startsWith("WEBVTT"))
        .join(" ");
    const inteiro = (n: string) => new RegExp(`(^|[^\\d.,])${n.replace(/[.,]/g, "\\$&")}($|[^\\d])`);
    for (const e of EPISODIOS) {
      const fontes =
        e.fatos.map(entrada).join("\n") + (e.video ? fala(ler(`public/midia/${e.video.pacote}/legenda.vtt`)) : "");
      const texto = [e.resumo, ...e.estado.map((s) => s.texto), ...(e.relatorio ?? []).map((r) => r.texto)].join(" ");
      const numeros = texto.match(/\d+(?:[.,]\d+)?/g) ?? [];
      for (const n of numeros) expect(fontes, `#${e.numero}: "${n}"`).toMatch(inteiro(n));
    }
  });

  it("o que a colheita contradiz fica 'em validação': a implantação (#2, #081) e a v1.9 (#3, #080)", () => {
    const emValidacao = (i: number) => EPISODIOS[i].estado.filter((s) => s.tipo === "em-validacao");
    expect(emValidacao(1).length).toBeGreaterThan(0);
    expect(emValidacao(1).some((s) => s.fato === 81)).toBe(true);
    expect(emValidacao(2).length).toBeGreaterThan(0);
    expect(emValidacao(2).some((s) => s.fato === 80)).toBe(true);
    const estado3 = EPISODIOS[2].relatorio?.find((r) => r.etapa === "Estado")?.texto ?? "";
    expect(estado3).toMatch(/em validação/i);
  });

  it("nenhuma frase forte que a colheita contradiz (todas as máquinas, concluída, v1.9 validada/aprovada/aceita, resolvido…)", () => {
    expect(frasesProibidas(textoPublico() + pagina())).toEqual([]);
  });

  it("CANÁRIO: o detector reprova o texto atual da #081 e as frases fortes sobre a v1.9", () => {
    // V11 · 2026-11-20 · texto antigo da #081 preservado como canário (a entrada viva foi corrigida na V11)
    const corpo081 =
      "Em 18 de novembro de 2026, todas as máquinas da fábrica estão com sensores, com as caixas instaladas e rodando: a implantação está concluída, separada do MVP desligado em agosto. O firmware v1.9 dos gateways está em validação em campo (ver o item sobre ele). Próximo passo: atualizar a plataforma de monitoramento.";
    expect(frasesProibidas(corpo081).length).toBeGreaterThan(0);
    for (const s of [
      "Todas as máquinas da fábrica estão rodando.",
      "A implantação está concluída.",
      "A v1.9 foi validada em campo.",
      "Firmware v1.9 aprovado.",
      "O aceite da v1.9 saiu.",
      "Problema resolvido.",
      "Contagem 100% certa.",
      "Manutenção preditiva na fábrica.",
      "O episódio sai em breve.",
    ]) {
      expect(frasesProibidas(s), s).not.toEqual([]);
    }
    expect(FRASES_PROIBIDAS.length).toBeGreaterThanOrEqual(8);
  });

  it("nada de dado sensível: IP, tópico MQTT, porta, nome de máquina de cliente, grafia ilo.", () => {
    const tudo = textoPublico() + pagina();
    expect(tudo).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b|mqtt:\/\/|:\d{4,5}\b|\bilo\.|gw0\d|urdideira|ponteadeira|guilhotina/i);
    expect(JSON.stringify(TOPO).length).toBeGreaterThan(0);
  });
});

describe("/chao-de-fabrica: rota e navegação (ADR 007 item 5)", () => {
  it("o selo da página é uma seção (não entra na grade de 6 apps da home)", () => {
    // V12 · 2026-11-20 · ADR 007 item 5: o Vem aí entra como segunda seção (rota nova, fora da grade da home).
    // V14 · 2026-11-20 · ADR 007 item 5: IA no seu negócio entra como terceira seção (rota nova, fora da grade da home).
    // V16 · 2026-11-24 · plano V16: Como é feito entra como quarta seção (rota nova, fora da grade da home).
    expect(SECOES.map((s) => s.id)).toEqual(["chao-de-fabrica", "vem-ai", "ia-no-seu-negocio", "como-e-feito"]);
    expect(appPorId("chao-de-fabrica").rota).toBe("/chao-de-fabrica");
    expect(APPS.map((a) => a.id)).not.toContain("chao-de-fabrica");
  });

  it("está no sitemap e tem orçamento de peso explícito (JS 10 KiB, peso 150 KiB)", () => {
    expect(ROTAS_INDEXAVEIS).toContain("/chao-de-fabrica/");
    const orc = JSON.parse(ler("scripts/orcamentos-peso.json"));
    expect(orc.rotas["/chao-de-fabrica"]).toEqual({ jsGzKB: 10, pesoGzKB: 150 });
  });

  it("o Diário de obra (/pedro) e a /na-tv levam ao Chão de Fábrica", () => {
    expect(ler("src/pages/pedro/index.astro")).toContain('href="/chao-de-fabrica"');
    expect(ler("src/pages/na-tv.astro")).toContain('href="/chao-de-fabrica"');
  });
});
