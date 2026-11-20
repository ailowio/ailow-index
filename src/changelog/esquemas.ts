import { z } from "astro/zod";
import { CATEGORIAS, ESTADOS, RESUMO_MAX, STATUS_FATO, VERIFICACOES } from "./tipos";

/** Frontmatter de `src/content/prs/NNN-slug.md` (ADR 002). Regras do feed inteiro: `regras.ts`. */
export const esquemaPR = z.object({
  numero: z.number().int().positive(),
  titulo: z.string().min(1),
  data: z.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "use AAAA ou AAAA-MM"),
  estado: z.enum(ESTADOS),
  ferramentas: z.array(z.string()).default([]),
  soft_skills: z.array(z.string()).default([]),
  prova: z.union([
    z.object({
      publica: z
        .string()
        .refine((v) => v.startsWith("https://") || /^\/[a-z0-9/-]*$/.test(v), "URL https:// ou rota /..."),
    }),
    z.object({ privada: z.string().min(10, "descreva a prova sem número nem segredo") }),
  ]),
  verificacao: z.enum(VERIFICACOES),
  /**
   * V09 (ADR 007 item 4): a leitura "Para empresários" da entrada, numa frase simples. Só nas entradas de vitrine e
   * só com o que a própria entrada diz (test/v09-diario.test.ts). Passa pelo linter de conteúdo como o resto.
   */
  resumo_dono: z.string().trim().min(10, "resumo_dono vago demais").max(RESUMO_MAX).optional(),
  /** V10 (ADR 006 item 2): verbo × status do fato; opcional, só onde a própria entrada o sustenta. */
  status_fato: z.enum(STATUS_FATO).optional(),
});

const semRepetir = <T extends { id: string }>(itens: T[]) =>
  new Set(itens.map((i) => i.id)).size === itens.length;

const id = z.string().regex(/^[a-z0-9-]+$/, "id em kebab-case");

export const esquemaCatalogos = z.object({
  ferramentas: z
    .array(
      z.object({
        id,
        nome: z.string().min(1),
        categoria: z.enum(CATEGORIAS),
        principal: z.boolean().optional(),
      }),
    )
    .refine(semRepetir, "id de ferramenta repetido"),
  softSkills: z
    .array(z.object({ id, nome: z.string().min(1), descricao: z.string().optional() }))
    .refine(semRepetir, "id de soft skill repetido"),
});
