import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/** V05: o comando `npm run importar-midia` de ponta a ponta (processo real, destino temporário). */
const raiz = resolve(import.meta.dirname, "..", "..");
const fixture = join(raiz, "test", "fixtures", "midia", "valido-video");
let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "midia-cli-"));
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

const rodar = (...args: string[]) =>
  spawnSync(process.execPath, ["--experimental-strip-types", "scripts/importar-midia.ts", ...args], {
    cwd: raiz,
    encoding: "utf8",
  });

describe("comando importar-midia", () => {
  it("importa o pacote válido e sai com 0", () => {
    const r = rodar(fixture, "--destino", join(tmp, "midia"));
    expect(r.status, r.stderr).toBe(0);
    expect(existsSync(join(tmp, "midia", "valido-video", "legenda.vtt"))).toBe(true);
  });

  it("recusa o pacote sem legenda, sai com 1 e não copia nada", () => {
    const origem = join(tmp, "origem", "valido-video");
    cpSync(fixture, origem, { recursive: true });
    rmSync(join(origem, "legenda.vtt"));
    const r = rodar(origem, "--destino", join(tmp, "midia"));
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/RECUSADO/);
    expect(r.stderr).toMatch(/legenda\.vtt/);
    expect(existsSync(join(tmp, "midia"))).toBe(false);
  });

  it("sem argumento mostra o uso e sai com 2", () => {
    const r = rodar();
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/uso:/);
  });
});
