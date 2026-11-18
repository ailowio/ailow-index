import { describe, expect, it } from "vitest";
import {
  comNovidades,
  lerTitulo,
  painelFerramentas,
  publicaveis,
  validarFeed,
} from "../../src/changelog/regras";
import { catalogosTeste, pr } from "./fabrica";

describe("título em Conventional Commit", () => {
  it("separa tipo, escopo, quebra e descrição", () => {
    expect(lerTitulo("feat(sgi)!: v2.0 com Ant Design")).toEqual({
      tipo: "feat",
      escopo: "sgi",
      quebra: true,
      descricao: "v2.0 com Ant Design",
    });
  });

  it("devolve null quando falta o escopo", () => {
    expect(lerTitulo("feat: sem escopo")).toBeNull();
  });

  it("devolve null para tipo fora do Conventional Commits", () => {
    expect(lerTitulo("talk(talk): palestra")).toBeNull();
  });

  it("devolve null para escopo fora da lista do feed", () => {
    expect(lerTitulo("feat(marketing): algo")).toBeNull();
  });
});

describe("validação do feed inteiro", () => {
  it("aceita um feed em ordem, com números únicos e catálogos conhecidos", () => {
    const feed = [
      pr({ numero: 1, id: "001-vps", data: "2025-02", ferramentas: ["docker"] }),
      pr({ numero: 2, id: "002-sgi", data: "2025-12", soft_skills: ["discovery"] }),
    ];
    expect(validarFeed(feed, catalogosTeste)).toEqual([]);
  });

  it("rejeita número de PR duplicado", () => {
    const feed = [pr({ numero: 7, id: "007-a" }), pr({ numero: 7, id: "007-b" })];
    expect(validarFeed(feed, catalogosTeste)).toContainEqual(
      expect.stringContaining("#007 duplicado"),
    );
  });

  it("rejeita número maior com data anterior (a ordem dos números segue o tempo)", () => {
    const feed = [
      pr({ numero: 1, id: "001-a", data: "2026-03" }),
      pr({ numero: 2, id: "002-b", data: "2026-01" }),
    ];
    expect(validarFeed(feed, catalogosTeste)).toContainEqual(
      expect.stringContaining("#002 (2026-01) é anterior a #001 (2026-03)"),
    );
  });

  it("aceita data só com ano antes dos meses do mesmo ano", () => {
    const feed = [
      pr({ numero: 1, id: "001-a", data: "2025" }),
      pr({ numero: 2, id: "002-b", data: "2025-02" }),
    ];
    expect(validarFeed(feed, catalogosTeste)).toEqual([]);
  });

  it("confere a ordem também entre entradas não publicadas (a numeração é global)", () => {
    const feed = [
      pr({ numero: 1, id: "001-a", data: "2026-03", verificacao: "pendente" }),
      pr({ numero: 2, id: "002-b", data: "2026-01" }),
    ];
    expect(validarFeed(feed, catalogosTeste)).toHaveLength(1);
  });

  it("rejeita arquivo cujo prefixo não bate com o número do frontmatter", () => {
    const feed = [pr({ numero: 3, id: "004-errado" })];
    expect(validarFeed(feed, catalogosTeste)).toContainEqual(
      expect.stringContaining("arquivo 004-errado"),
    );
  });

  it("rejeita ferramenta e soft skill fora do catálogo", () => {
    const feed = [pr({ numero: 1, id: "001-a", ferramentas: ["kubernetes"], soft_skills: ["carisma"] })];
    const erros = validarFeed(feed, catalogosTeste);
    expect(erros).toContainEqual(expect.stringContaining("ferramenta desconhecida: kubernetes"));
    expect(erros).toContainEqual(expect.stringContaining("soft skill desconhecida: carisma"));
  });

  it("rejeita título fora do padrão", () => {
    const feed = [pr({ numero: 1, id: "001-a", titulo: "Primeiro sistema" })];
    expect(validarFeed(feed, catalogosTeste)).toContainEqual(
      expect.stringContaining("título fora do padrão"),
    );
  });
});

describe("o que é publicado", () => {
  it("publica só entradas confirmadas, em ordem de número", () => {
    const feed = [
      pr({ numero: 3, id: "003-c" }),
      pr({ numero: 1, id: "001-a", verificacao: "pendente" }),
      pr({ numero: 2, id: "002-b", verificacao: "fora" }),
      pr({ numero: 4, id: "004-d" }),
    ];
    expect(publicaveis(feed).map((e) => e.numero)).toEqual([3, 4]);
  });
});

describe("diff de ferramentas derivado da cronologia", () => {
  it("marca a ferramenta como nova só no primeiro PR publicado em que aparece", () => {
    const publicadas = publicaveis([
      pr({ numero: 1, id: "001-a", ferramentas: ["react", "supabase"] }),
      pr({ numero: 2, id: "002-b", ferramentas: ["react", "n8n"] }),
      pr({ numero: 3, id: "003-c", ferramentas: ["n8n", "supabase"] }),
    ]);
    expect(comNovidades(publicadas).map((e) => e.novas)).toEqual([
      ["react", "supabase"],
      ["n8n"],
      [],
    ]);
  });

  it("ignora a aparição em entrada não publicada", () => {
    const publicadas = publicaveis([
      pr({ numero: 1, id: "001-a", ferramentas: ["docker"], verificacao: "pendente" }),
      pr({ numero: 2, id: "002-b", ferramentas: ["docker"] }),
    ]);
    expect(comNovidades(publicadas)[0]?.novas).toEqual(["docker"]);
  });
});

describe("painel de ferramentas (derivado, não declarado)", () => {
  it("conta em quantos PRs publicados cada ferramenta aparece e desde qual número", () => {
    const publicadas = publicaveis([
      pr({ numero: 1, id: "001-a", ferramentas: ["docker"] }),
      pr({ numero: 2, id: "002-b", ferramentas: ["docker", "react"] }),
      pr({ numero: 3, id: "003-c", ferramentas: ["react"], verificacao: "pendente" }),
    ]);
    expect(painelFerramentas(publicadas, catalogosTeste)).toEqual([
      { id: "react", nome: "React", categoria: "front", principal: false, prs: 1, desde: 2 },
      { id: "docker", nome: "Docker", categoria: "infra", principal: true, prs: 2, desde: 1 },
    ]);
  });

  it("não lista ferramenta do catálogo que nenhum PR publicado usa", () => {
    const publicadas = publicaveis([pr({ numero: 1, id: "001-a", ferramentas: ["n8n"] })]);
    expect(painelFerramentas(publicadas, catalogosTeste).map((f) => f.id)).toEqual(["n8n"]);
  });
});
