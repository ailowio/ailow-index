import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { lintConteudo } from "../changelog/bloqueio.ts";
import { ARQUIVOS, EXTENSOES_PERMITIDAS, type NomeArquivo, type SitePacote, esquemaSite } from "./pacote.ts";

/**
 * Validação e importação do pacote bancada → site (ADR 008 itens 2–3).
 * Tudo ou nada: qualquer erro recusa o pacote inteiro e nada é copiado.
 */

export interface OpcoesValidacao {
  /** Lista local de termos bloqueados (`carregarTermosLocais`); vazia nos testes. */
  termosLocais?: string[];
}

export interface ResultadoValidacao {
  erros: string[];
  site?: SitePacote;
  /** Nomes de arquivo presentes (só preenchido quando o pacote é válido). */
  arquivos: NomeArquivo[];
}

const ehNome = (n: string): n is NomeArquivo => Object.hasOwn(ARQUIVOS, n);

/** Confere o cabeçalho do arquivo: extensão certa com conteúdo errado (binário renomeado) é recusada. */
const CABECALHOS: Record<string, (b: Buffer) => boolean> = {
  ".mp4": (b) => b.length >= 12 && b.subarray(4, 8).toString("latin1") === "ftyp",
  ".webp": (b) =>
    b.length >= 12 && b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  ".png": (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  ".vtt": (b) => b.toString("utf8").replace(/^﻿/, "").startsWith("WEBVTT"),
  ".json": () => true,
};

function textosDe(valor: unknown, saida: string[] = []): string[] {
  if (typeof valor === "string") saida.push(valor);
  else if (Array.isArray(valor)) for (const v of valor) textosDe(v, saida);
  else if (valor && typeof valor === "object") {
    for (const [k, v] of Object.entries(valor)) {
      saida.push(k);
      textosDe(v, saida);
    }
  }
  return saida;
}

export function validarPacote(pasta: string, opcoes: OpcoesValidacao = {}): ResultadoValidacao {
  const erros: string[] = [];
  const termos = opcoes.termosLocais ?? [];
  const raiz = resolve(pasta);

  if (!existsSync(raiz) || !lstatSync(raiz).isDirectory()) {
    return { erros: [`pasta do pacote não encontrada: ${pasta}`], arquivos: [] };
  }

  // 1. Inventário: só nomes do contrato, extensões da lista, nada de subpasta nem link.
  const presentes = new Set<NomeArquivo>();
  for (const nome of readdirSync(raiz)) {
    const info = lstatSync(join(raiz, nome));
    if (info.isSymbolicLink()) erros.push(`${nome}: link simbólico não é aceito`);
    else if (info.isDirectory()) erros.push(`${nome}: subpasta fora do contrato`);
    else if (!EXTENSOES_PERMITIDAS.has(extname(nome).toLowerCase())) {
      erros.push(`${nome}: extensão não permitida (aceitas: ${[...EXTENSOES_PERMITIDAS].join(" ")})`);
    } else if (!ehNome(nome)) {
      erros.push(`${nome}: arquivo fora do contrato (aceitos: ${Object.keys(ARQUIVOS).join(", ")})`);
    } else presentes.add(nome);
  }

  // 2. Tamanho, cabeçalho e arquivo obrigatório.
  for (const [nome, regra] of Object.entries(ARQUIVOS) as [NomeArquivo, (typeof ARQUIVOS)[NomeArquivo]][]) {
    if (!presentes.has(nome)) {
      if (regra.obrigatorio) erros.push(`${nome}: obrigatório e ausente`);
      continue;
    }
    const bytes = readFileSync(join(raiz, nome));
    if (bytes.length === 0) erros.push(`${nome}: arquivo vazio`);
    if ("tetoBytes" in regra && bytes.length > regra.tetoBytes) {
      erros.push(`${nome}: ${bytes.length} bytes passa do teto de ${regra.tetoBytes} bytes`);
    }
    if (!CABECALHOS[extname(nome)]?.(bytes)) erros.push(`${nome}: cabeçalho não confere com a extensão`);
  }

  // 3. site.json: schema, coerência com a pasta e com os arquivos, linter de conteúdo.
  let site: SitePacote | undefined;
  if (presentes.has("site.json")) {
    const bruto = readFileSync(join(raiz, "site.json"), "utf8").replace(/^﻿/, "");
    let json: unknown;
    try {
      json = JSON.parse(bruto);
    } catch {
      erros.push("site.json: JSON inválido");
    }
    if (json !== undefined) {
      const lido = esquemaSite.safeParse(json);
      if (!lido.success) {
        for (const i of lido.error.issues) {
          const caminho = i.path.join(".") || "(raiz)";
          erros.push(`site.json: ${caminho}: ${i.message}`);
        }
      } else {
        site = lido.data;
        if (site.slug !== basename(raiz)) {
          erros.push(`site.json: slug "${site.slug}" tem de ser igual ao nome da pasta "${basename(raiz)}"`);
        }
        const temVideo = presentes.has("video-720p.mp4");
        if (temVideo && site.youtube_id) erros.push("site.json: youtube_id junto com video-720p.mp4 (escolha um)");
        if (!temVideo && !site.youtube_id) erros.push("site.json: falta video-720p.mp4 ou youtube_id");
        if (temVideo && !presentes.has("legenda.vtt")) erros.push("legenda.vtt: obrigatória quando há vídeo");
      }
      for (const e of lintConteudo(textosDe(json).join("\n"), termos)) erros.push(`site.json: ${e}`);
    }
  }

  // 4. Legendas passam pelo mesmo linter.
  for (const nome of ["legenda.vtt", "capitulos.vtt"] as const) {
    if (!presentes.has(nome)) continue;
    for (const e of lintConteudo(readFileSync(join(raiz, nome), "utf8"), termos)) erros.push(`${nome}: ${e}`);
  }

  return erros.length ? { erros, arquivos: [] } : { erros, site, arquivos: [...presentes] };
}

export interface OpcoesImportacao extends OpcoesValidacao {
  /** Pasta que recebe `<slug>/` (padrão do CLI: `public/midia`). */
  destino: string;
  /** Troca um slug já importado (reimportação da mesma peça). */
  substituir?: boolean;
}

export interface ResultadoImportacao {
  erros: string[];
  slug?: string;
  copiados: NomeArquivo[];
}

export function importarPacote(pasta: string, opcoes: OpcoesImportacao): ResultadoImportacao {
  const v = validarPacote(pasta, opcoes);
  if (v.erros.length || !v.site) return { erros: v.erros, copiados: [] };

  const final = join(opcoes.destino, v.site.slug);
  if (existsSync(final) && !opcoes.substituir) {
    return { erros: [`public/midia/${v.site.slug} já existe (use --substituir para trocar)`], copiados: [] };
  }

  // Copia para uma pasta temporária irmã e só então renomeia: falha no meio não deixa pacote parcial.
  const temporaria = join(opcoes.destino, `.${v.site.slug}.importando`);
  try {
    mkdirSync(opcoes.destino, { recursive: true });
    rmSync(temporaria, { recursive: true, force: true });
    mkdirSync(temporaria);
    for (const nome of v.arquivos) cpSync(join(resolve(pasta), nome), join(temporaria, nome));
    if (existsSync(final)) rmSync(final, { recursive: true });
    renameSync(temporaria, final);
  } catch (e) {
    rmSync(temporaria, { recursive: true, force: true });
    return { erros: [`falha ao copiar: ${(e as Error).message}`], copiados: [] };
  }
  return { erros: [], slug: v.site.slug, copiados: v.arquivos };
}
