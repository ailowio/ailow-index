import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EXTENSOES_PERMITIDAS, TETOS, esquemaSite } from "../../src/midia/pacote";
import { importarPacote, validarPacote } from "../../src/midia/validar";

/**
 * V05 · ADR 008: o importador recusa inteiro todo pacote fora do contrato.
 * Os pacotes são sintéticos (test/fixtures/midia); os casos ruins são montados em pasta temporária.
 */
const fixtures = resolve(import.meta.dirname, "..", "fixtures", "midia");
let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "midia-"));
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

/** Copia um fixture para uma pasta temporária com o nome do slug e devolve o caminho. */
function copiar(fixture: string, slug = fixture): string {
  const destino = join(tmp, "origem", slug);
  cpSync(join(fixtures, fixture), destino, { recursive: true });
  return destino;
}
const lerSite = (pasta: string) => JSON.parse(readFileSync(join(pasta, "site.json"), "utf8"));
const gravarSite = (pasta: string, site: unknown) =>
  writeFileSync(join(pasta, "site.json"), JSON.stringify(site, null, 2));
const textos = (r: { erros: string[] }) => r.erros.join(" | ");

describe("contrato do pacote (ADR 008): o que passa", () => {
  it("aceita o pacote com vídeo, pôster, legenda, capítulos e og", () => {
    const r = validarPacote(copiar("valido-video"));
    expect(r.erros).toEqual([]);
    expect(r.site?.slug).toBe("valido-video");
  });

  it("aceita a entrevista longa só com youtube_id e pôster (sem vídeo no pacote)", () => {
    const r = validarPacote(copiar("valido-youtube"));
    expect(r.erros).toEqual([]);
  });

  it("os tetos são os do ADR 005/008 (leitura estrita: MB = 1.000.000 bytes)", () => {
    expect(TETOS).toEqual({
      videoBytes: 8_000_000,
      videoSegundos: 60,
      posterBytes: 80_000,
      ogBytes: 200_000,
    });
    expect([...EXTENSOES_PERMITIDAS].sort()).toEqual([".json", ".mp4", ".png", ".vtt", ".webp"]);
  });
});

describe("canários: pacote fora do contrato é recusado (L-0006)", () => {
  it("vídeo acima do teto de 8 MB", () => {
    const pasta = copiar("valido-video");
    writeFileSync(join(pasta, "video-720p.mp4"), Buffer.concat([readFileSync(join(pasta, "video-720p.mp4")), Buffer.alloc(TETOS.videoBytes)]));
    expect(textos(validarPacote(pasta))).toMatch(/video-720p\.mp4.*teto/);
  });

  it("pôster acima de 80 KB e og acima de 200 KB", () => {
    const pasta = copiar("valido-video");
    const poster = readFileSync(join(pasta, "poster.webp"));
    writeFileSync(join(pasta, "poster.webp"), Buffer.concat([poster, Buffer.alloc(TETOS.posterBytes)]));
    const og = readFileSync(join(pasta, "og-1200x630.png"));
    writeFileSync(join(pasta, "og-1200x630.png"), Buffer.concat([og, Buffer.alloc(TETOS.ogBytes)]));
    const t = textos(validarPacote(pasta));
    expect(t).toMatch(/poster\.webp.*teto/);
    expect(t).toMatch(/og-1200x630\.png.*teto/);
  });

  it("duração declarada acima de 60 s para vídeo hospedado", () => {
    const pasta = copiar("valido-video");
    gravarSite(pasta, { ...lerSite(pasta), duracao_s: 61 });
    expect(textos(validarPacote(pasta))).toMatch(/duracao_s/);
  });

  it("vídeo sem legenda.vtt", () => {
    const pasta = copiar("valido-video");
    rmSync(join(pasta, "legenda.vtt"));
    expect(textos(validarPacote(pasta))).toMatch(/legenda\.vtt.*obrigat/);
  });

  it("extensão fora da lista de permissões (.exe, .mov, .html) e arquivo desconhecido", () => {
    for (const nome of ["instalador.exe", "bruto.mov", "pagina.html", "extra.json"]) {
      const pasta = copiar("valido-video");
      writeFileSync(join(pasta, nome), "x");
      expect(textos(validarPacote(pasta)), nome).toMatch(/não permitida|fora do contrato/);
    }
  });

  it("subpasta dentro do pacote", () => {
    const pasta = copiar("valido-video");
    mkdirSync(join(pasta, "bruto"));
    expect(textos(validarPacote(pasta))).toMatch(/bruto/);
  });

  it("termo bloqueado no site.json (padrão estrutural) e na legenda", () => {
    // IP da faixa de documentação RFC 5737, montado em tempo de execução (gitleaks).
    const ip = ["203", "0", "113", "10"].join(".");
    const a = copiar("valido-video");
    gravarSite(a, { ...lerSite(a), titulo: `Servidor em ${ip}` });
    expect(textos(validarPacote(a))).toMatch(/site\.json.*endereço IPv4/);

    const b = copiar("valido-video");
    writeFileSync(join(b, "legenda.vtt"), `WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nacesse ilo.com.br\n`);
    expect(textos(validarPacote(b))).toMatch(/legenda\.vtt.*grafia ILO/);
  });

  it("termo da lista local (nome de cliente) no site.json, sem repetir o termo na mensagem", () => {
    const pasta = copiar("valido-video");
    gravarSite(pasta, { ...lerSite(pasta), titulo: "Visita ao Cliente Fictício" });
    const t = textos(validarPacote(pasta, { termosLocais: ["cliente ficticio"] }));
    expect(t).toMatch(/termo bloqueado/);
    expect(t.toLowerCase()).not.toContain("fictício");
  });

  it("arquivo com extensão certa e conteúdo errado (cabeçalho)", () => {
    const pasta = copiar("valido-video");
    writeFileSync(join(pasta, "video-720p.mp4"), "isto não é um mp4");
    writeFileSync(join(pasta, "poster.webp"), "nem um webp");
    const t = textos(validarPacote(pasta));
    expect(t).toMatch(/video-720p\.mp4.*cabeçalho/);
    expect(t).toMatch(/poster\.webp.*cabeçalho/);
  });

  it("slug diferente do nome da pasta, aprovação por outra pessoa e data impossível", () => {
    const pasta = copiar("valido-video", "outro-nome");
    expect(textos(validarPacote(pasta))).toMatch(/slug.*pasta/);

    const b = copiar("valido-video");
    gravarSite(b, { ...lerSite(b), aprovado_por: "Alguém", data: "2026-02-30" });
    const t = textos(validarPacote(b));
    expect(t).toMatch(/aprovado_por/);
    expect(t).toMatch(/data/);
  });

  it("vídeo hospedado junto com youtube_id, ou entrevista longa sem youtube_id", () => {
    const a = copiar("valido-video");
    gravarSite(a, { ...lerSite(a), youtube_id: "AAAAAAAAAAA" });
    expect(textos(validarPacote(a))).toMatch(/youtube_id/);

    const b = copiar("valido-youtube");
    const { youtube_id: _, ...semId } = lerSite(b);
    gravarSite(b, semId);
    expect(textos(validarPacote(b))).toMatch(/youtube_id/);
  });

  it("campo desconhecido no site.json e JSON quebrado", () => {
    const a = copiar("valido-video");
    gravarSite(a, { ...lerSite(a), preco: "R$ 1" });
    expect(textos(validarPacote(a))).toMatch(/preco/);

    const b = copiar("valido-video");
    writeFileSync(join(b, "site.json"), "{ quebrado");
    expect(textos(validarPacote(b))).toMatch(/site\.json.*JSON/);
  });

  it("capítulo além da duração e fato mal formado", () => {
    const pasta = copiar("valido-video");
    gravarSite(pasta, { ...lerSite(pasta), fatos: ["80"], capitulos: [{ t: 99, pergunta: "Tarde demais" }] });
    const t = textos(validarPacote(pasta));
    expect(t).toMatch(/fatos/);
    expect(t).toMatch(/capitulos/);
  });
});

describe("esquema do site.json", () => {
  const base = lerSite(join(fixtures, "valido-video"));
  it("exige todos os campos obrigatórios", () => {
    for (const campo of ["slug", "titulo", "tipo", "duracao_s", "data", "aprovado_por", "aprovado_em", "fatos", "selo_ia"]) {
      const { [campo]: _, ...resto } = base;
      expect(esquemaSite.safeParse(resto).success, campo).toBe(false);
    }
  });
});

describe("importação: tudo ou nada", () => {
  it("copia o pacote válido para <destino>/<slug>/ com os mesmos bytes", () => {
    const origem = copiar("valido-video");
    const destino = join(tmp, "public", "midia");
    const r = importarPacote(origem, { destino });
    expect(r.erros).toEqual([]);
    for (const nome of ["site.json", "video-720p.mp4", "poster.webp", "legenda.vtt", "capitulos.vtt", "og-1200x630.png"]) {
      expect(readFileSync(join(destino, "valido-video", nome)).equals(readFileSync(join(origem, nome))), nome).toBe(true);
    }
  });

  it("pacote recusado não deixa nada no destino (nem pasta parcial)", () => {
    const origem = copiar("valido-video");
    rmSync(join(origem, "legenda.vtt"));
    const destino = join(tmp, "public", "midia");
    const r = importarPacote(origem, { destino });
    expect(r.erros.length).toBeGreaterThan(0);
    expect(existsSync(join(destino, "valido-video"))).toBe(false);
    expect(existsSync(destino) ? readdirNomes(destino) : []).toEqual([]);
  });

  it("não sobrescreve um slug já importado sem substituir: true", () => {
    const origem = copiar("valido-video");
    const destino = join(tmp, "public", "midia");
    expect(importarPacote(origem, { destino }).erros).toEqual([]);
    expect(textos(importarPacote(origem, { destino }))).toMatch(/já existe/);
    expect(importarPacote(origem, { destino, substituir: true }).erros).toEqual([]);
  });

  it("pasta inexistente é erro, não exceção", () => {
    expect(textos(importarPacote(join(tmp, "nao-existe"), { destino: join(tmp, "d") }))).toMatch(/não encontrada/);
  });
});

const readdirNomes = (dir: string): string[] => readdirSync(dir);
