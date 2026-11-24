import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * V16: números da página "Como este site é feito", lidos do repositório no momento do build (nada digitado).
 * Contam arquivos, não casos de teste: o número de casos só existe depois de rodar a suíte.
 */
export interface Contagens {
  arquivosVitest: number;
  arquivosE2E: number;
  rotasComTeto: number;
  tetoJsPadraoKiB: number;
  tetoPesoPadraoKiB: number;
}

function contar(dir: string, sufixo: string): number {
  let n = 0;
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (nome === "fixtures" || nome.startsWith(".tmp")) continue;
    if (statSync(p).isDirectory()) n += contar(p, sufixo);
    else if (nome.endsWith(sufixo)) n += 1;
  }
  return n;
}

export function lerContagens(raiz: string = process.cwd()): Contagens {
  const orc = JSON.parse(readFileSync(join(raiz, "scripts", "orcamentos-peso.json"), "utf8")) as {
    padrao: { jsGzKB: number; pesoGzKB: number };
    rotas: Record<string, unknown>;
  };
  return {
    arquivosVitest: contar(join(raiz, "test"), ".test.ts") + contar(join(raiz, "src"), ".test.ts"),
    arquivosE2E: contar(join(raiz, "e2e"), ".e2e.ts"),
    rotasComTeto: Object.keys(orc.rotas).length,
    tetoJsPadraoKiB: orc.padrao.jsGzKB,
    tetoPesoPadraoKiB: orc.padrao.pesoGzKB,
  };
}
