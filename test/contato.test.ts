import { describe, expect, it } from "vitest";
import { linkContato, mensagemContato, ORIGENS, WHATSAPP } from "../src/config/contato";

// F0 (2026-11-20): o Pedro autorizou publicar o WhatsApp dele (COLHEITA.md, "Pendências que travam a F0").
describe("contato público por WhatsApp (F0)", () => {
  it("o número é o autorizado, no formato internacional do wa.me (sem +, espaço ou traço)", () => {
    expect(WHATSAPP).toBe("5585996188080");
    expect(WHATSAPP).toMatch(/^55\d{11}$/);
  });

  it("cada origem gera o link wa.me do número com a mensagem codificada", () => {
    for (const origem of ORIGENS) {
      const u = new URL(linkContato(origem));
      expect(u.origin + u.pathname).toBe(`https://wa.me/${WHATSAPP}`);
      expect(u.searchParams.get("text")).toBe(mensagemContato(origem));
    }
  });

  it("a mensagem é cordial, curta e diz de onde a pessoa veio", () => {
    const marcas = new Set<string>();
    for (const origem of ORIGENS) {
      const m = mensagemContato(origem);
      expect(m.startsWith("Oi, Pedro!"), m).toBe(true);
      expect(m).not.toMatch(/entre em contato/i);
      expect(m.length).toBeLessThanOrEqual(120);
      const marca = /\[([^\]]+)\]$/.exec(m)?.[1];
      expect(marca, `marca de origem em: ${m}`).toBeTruthy();
      marcas.add(marca as string);
    }
    // Uma marca por origem: o Pedro distingue site, apresentação e Instagram na própria conversa.
    expect(marcas.size).toBe(ORIGENS.length);
  });

  it("canário: um número fora do formato reprova a regra do formato", () => {
    expect("+55 85 99618-8080").not.toMatch(/^55\d{11}$/);
  });
});
