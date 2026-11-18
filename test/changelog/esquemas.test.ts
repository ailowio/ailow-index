import { describe, expect, it } from "vitest";
import ferramentasReais from "../../src/data/ferramentas.json";
import softSkillsReais from "../../src/data/soft-skills.json";
import { esquemaCatalogos, esquemaPR } from "../../src/changelog/esquemas";

const base = {
  numero: 1,
  titulo: "chore(infra): VPS contratada",
  data: "2025-02",
  estado: "merged",
  ferramentas: [],
  soft_skills: [],
  prova: { privada: "e-mail de pagamento do provedor, 17/02/2025" },
  verificacao: "confirmado",
};

describe("frontmatter de um PR do feed", () => {
  it("aceita uma entrada completa", () => {
    expect(esquemaPR.safeParse(base).success).toBe(true);
  });

  it.each(["2025-13", "2025-2", "25-02", "fev/2025", ""])("rejeita a data %j", (data) => {
    expect(esquemaPR.safeParse({ ...base, data }).success).toBe(false);
  });

  it("aceita data só com o ano", () => {
    expect(esquemaPR.safeParse({ ...base, data: "2025" }).success).toBe(true);
  });

  it.each([0, -1, 1.5])("rejeita o número %j", (numero) => {
    expect(esquemaPR.safeParse({ ...base, numero }).success).toBe(false);
  });

  it("exige prova", () => {
    const { prova: _, ...semProva } = base;
    expect(esquemaPR.safeParse(semProva).success).toBe(false);
  });

  it("aceita prova pública como URL https ou rota interna", () => {
    expect(esquemaPR.safeParse({ ...base, prova: { publica: "https://github.com/ailowio" } }).success).toBe(true);
    expect(esquemaPR.safeParse({ ...base, prova: { publica: "/pulse" } }).success).toBe(true);
  });

  it("rejeita prova pública em http ou sem esquema", () => {
    expect(esquemaPR.safeParse({ ...base, prova: { publica: "http://exemplo.com" } }).success).toBe(false);
    expect(esquemaPR.safeParse({ ...base, prova: { publica: "exemplo.com" } }).success).toBe(false);
  });

  it("rejeita prova privada vaga (menos de 10 caracteres)", () => {
    expect(esquemaPR.safeParse({ ...base, prova: { privada: "e-mail" } }).success).toBe(false);
  });

  it("rejeita verificação fora de confirmado/pendente/fora", () => {
    expect(esquemaPR.safeParse({ ...base, verificacao: "talvez" }).success).toBe(false);
  });
});

describe("catálogos", () => {
  it("os catálogos reais são válidos e sem id repetido", () => {
    const r = esquemaCatalogos.safeParse({ ferramentas: ferramentasReais, softSkills: softSkillsReais });
    expect(r.error?.issues ?? []).toEqual([]);
  });

  it("rejeita id repetido", () => {
    const repetido = [
      { id: "react", nome: "React", categoria: "front" },
      { id: "react", nome: "React 19", categoria: "front" },
    ];
    expect(esquemaCatalogos.safeParse({ ferramentas: repetido, softSkills: [] }).success).toBe(false);
  });

  it("rejeita categoria fora da lista", () => {
    const f = [{ id: "x", nome: "X", categoria: "marketing" }];
    expect(esquemaCatalogos.safeParse({ ferramentas: f, softSkills: [] }).success).toBe(false);
  });
});
