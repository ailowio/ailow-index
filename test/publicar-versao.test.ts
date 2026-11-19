import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * S12e: a tag publicada tem de bater com a versão do rodapé (package.json).
 * Lê o workflow como texto, no estilo de deploy-stack.test.ts; nada é executado.
 */
const raiz = resolve(import.meta.dirname, "..");
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const workflow = ler(".github/workflows/publicar.yml");

describe("workflow Publicar imagem: tag = versão do package.json", () => {
  it("tem um passo que compara a tag com `v` + version do package.json e falha com mensagem clara", () => {
    expect(workflow).toMatch(/- name: a tag \(vX\.Y\.Z\) tem de ser igual à versão do package\.json/);
    expect(workflow).toMatch(/package\.json/);
    expect(workflow).toMatch(/"\$VERSAO" != "v\$\{?VERSAO_PKG\}?"/);
    expect(workflow).toMatch(/suba a versão do package\.json e o CHANGELOG/);
  });

  it("o passo roda antes do build e do push da imagem", () => {
    const passo = workflow.indexOf("a tag (vX.Y.Z) tem de ser igual");
    expect(passo).toBeGreaterThan(-1);
    expect(passo).toBeLessThan(workflow.indexOf("docker build"));
    expect(passo).toBeLessThan(workflow.indexOf("docker push"));
  });
});

describe("imagem: o build lê o CHANGELOG (/versoes)", () => {
  it("Dockerfile copia o CHANGELOG.md para o estágio de build e o .dockerignore o libera", () => {
    expect(ler("Dockerfile")).toMatch(/^COPY CHANGELOG\.md CHANGELOG\.md$/m);
    expect(ler(".dockerignore").split(/\r?\n/)).toContain("!CHANGELOG.md");
  });
});

describe("runbook de deploy", () => {
  it("o passo 1 do §4 manda subir package.json e CHANGELOG no PR antes da tag", () => {
    const secao = ler("docs/runbooks/deploy.md").split("## 4.")[1]?.split("## 5.")[0] ?? "";
    expect(secao).toMatch(/suba `package\.json` version e o CHANGELOG no PR antes de criar a tag/);
  });
});
