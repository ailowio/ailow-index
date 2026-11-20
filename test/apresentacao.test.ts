import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { apresentacao, marcaVideo, type VideoPitch } from "../src/data/apresentacao";

const raiz = join(import.meta.dirname, "..");
const LIMITE_FOTO = 30 * 1024;
const HOSTS = new Set(["www.linkedin.com", "linkedin.com", "www.instagram.com", "instagram.com", "github.com"]);

const fake: VideoPitch = {
  mp4: "/apresentacao/pitch.mp4",
  poster: "/apresentacao/pitch.webp",
  vtt: "/apresentacao/pitch.vtt",
  largura: 1280,
  altura: 720,
};

describe("/apresentacao: dados", () => {
  it("a saudação é exatamente a combinada", () => {
    expect(apresentacao.saudacao).toBe("Muito prazer, meu nome é Pedro. Segue meu trabalho abaixo; fico à disposição.");
    expect(apresentacao.saudacao).not.toMatch(/entre em contato/i);
  });

  it("as duas imagens do avatar existem e têm até 30 KB", () => {
    for (const f of [apresentacao.pessoa.fotoPequena, apresentacao.pessoa.fotoGrande]) {
      const p = join(raiz, "public", f.src);
      expect(existsSync(p), f.src).toBe(true);
      expect(statSync(p).size, f.src).toBeLessThanOrEqual(LIMITE_FOTO);
    }
  });

  it("o cargo é o confirmado no /pedro", () => {
    expect(apresentacao.pessoa.cargo).toBe("Produtos Digitais e Operações");
    const pedro = readFileSync(join(raiz, "src", "pages", "pedro", "index.astro"), "utf8");
    expect(pedro).toContain(apresentacao.pessoa.cargo);
  });

  // F0 (2026-11-20): o Pedro autorizou o WhatsApp. Ele vem só de src/config/contato.ts (fonte única);
  // as redes continuam só nos hosts permitidos; telefone cru (tel:) e e-mail (mailto:, domínio sem MX) seguem fora.
  it("contatos: redes só nos hosts permitidos; WhatsApp só pela fonte única; nenhum tel: ou mailto:", () => {
    expect(apresentacao.contatos.map((c) => c.id)).toEqual(["linkedin", "instagram", "github"]);
    for (const c of apresentacao.contatos) {
      const u = new URL(c.href);
      expect(u.protocol).toBe("https:");
      expect(HOSTS.has(u.hostname), c.href).toBe(true);
    }
    const tudo = JSON.stringify(apresentacao) + readFileSync(join(raiz, "src", "pages", "apresentacao.astro"), "utf8");
    expect(tudo).not.toMatch(/tel:|mailto:|wa\.me|\d{10,}/i);
  });

  it("os 5 links do caminho são internos", () => {
    // V07 · 2026-11-20 · ADR 007 item 5: o link de entrevistas aponta para /na-tv (a rota antiga responde 301).
    expect(apresentacao.caminho.map((c) => c.href)).toEqual(["/pedro", "/na-tv", "/sobre", "/pulse", "/cloud"]);
  });

  it("vídeo configurado aponta para arquivos que existem em public/ (null = seção ausente)", () => {
    const v = apresentacao.video;
    if (v === null) return;
    for (const caminho of [v.mp4, v.poster, v.vtt]) {
      expect(existsSync(join(raiz, "public", caminho.replace(/^\//, ""))), caminho).toBe(true);
    }
  });
});

describe("marcaVideo", () => {
  it("video null não gera nenhum <video>", () => {
    expect(marcaVideo(null)).toBe("");
  });

  it("vídeo preenchido: preload none, poster, controls, playsinline e track de legenda", () => {
    const html = marcaVideo(fake);
    expect(html).toContain('<video preload="none"');
    expect(html).toContain('poster="/apresentacao/pitch.webp"');
    expect(html).toContain("controls");
    expect(html).toContain("playsinline");
    expect(html).toContain('<source src="/apresentacao/pitch.mp4" type="video/mp4"');
    expect(html).toContain('<track kind="captions" src="/apresentacao/pitch.vtt"');
    expect(html).toContain('width="1280"');
    expect(html).toContain('height="720"');
    expect(html).not.toMatch(/autoplay/i);
  });

  it("escapa aspas nos caminhos", () => {
    const html = marcaVideo({ ...fake, poster: '/x" onerror="alert(1)' });
    expect(html).not.toContain('onerror="alert');
  });
});
