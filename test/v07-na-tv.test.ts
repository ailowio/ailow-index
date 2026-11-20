import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { ligarFachadas } from "../src/components/fachada-youtube.cliente";
import { ID_YOUTUBE, marcaFachadaYoutube, urlEmbed } from "../src/components/fachada-youtube";
import { APPS } from "../src/config/apps";
import { ROTAS_INDEXAVEIS } from "../src/config/indexacao";
import { entrevistas } from "../src/data/entrevistas";
import { arquivosTeaser, DEGRAUS, entrevistaDoDegrau, TOPO, tempoTexto } from "../src/data/na-tv";

/**
 * V07 (2026-11-20; ADR 007 item 5, ADR 005): /na-tv. O arco UFC -> Record -> afiliada Globo como escada,
 * os teasers P1 e P2 nos degraus de onde a fala saiu, chips de pergunta com o tempo tirado do .vtt, a
 * fachada do YouTube (só com id) e o 301 de /pedro/entrevistas.
 */

const raiz = join(import.meta.dirname, "..");
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const BLOQUEADOS = /cl[aá]udia|buhamra|viviane|bastos/i;

interface Cue {
  inicio: number;
  texto: string;
}

/** Cues de um WebVTT simples (mm:ss.mmm ou hh:mm:ss.mmm). */
function cues(vtt: string): Cue[] {
  const seg = (t: string) => t.split(":").reduce((acc, p) => acc * 60 + Number(p), 0);
  const blocos = vtt.replace(/\r/g, "").split(/\n\n+/);
  const out: Cue[] = [];
  for (const b of blocos) {
    const linhas = b.split("\n");
    const i = linhas.findIndex((l) => l.includes("-->"));
    if (i < 0) continue;
    out.push({ inicio: seg(linhas[i].split("-->")[0].trim()), texto: linhas.slice(i + 1).join(" ").trim() });
  }
  return out;
}

describe("/na-tv: fatos e escada", () => {
  it("3 degraus, um por entrevista publicada, em ordem de subida (mais antigo primeiro)", () => {
    expect(DEGRAUS.map((d) => d.feed)).toEqual([12, 14, 37]);
    expect([...DEGRAUS.map((d) => d.feed)].sort((a, b) => a - b)).toEqual(
      entrevistas.map((e) => e.feed).sort((a, b) => a - b),
    );
    const datas = DEGRAUS.map((d) => entrevistaDoDegrau(d).data);
    expect(datas).toEqual([...datas].sort());
  });

  it("cada degrau cita uma entrada confirmada do Diário de obra", () => {
    const prs = join(raiz, "src", "content", "prs");
    for (const d of DEGRAUS) {
      const n = String(d.feed).padStart(3, "0");
      const nome = readdirSync(prs).find((f) => f.startsWith(`${n}-`));
      expect(nome, `#${n}`).toBeDefined();
      expect(readFileSync(join(prs, nome as string), "utf8"), `#${n}`).toMatch(/^verificacao:\s*confirmado/m);
    }
  });

  it("textos sem nome de entrevistador, sem número inventado e sem 'em breve'", () => {
    const pagina = ler("src/pages/na-tv.astro");
    const tudo = JSON.stringify({ DEGRAUS, TOPO }) + pagina;
    expect(tudo).not.toMatch(BLOQUEADOS);
    expect(tudo).not.toMatch(/em breve|R\$|\bmil\b|milh/i);
  });

  it("nenhuma foto de emissora (logo/bug) entra na página: só a tarja em texto", () => {
    const pagina = ler("src/pages/na-tv.astro");
    expect(pagina).not.toMatch(/\/entrevistas\/|e\.imagem|<img/);
  });

  it("o detector de nome reprova (canário permanente)", () => {
    expect("com a profa. Cláudia").toMatch(BLOQUEADOS);
  });
});

describe("/na-tv: teasers e chips", () => {
  const teasers = DEGRAUS.flatMap((d) => d.teasers.map((t) => ({ degrau: d.feed, t })));

  it("P1 e P2 no degrau da UFC (o selo do pôster é da UFC); P3 retirado; os outros degraus sem vídeo", () => {
    expect(teasers.map((x) => [x.degrau, x.t.slug])).toEqual([
      [12, "teaser-p1-improvisar-sob-pressao"],
      [12, "teaser-p2-teoria-na-pratica"],
    ]);
    expect(JSON.stringify(DEGRAUS)).not.toMatch(/teaser-p3/);
  });

  it("cada teaser é um pacote importado (mp4, pôster, .vtt e site.json do tipo teaser, título igual)", () => {
    for (const { t } of teasers) {
      for (const c of Object.values(arquivosTeaser(t.slug))) {
        expect(existsSync(join(raiz, "public", c)), c).toBe(true);
      }
      const site = JSON.parse(ler(`public/midia/${t.slug}/site.json`));
      expect(site.tipo).toBe("teaser");
      expect(site.slug).toBe(t.slug);
      expect(site.titulo.startsWith(t.titulo), site.titulo).toBe(true);
    }
  });

  it("cada chip começa EXATAMENTE num cue do .vtt e o texto do cue começa com o trecho", () => {
    for (const { t } of teasers) {
      const lista = cues(ler(`public/midia/${t.slug}/legenda.vtt`));
      const site = JSON.parse(ler(`public/midia/${t.slug}/site.json`));
      expect(t.chips.length).toBeGreaterThanOrEqual(2);
      for (const c of t.chips) {
        const cue = lista.find((x) => Math.abs(x.inicio - c.inicio) < 0.001);
        expect(cue, `${t.slug} @ ${c.inicio}`).toBeDefined();
        expect(cue?.texto.startsWith(c.trecho), `${cue?.texto} x ${c.trecho}`).toBe(true);
        expect(c.inicio).toBeLessThan(site.duracao_s);
        expect(c.pergunta).toMatch(/\?$/);
      }
      const inicios = t.chips.map((c) => c.inicio);
      expect(inicios).toEqual([...inicios].sort((a, b) => a - b));
      expect(new Set(t.chips.map((c) => c.pergunta)).size).toBe(t.chips.length);
    }
  });

  it("CANÁRIO: um tempo fora do .vtt não casa com nenhum cue", () => {
    const lista = cues(ler("public/midia/teaser-p2-teoria-na-pratica/legenda.vtt"));
    expect(lista.find((x) => Math.abs(x.inicio - 15.0) < 0.001)).toBeUndefined();
    expect(lista.find((x) => Math.abs(x.inicio - 15.34) < 0.001)?.texto).toMatch(/^agora/);
  });

  it("tempo do chip em m:ss", () => {
    expect(tempoTexto(0)).toBe("0:00");
    expect(tempoTexto(43.571)).toBe("0:43");
    expect(tempoTexto(75)).toBe("1:15");
  });
});

describe("fachada do YouTube (ADR 005): componente próprio", () => {
  it("sem youtube_id não renderiza nada (nem 'em breve')", () => {
    expect(marcaFachadaYoutube({ youtubeId: null, titulo: "Entrevista" })).toBe("");
  });

  it("com youtube_id: pôster próprio + botão + aviso de privacidade, e NENHUM iframe nem URL do YouTube no HTML", () => {
    const html = marcaFachadaYoutube({ youtubeId: "abcdefghijk", titulo: "Entrevista na UFC" });
    expect(html).toContain('data-youtube="abcdefghijk"');
    expect(html).toMatch(/<button type="button"[^>]*data-youtube-play/);
    expect(html).toContain("Assistir no YouTube");
    expect(html).toMatch(/o Google recebe dados de quem assiste/);
    expect(html).not.toMatch(/<iframe|youtube\.com|youtube-nocookie|ytimg/i);
  });

  it("id fora do formato do YouTube é recusado (não vira atributo)", () => {
    expect(() => marcaFachadaYoutube({ youtubeId: 'x" onclick="a', titulo: "t" })).toThrow();
    expect(ID_YOUTUBE.test("abcdefghijk")).toBe(true);
    expect(ID_YOUTUBE.test("abc")).toBe(false);
  });

  it("o embed é só o youtube-nocookie", () => {
    expect(new URL(urlEmbed("abcdefghijk")).hostname).toBe("www.youtube-nocookie.com");
  });

  it("o iframe só nasce no toque (nenhum antes; um depois, do youtube-nocookie)", () => {
    const criados: { tag: string; src?: string }[] = [];
    let ouvinte: (() => void) | null = null;
    const caixa = {
      dataset: { youtube: "abcdefghijk" },
      replaceChildren: (f: unknown) => criados.push(f as { tag: string }),
    };
    const botao = {
      getAttribute: () => "Assistir no YouTube: Entrevista",
      closest: () => caixa,
      addEventListener: (_: string, fn: () => void) => {
        ouvinte = fn;
      },
    };
    const doc = {
      querySelectorAll: () => [botao],
      createElement: (tag: string) => {
        const el = { tag, src: "", title: "", allow: "", allowFullscreen: false, focus: () => {} };
        return el;
      },
    };
    ligarFachadas(doc as unknown as Document);
    expect(criados).toEqual([]);
    (ouvinte as unknown as () => void)();
    expect(criados).toHaveLength(1);
    expect(criados[0].tag).toBe("iframe");
    expect(new URL(criados[0].src as string).hostname).toBe("www.youtube-nocookie.com");
  });

  it("o script da fachada pesa até 1 KB gzip", () => {
    const fonte = ler("src/components/fachada-youtube.cliente.ts");
    expect(gzipSync(Buffer.from(fonte)).length).toBeLessThanOrEqual(1024);
  });

  it("sem youtube_id em nenhum degrau, a CSP não ganha frame-src (ADR 005 item 4)", () => {
    const ids = DEGRAUS.map((d) => d.youtubeId).filter(Boolean);
    for (const id of ids) expect(ID_YOUTUBE.test(id as string)).toBe(true);
    if (ids.length === 0) expect(ler("ops/web/seguranca.conf")).not.toMatch(/frame-src/);
  });
});

describe("/na-tv: rota, 301 e navegação (ADR 007 item 5)", () => {
  it("a página nova existe e a antiga saiu", () => {
    expect(existsSync(join(raiz, "src/pages/na-tv.astro"))).toBe(true);
    expect(existsSync(join(raiz, "src/pages/pedro/entrevistas.astro"))).toBe(false);
  });

  it("nginx: /pedro/entrevistas (com e sem barra) responde 301 para /na-tv/ com os cabeçalhos de segurança", () => {
    const nginx = ler("ops/web/nginx.conf");
    for (const cab of ["location = /pedro/entrevistas", "location = /pedro/entrevistas/"]) {
      const i = nginx.indexOf(`${cab} {`);
      expect(i, cab).toBeGreaterThan(-1);
      const corpo = nginx.slice(nginx.indexOf("{", i), nginx.indexOf("}", i));
      expect(corpo).toMatch(/return\s+301\s+\/na-tv\/;/);
      expect(corpo).toMatch(/include\s+\/etc\/nginx\/ailow\/seguranca\.conf;/);
    }
  });

  it("build: o Astro gera o redirecionamento (meta refresh) para quem não passa pelo nginx", () => {
    expect(ler("astro.config.mjs")).toMatch(/"\/pedro\/entrevistas":\s*\{\s*status:\s*301,\s*destination:\s*"\/na-tv"\s*\}/);
  });

  it("o ícone de entrevista da home aponta para /na-tv", () => {
    const app = APPS.find((a) => a.id === "entrevistas");
    expect(app?.rota).toBe("/na-tv");
    expect(app?.titulo).toBe("Na TV");
  });

  it("o sitemap tem /na-tv/ e não tem mais /pedro/entrevistas/", () => {
    expect(ROTAS_INDEXAVEIS).toContain("/na-tv/");
    expect(ROTAS_INDEXAVEIS).not.toContain("/pedro/entrevistas/");
  });

  it("orçamento de peso: /na-tv tem o seu e a rota antiga saiu da tabela", () => {
    const orc = JSON.parse(ler("scripts/orcamentos-peso.json"));
    expect(orc.rotas["/na-tv"]).toEqual({ jsGzKB: 10, pesoGzKB: 150 });
    expect(orc.rotas["/pedro/entrevistas"]).toBeUndefined();
  });

  it("nenhum link interno do site aponta para a rota antiga", () => {
    for (const rel of ["src/pages/pedro/index.astro", "src/data/apresentacao.ts", "src/config/apps.ts"]) {
      expect(ler(rel), rel).not.toContain("/pedro/entrevistas");
    }
  });
});
