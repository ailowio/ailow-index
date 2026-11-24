import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { APPS, PORTAS, appPorId } from "../src/config/apps";
import { ORIGENS } from "../src/config/contato";

// V02 (2026-11-20, ADR 007 item 1): as duas portas da home e as rotas novas.
const raiz = resolve(import.meta.dirname, "..");
const orcamentos = JSON.parse(readFileSync(join(raiz, "scripts", "orcamentos-peso.json"), "utf8"));

describe("home v2: as duas portas (ADR 007)", () => {
  it("são exatamente duas, para /consultoria e /educacao, com as chamadas decididas pelo Pedro (2026-11-19)", () => {
    expect(PORTAS.map((p) => [p.rota, p.chamada])).toEqual([
      ["/consultoria", "Fazer na minha empresa"],
      ["/educacao", "Levar para minha instituição"],
    ]);
  });

  // V18 · 2026-11-23 · pedido do Pedro ("mais um quadradinho"): a Trajetória entra na grade, que passa a 7.
  it("as portas não entram na grade de apps, que tem 7", () => {
    expect(APPS).toHaveLength(7);
    for (const p of PORTAS) expect(APPS.map((a) => a.id)).not.toContain(p.id);
  });

  it("a página de cada porta acha o seu selo e tem uma origem própria no WhatsApp", () => {
    for (const p of PORTAS) {
      expect(appPorId(p.id).rota).toBe(p.rota);
      expect(ORIGENS).toContain(p.id);
    }
  });

  it("rota nova ganha orçamento de peso explícito (JS 10 KiB, peso 150 KiB)", () => {
    for (const p of PORTAS) expect(orcamentos.rotas[p.rota], p.rota).toEqual({ jsGzKB: 10, pesoGzKB: 150 });
  });
});
