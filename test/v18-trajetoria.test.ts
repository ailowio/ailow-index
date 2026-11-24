import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lintConteudo } from "../src/changelog/bloqueio";
import { carregarTermosLocais } from "../src/changelog/carregar-termos";
import { APPS, appPorId } from "../src/config/apps";
import { ROTAS_INDEXAVEIS } from "../src/config/indexacao";
import { apresentacao } from "../src/data/apresentacao";
import ferramentas from "../src/data/ferramentas.json";
import {
  AUDIO,
  DESTAQUES,
  type EntradaCaminho,
  MARCOS,
  type Marco,
  montarTrajetoria,
  type Parada,
  proibidos,
  rotuloData,
  TOPO,
  textoPublico,
} from "../src/data/trajetoria";

/**
 * V18 (2026-11-23, pedido do Pedro): /trajetoria, a linha do tempo animada pela rolagem. Duas camadas:
 * (a) marcos de vida e de negócio, escritos à mão, cada um com fonte (entrada confirmada do Diário de obra ou marca
 * mm:ss do áudio de 19/11); (b) as ferramentas no caminho, derivadas do feed: cada ferramenta vira chip na entrada
 * em que aparece pela primeira vez. Entrada nova no feed com ferramenta nova = ponto novo, sem editar a página.
 */

const raiz = join(import.meta.dirname, "..");
const pasta = join(raiz, "src", "content", "prs");

interface EntradaMd extends EntradaCaminho {
  verificacao: string;
}

/** Frontmatter mínimo de cada entrada (o mesmo que o build lê pelo content collection). */
function lerEntradas(): EntradaMd[] {
  return readdirSync(pasta)
    .filter((n) => n.endsWith(".md"))
    .map((n) => {
      const md = readFileSync(join(pasta, n), "utf8");
      const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md)?.[1] ?? "";
      const campo = (c: string) => new RegExp(`^${c}:\\s*"?(.*?)"?\\s*$`, "m").exec(fm)?.[1] ?? "";
      const lista = /^ferramentas:\s*\[(.*)\]\s*$/m.exec(fm)?.[1] ?? "";
      return {
        numero: Number(campo("numero")),
        data: campo("data"),
        titulo: campo("titulo"),
        verificacao: campo("verificacao"),
        ferramentas: lista
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      };
    })
    .sort((a, b) => a.numero - b.numero);
}

const TODAS = lerEntradas();
const PUBLICADAS = TODAS.filter((e) => e.verificacao === "confirmado");
const NOMES = new Map(ferramentas.map((f) => [f.id, f.nome]));
/** As labels de ferramenta que o build gera: toda ferramenta com pelo menos uma entrada publicada. */
const SLUGS = new Set(PUBLICADAS.flatMap((e) => e.ferramentas));
const TERMOS = carregarTermosLocais(raiz);

const montar = (marcos: readonly Marco[] = MARCOS, entradas: EntradaCaminho[] = PUBLICADAS) =>
  montarTrajetoria(marcos, entradas, NOMES, SLUGS, TERMOS);
const comMarco = (m: Partial<Marco>) =>
  montar([...MARCOS, { id: "canario", data: "2026-11-20", titulo: "Canário", texto: "Texto do canário.", fonte: { audio: AUDIO, marca: "01:31" }, ...m }]).erros;
const paradas = (): Parada[] => montar().anos.flatMap((a) => a.paradas);
const chave = (d: string) => (d.length === 4 ? `${d}-00` : d);

/** Primeira aparição de cada ferramenta, calculada aqui de forma independente (não reusa o código da página). */
function primeiraAparicao(): Map<number, string[]> {
  const vistas = new Set<string>();
  const mapa = new Map<number, string[]>();
  for (const e of PUBLICADAS) {
    const novas = e.ferramentas.filter((f) => !vistas.has(f));
    for (const f of novas) vistas.add(f);
    if (novas.length > 0) mapa.set(e.numero, novas);
  }
  return mapa;
}

describe("/trajetoria: os marcos escritos à mão", () => {
  it("a trajetória real monta sem erro", () => {
    expect(montar().erros).toEqual([]);
  });

  it("cada marco tem fonte válida: entrada confirmada que existe, ou o áudio de 19/11 com marca mm:ss dentro dos 32:16", () => {
    const publicadas = new Set(PUBLICADAS.map((e) => e.numero));
    for (const m of MARCOS) {
      if ("pr" in m.fonte) {
        expect(publicadas.has(m.fonte.pr), `${m.id}: #${m.fonte.pr}`).toBe(true);
      } else {
        expect(m.fonte.audio, m.id).toBe("2026-11-19");
        expect(m.fonte.marca, m.id).toMatch(/^\d{2}:[0-5]\d$/);
        const [mm = 0, ss = 0] = m.fonte.marca.split(":").map(Number);
        expect(mm * 60 + ss, m.id).toBeLessThanOrEqual(32 * 60 + 16);
      }
    }
  });

  it("os marcos estão em ordem cronológica e cobrem de 2014 à homologação com o banco (19/11/2026)", () => {
    const datas = MARCOS.map((m) => chave(m.data));
    expect(datas).toEqual([...datas].sort());
    expect(MARCOS[0]?.data).toBe("2014");
    expect(MARCOS.at(-1)?.data).toBe("2026-11-19");
    expect(new Set(MARCOS.map((m) => m.id)).size).toBe(MARCOS.length);
  });

  it("o marco que cita uma entrada tem a mesma data dela", () => {
    for (const m of MARCOS) {
      if (!("pr" in m.fonte)) continue;
      const pr = m.fonte.pr;
      const e = PUBLICADAS.find((x) => x.numero === pr);
      expect(e && (m.data.startsWith(e.data) || e.data.startsWith(m.data)), `${m.id} (${m.data}) x #${pr}`).toBe(true);
    }
  });

  it("canários de fonte: #999, entrada pendente (#083), marca fora do formato, outro áudio e data inválida reprovam", () => {
    expect(comMarco({ fonte: { pr: 999 } }).join()).toMatch(/#999/);
    expect(comMarco({ fonte: { pr: 83 } }).join()).toMatch(/#083/);
    expect(comMarco({ fonte: { audio: AUDIO, marca: "1:31" } }).join()).toMatch(/marca/);
    expect(comMarco({ fonte: { audio: AUDIO, marca: "33:00" } }).join()).toMatch(/marca/);
    expect(comMarco({ fonte: { audio: "2026-11-18" as typeof AUDIO, marca: "01:31" } }).join()).toMatch(/áudio/);
    expect(comMarco({ data: "nov/2026" }).join()).toMatch(/data/);
    expect(comMarco({ id: "primeiro-emprego" }).join()).toMatch(/duplicado/);
  });

  it("canário de ordem: um marco fora da ordem cronológica reprova", () => {
    expect(comMarco({ data: "2020" }).join()).toMatch(/ordem/);
  });

  it("canário de data: o marco que cita uma entrada com outra data reprova", () => {
    expect(comMarco({ data: "2026-11-21", fonte: { pr: 57 } }).join()).toMatch(/#057/);
  });
});

describe("/trajetoria: o que nunca entra no texto", () => {
  it("o texto publicado pela página não tem nada da lista proibida", () => {
    expect(proibidos(textoPublico(), TERMOS)).toEqual([]);
    expect(lintConteudo(textoPublico(), TERMOS)).toEqual([]);
  });

  it.each([
    ["valor", "Comprou por R$ 50 mil."],
    ["percentual", "Ganhou 40% de espaço."],
    ["percentual por extenso", "Ganhou quarenta por cento de espaço."],
    ["saúde", "Depois da trombose, entrou na empresa."],
    ["cirurgia", "No mês da cirurgia, começou a v2."],
    ["relacionamento", "Um relacionamento o acordou."],
    ["fase ociosa", "Uma fase ociosa entre 2021 e 2023."],
    ["contas misturadas", "As contas misturadas com as da empresa."],
    ["nome de pessoa", "Com a consultora Fulana, mudou o layout."],
    ["IP", "O servidor 10.0.0.1 subiu."],
    ["grafia errada da marca", "Visite ilo.com.br hoje."],
  ])("canário (%s) reprova", (_motivo, texto) => {
    expect(comMarco({ texto }).length, texto).toBeGreaterThan(0);
  });

  it("o título do marco também passa pela lista", () => {
    expect(comMarco({ titulo: "Compra de R$ 1" }).length).toBeGreaterThan(0);
  });
});

describe("/trajetoria: as ferramentas no caminho, derivadas do feed", () => {
  it("cada ferramenta vira chip na entrada em que aparece pela primeira vez, em ordem de número", () => {
    const esperado = primeiraAparicao();
    const obtido = new Map<number, string[]>();
    for (const p of paradas()) {
      const n = p.tipo === "entrada" ? p.numero : p.fonte.tipo === "pr" ? p.fonte.numero : null;
      if (n !== null && p.chips.length > 0) obtido.set(n, p.chips.map((c) => c.id));
    }
    expect(obtido).toEqual(esperado);
  });

  it("toda ferramenta do feed publicado aparece uma única vez; HeyGen na #071 e ElevenLabs na #082", () => {
    const ids = paradas().flatMap((p) => p.chips.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(SLUGS);
    const onde = (id: string) => paradas().find((p) => p.chips.some((c) => c.id === id));
    const heygen = onde("heygen");
    const elevenlabs = onde("elevenlabs");
    expect(heygen?.tipo === "entrada" && heygen.numero).toBe(71);
    expect(elevenlabs?.tipo === "entrada" && elevenlabs.numero).toBe(82);
    const n8n = onde("n8n");
    expect(n8n?.tipo === "entrada" && n8n.numero).toBe(1);
  });

  it("o chip tem o nome do catálogo e leva à label da ferramenta", () => {
    for (const p of paradas()) {
      for (const c of p.chips) {
        expect(c.nome, c.id).toBe(NOMES.get(c.id));
        expect(c.href, c.id).toBe(`/pedro/label/${c.id}`);
      }
    }
    const semLabel = montarTrajetoria(MARCOS, PUBLICADAS, NOMES, new Set(), TERMOS);
    expect(semLabel.anos.flatMap((a) => a.paradas).flatMap((p) => p.chips).every((c) => c.href === null)).toBe(true);
  });

  it("o contador acumula: cresce de parada em parada e termina no total de ferramentas do feed", () => {
    const ps = paradas();
    for (let i = 1; i < ps.length; i++) {
      const antes = ps[i - 1] as Parada;
      const agora = ps[i] as Parada;
      expect(agora.acumulado).toBe(antes.acumulado + agora.chips.length);
    }
    expect(ps.at(-1)?.acumulado).toBe(SLUGS.size);
    expect(montar().total).toBe(SLUGS.size);
  });

  it("a trajetória continua viva: uma entrada nova com ferramenta nova vira ponto com chip", () => {
    const nova: EntradaCaminho = { numero: 999, data: "2026-12", titulo: "feat(ia): canário", ferramentas: ["vercel", "flutterflow-inexistente"] };
    const t = montarTrajetoria(MARCOS, [...PUBLICADAS, nova], new Map([...NOMES, ["flutterflow-inexistente", "Canário"]]), SLUGS, TERMOS);
    const ultima = t.anos.at(-1)?.paradas.at(-1);
    expect(ultima?.tipo === "entrada" && ultima.numero).toBe(999);
    // vercel já apareceu antes (#027): só a ferramenta inédita vira chip.
    expect(ultima?.chips.map((c) => c.id)).toEqual(["flutterflow-inexistente"]);
  });

  it("os destaques existem, estão confirmados e viram ponto grande com link para a âncora da entrada", () => {
    const publicadas = new Set(PUBLICADAS.map((e) => e.numero));
    for (const n of DESTAQUES) expect(publicadas.has(n), `#${n}`).toBe(true);
    const grandes = paradas().filter((p) => p.tipo === "entrada" && p.destaque);
    expect(grandes.map((p) => (p.tipo === "entrada" ? p.numero : 0))).toEqual([...DESTAQUES].sort((a, b) => a - b));
    for (const p of paradas()) {
      if (p.tipo === "entrada") expect(p.href).toBe(`/pedro#pr-${String(p.numero).padStart(3, "0")}`);
    }
    expect(montarTrajetoria(MARCOS, PUBLICADAS.filter((e) => e.numero !== 71), NOMES, SLUGS, TERMOS).erros.join()).toMatch(/#071/);
  });

  it("entrada sem ferramenta nova e fora dos destaques não vira ponto; a citada por um marco entra no marco", () => {
    const numeros = paradas().flatMap((p) => (p.tipo === "entrada" ? [p.numero] : []));
    expect(numeros).not.toContain(9);
    expect(numeros).not.toContain(57);
    const v2 = paradas().find((p) => p.tipo === "marco" && p.fonte.tipo === "pr" && p.fonte.numero === 57);
    expect(v2?.chips.map((c) => c.id)).toEqual(primeiraAparicao().get(57));
  });

  it("todas as paradas, de todos os anos, estão em ordem cronológica; o ano agrupa", () => {
    const t = montar();
    const anos = t.anos.map((a) => a.ano);
    expect(anos).toEqual([...anos].sort());
    for (const a of t.anos) for (const p of a.paradas) expect(p.data.slice(0, 4)).toBe(a.ano);
    const datas = paradas().map((p) => chave(p.data));
    expect(datas).toEqual([...datas].sort());
  });

  it("rótulo de data: ano, mês abreviado e dia", () => {
    expect(rotuloData("2014")).toBe("2014");
    expect(rotuloData("2025-02")).toBe("fev 2025");
    expect(rotuloData("2026-11-19")).toBe("19 nov 2026");
  });
});

describe("/trajetoria: rota, tile e links", () => {
  it("é indexável e tem o tile na home (o quadradinho pedido pelo Pedro em 23/11)", () => {
    expect(ROTAS_INDEXAVEIS).toContain("/trajetoria/");
    const app = APPS.find((a) => a.id === "trajetoria");
    expect(app?.rota).toBe("/trajetoria");
    expect(appPorId("trajetoria").titulo).toBe("Trajetória");
  });

  it("a /apresentacao (e o /bio, que usa o mesmo componente) leva à trajetória", () => {
    expect(apresentacao.caminho.map((c) => c.href)).toContain("/trajetoria");
  });

  it("o /sobre e o Diário de obra têm o link", () => {
    for (const p of ["src/pages/sobre.astro", "src/pages/pedro/index.astro"]) {
      expect(readFileSync(join(raiz, p), "utf8"), p).toContain('href="/trajetoria"');
    }
  });

  it("o script da rota não sequestra a rolagem nem o toque", () => {
    const js = readFileSync(join(raiz, "src", "scripts", "trajetoria.ts"), "utf8");
    expect(js).not.toMatch(/wheel|touchmove|touchstart|preventDefault|scrollTo|scroll-snap/);
    const css = readFileSync(join(raiz, "src", "styles", "trajetoria.css"), "utf8");
    expect(css).not.toMatch(/scroll-snap-type/);
  });

  it("o topo começa pelo que a página é, sem promessa", () => {
    expect(TOPO.titulo.length).toBeGreaterThan(0);
    expect(textoPublico()).not.toMatch(/em breve|lançamento|garant/i);
  });
});
