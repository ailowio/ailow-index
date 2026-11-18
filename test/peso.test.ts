import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const raiz = resolve(import.meta.dirname, "..");
const script = join(raiz, "scripts", "peso.mjs");
const orcamentoReal = JSON.parse(readFileSync(join(raiz, "scripts", "orcamentos-peso.json"), "utf8"));

let tmp = "";
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = "";
});

function montar(arquivos: Record<string, string | Buffer>, orcamentos: object) {
  tmp = mkdtempSync(join(tmpdir(), "peso-"));
  const dist = join(tmp, "dist");
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    const p = join(dist, rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, conteudo);
  }
  const orc = join(tmp, "orc.json");
  writeFileSync(orc, JSON.stringify(orcamentos));
  return spawnSync(process.execPath, [script, "--dist", dist, "--orcamentos", orc], {
    encoding: "utf8",
  });
}

// N KiB de bytes aleatórios em base64 (6 bits de entropia por caractere): gzip fica em ~ N KiB.
const incomprimivel = (kib: number) => randomBytes(kib * 1024).toString("base64");

describe("orçamento de peso por rota (ADR 003, D3)", () => {
  const folgado = { padrao: { jsGzKB: 10, pesoGzKB: 60 }, rotas: {} };

  it("aprova página dentro do orçamento", () => {
    const r = montar({ "index.html": "<html><body>oi</body></html>" }, folgado);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("ok");
  });

  it("CANÁRIO: reprova quando o JS inline passa do orçamento", () => {
    const html = `<html><body><script>var x="${incomprimivel(12)}"</script></body></html>`;
    const r = montar({ "index.html": html }, folgado);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/JS .* > 10 KiB/);
  });

  it("CANÁRIO: reprova quando o peso total passa do orçamento (imagem referenciada)", () => {
    const html = '<html><body><img src="/img/foto.bin" alt=""></body></html>';
    const r = montar(
      { "index.html": html, "img/foto.bin": randomBytes(70 * 1024) },
      folgado,
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/peso .* > 60 KiB/);
  });

  it("não conta fontes nem vídeo no peso da rota", () => {
    const css = '@font-face{src:url("/f/a.woff2")}.x{background:url(/m/v.mp4)}';
    const r = montar(
      {
        "index.html": '<html><head><link rel="stylesheet" href="/s.css"></head></html>',
        "s.css": css,
        "f/a.woff2": randomBytes(200 * 1024),
        "m/v.mp4": randomBytes(200 * 1024),
      },
      folgado,
    );
    expect(r.status).toBe(0);
  });

  it("conta recurso apontado por url() no CSS (a logo em máscara)", () => {
    const r = montar(
      {
        "index.html": '<html><head><link rel="stylesheet" href="/s.css"></head></html>',
        "s.css": '.l{mask:url("/logo.bin")}',
        "logo.bin": randomBytes(70 * 1024),
      },
      folgado,
    );
    expect(r.status).toBe(1);
  });

  it("usa a tabela por rota: o cartão tem 20 KiB de JS, as demais 10", () => {
    const js = `<html><body><script>var x="${incomprimivel(15)}"</script></body></html>`;
    const tabela = {
      padrao: { jsGzKB: 10, pesoGzKB: 150 },
      rotas: { "/cartao": { jsGzKB: 20, pesoGzKB: 100 } },
    };
    const r = montar({ "cartao/index.html": js, "outra/index.html": js }, tabela);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("/outra:");
    expect(r.stderr).not.toContain("/cartao:");
  });

  it("falha se não houver dist", () => {
    const r = spawnSync(process.execPath, [script, "--dist", join(tmpdir(), "nao-existe-peso")], {
      encoding: "utf8",
    });
    expect(r.status).toBe(1);
  });

  it("a tabela real traz os números do ADR 003", () => {
    expect(orcamentoReal.rotas["/"]).toEqual({ jsGzKB: 10, pesoGzKB: 60 });
    expect(orcamentoReal.rotas["/apresentacao"].pesoGzKB).toBe(150);
    expect(orcamentoReal.rotas["/cartao"]).toEqual({ jsGzKB: 20, pesoGzKB: 100 });
    expect(orcamentoReal.rotas["/pedro/entrevistas"].pesoGzKB).toBe(400);
    expect(orcamentoReal.padrao.jsGzKB).toBe(10);
  });
});
