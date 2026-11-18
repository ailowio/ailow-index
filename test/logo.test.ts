import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LOGO_ASSINATURA, LOGO_PATHS, assinaturaDaLogo } from "../src/config/logo";

const raiz = resolve(import.meta.dirname, "..");
const oficialDoCloud = "D:/apps/ailow-cloud/apps/web/public/logo.svg";

describe("logo oficial (L-0028)", () => {
  const svg = readFileSync(resolve(raiz, "public/logo.svg"), "utf8");

  it("public/logo.svg tem os 5 paths oficiais (assinatura dos atributos d)", () => {
    const a = assinaturaDaLogo(svg);
    expect(a.paths).toBe(LOGO_PATHS);
    expect(a.hash).toBe(LOGO_ASSINATURA);
  });

  it("CANÁRIO: um path alterado muda a assinatura", () => {
    const adulterado = svg.replace(/(\sd="M)(\d)/, "$1 9$2");
    expect(assinaturaDaLogo(adulterado).hash).not.toBe(LOGO_ASSINATURA);
  });

  it.skipIf(!existsSync(oficialDoCloud))("bate com o arquivo do Cloud nesta máquina", () => {
    const cloud = assinaturaDaLogo(readFileSync(oficialDoCloud, "utf8"));
    expect(cloud.hash).toBe(LOGO_ASSINATURA);
  });
});
