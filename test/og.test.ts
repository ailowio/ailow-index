import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OG_IMAGEM } from "../src/config/og";

const raiz = join(import.meta.dirname, "..");
const LIMITE = 300 * 1024;

/** Largura e altura do cabeçalho IHDR de um PNG. */
function dimensoesPng(buf: Buffer): { largura: number; altura: number } {
  const assinatura = "89504e470d0a1a0a";
  if (buf.subarray(0, 8).toString("hex") !== assinatura) throw new Error("não é PNG");
  return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
}

// F0: a imagem do preview (WhatsApp, LinkedIn) é 1200x630, auto-hospedada e leve.
describe("imagem de preview (Open Graph)", () => {
  it("é um PNG 1200x630 em public/, com até 300 KB", () => {
    expect(OG_IMAGEM.caminho).toBe("/og/ailow.png");
    const p = join(raiz, "public", OG_IMAGEM.caminho);
    expect(existsSync(p)).toBe(true);
    expect(statSync(p).size).toBeLessThanOrEqual(LIMITE);
    expect(dimensoesPng(readFileSync(p))).toEqual({ largura: 1200, altura: 630 });
    expect(OG_IMAGEM).toMatchObject({ largura: 1200, altura: 630 });
  });

  it("o texto alternativo descreve a imagem", () => {
    expect(OG_IMAGEM.alt).toMatch(/Pedro Fernandes/);
  });

  it("canário: o leitor de dimensões reprova um arquivo que não é PNG", () => {
    expect(() => dimensoesPng(Buffer.from("GIF89a-----------------------"))).toThrow();
  });
});
