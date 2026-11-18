import { describe, expect, it } from "vitest";
import config from "../astro.config.mjs";
import { SITE } from "../src/config/site";

describe("identidade pública do site (ADR 001)", () => {
  it("publica na raiz de ailow.com.br, com a marca Ailow", () => {
    expect(new URL(SITE.url).hostname).toBe("ailow.com.br");
    expect(SITE.nome).toBe("Ailow");
  });

  it("usa no astro.config a mesma URL canônica da configuração do site", () => {
    expect(config.site).toBe(SITE.url);
  });

  it("mantém o ERP no subdomínio cloud, fora deste site", () => {
    expect(new URL(SITE.cloudUrl).hostname).toBe("cloud.ailow.com.br");
  });
});
