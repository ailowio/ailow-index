/**
 * Formato público de uma foto do Explorador (V13, 2026-11-20; ADR 008, revisão "fotos estáticas do Explorador").
 * A imagem é um quadro de vídeo do acervo da bancada, recortado e revisado quadro a quadro fora do repositório; aqui
 * entram só o WebP final (≤ 80 KB, em public/explorar/fotos/) e este texto. Os pontos são posições em % da imagem.
 */
import { z } from "astro/zod";
import { TETOS } from "../midia/pacote";

/** Mesmo teto do pôster do pacote da bancada (ADR 008 item 1). */
export const TETO_FOTO_BYTES = TETOS.posterBytes;

/** Única pasta pública permitida para as fotos (relativa a public/). */
export const PREFIXO_FOTOS = "/explorar/fotos/";

const porcento = z.number().gt(0).lt(100);

export const esquemaPonto = z
  .object({
    id: z.string().regex(/^p\d+$/),
    rotulo: z.string().min(1).max(40),
    /** O que é, em linguagem simples. */
    oQueE: z.string().min(1).max(240),
    /** Detalhe técnico, mostrado por baixo. */
    detalhe: z.string().min(1).max(280),
    x: porcento,
    y: porcento,
  })
  .strict();

export const esquemaFoto = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    titulo: z.string().min(1).max(80),
    /** Entrada principal do Diário de obra. */
    pr: z.number().int().positive(),
    /** Todas as entradas citadas (inclui a principal). */
    fatos: z.array(z.number().int().positive()).min(1),
    /** Data da gravação do quadro (AAAA-MM-DD). */
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Origem no catálogo da bancada (só leitura): id do vídeo e o instante do quadro. Não aparece na página. */
    origem: z.object({ catalogo: z.string().regex(/^V\d{3}$/), segundo: z.number().min(0) }).strict(),
    imagem: z
      .object({
        arquivo: z.string().regex(/^\/explorar\/fotos\/[a-z0-9-]+\.webp$/),
        largura: z.number().int().positive(),
        altura: z.number().int().positive(),
      })
      .strict(),
    alt: z.string().min(1).max(300),
    resumo: z.string().min(1).max(300),
    historia: z.string().min(1).max(600),
    credito: z.string().min(1).max(200),
    pontos: z.array(esquemaPonto).min(3).max(8),
  })
  .strict()
  .refine((f) => f.fatos.includes(f.pr), { message: "a entrada principal (pr) tem de estar em fatos" });

export type Foto = z.infer<typeof esquemaFoto>;
export type PontoFoto = z.infer<typeof esquemaPonto>;
