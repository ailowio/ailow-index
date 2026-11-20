import { z } from "astro/zod";

/**
 * Contrato do pacote de publicação bancada → site (ADR 008, V05).
 * Sem imports relativos: o importador roda no Node puro (`node scripts/importar-midia.ts`).
 */

/** Tetos (ADR 005 itens 1–2 e ADR 008). Leitura estrita: MB = 1.000.000 bytes, KB = 1.000 bytes. */
export const TETOS = {
  videoBytes: 8_000_000,
  videoSegundos: 60,
  posterBytes: 80_000,
  ogBytes: 200_000,
} as const;

/** Lista de permissões de extensões; qualquer outra é recusada. */
export const EXTENSOES_PERMITIDAS: ReadonlySet<string> = new Set([".json", ".mp4", ".webp", ".vtt", ".png"]);

/** Os únicos nomes de arquivo aceitos no pacote, e como cada um é conferido. */
export const ARQUIVOS = {
  "site.json": { obrigatorio: true },
  "video-720p.mp4": { obrigatorio: false, tetoBytes: TETOS.videoBytes },
  "poster.webp": { obrigatorio: true, tetoBytes: TETOS.posterBytes },
  "legenda.vtt": { obrigatorio: false },
  "capitulos.vtt": { obrigatorio: false },
  "og-1200x630.png": { obrigatorio: false, tetoBytes: TETOS.ogBytes },
} as const;
export type NomeArquivo = keyof typeof ARQUIVOS;

export const TIPOS = ["teaser", "episodio", "pitch", "entrevista"] as const;

const data = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "use AAAA-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
  }, "data inexistente no calendário");

/** `site.json` (ADR 008 item 1). `strict`: campo desconhecido é recusado. */
export const esquemaSite = z
  .object({
    slug: z
      .string()
      .max(60)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use kebab-case (a-z, 0-9 e hífen)"),
    titulo: z.string().trim().min(1).max(120),
    tipo: z.enum(TIPOS),
    duracao_s: z.number().positive().max(24 * 3600),
    data,
    aprovado_por: z.literal("Pedro"),
    aprovado_em: data,
    fatos: z.array(z.string().regex(/^#\d{1,4}$/, "use #NNN (número da entrada do feed)")),
    youtube_id: z
      .string()
      .regex(/^[A-Za-z0-9_-]{11}$/, "id do YouTube tem 11 caracteres")
      .optional(),
    capitulos: z
      .array(
        z
          .object({ t: z.number().min(0), pergunta: z.string().trim().min(1).max(200) })
          .strict(),
      )
      .optional(),
    selo_ia: z.boolean(),
  })
  .strict()
  .superRefine((s, ctx) => {
    const longo = s.duracao_s > TETOS.videoSegundos;
    if (s.youtube_id && s.tipo !== "entrevista") {
      ctx.addIssue({ code: "custom", path: ["youtube_id"], message: "youtube_id só vale para tipo entrevista" });
    }
    if (s.tipo === "entrevista" && longo && !s.youtube_id) {
      ctx.addIssue({
        code: "custom",
        path: ["youtube_id"],
        message: `entrevista com mais de ${TETOS.videoSegundos} s precisa de youtube_id (ADR 005)`,
      });
    }
    if (!s.youtube_id && longo) {
      ctx.addIssue({
        code: "custom",
        path: ["duracao_s"],
        message: `vídeo hospedado tem de durar até ${TETOS.videoSegundos} s (declarado: ${s.duracao_s})`,
      });
    }
    for (const [i, c] of (s.capitulos ?? []).entries()) {
      if (c.t > s.duracao_s) {
        ctx.addIssue({ code: "custom", path: ["capitulos", i, "t"], message: "capítulo além da duração declarada" });
      }
    }
  });

export type SitePacote = z.infer<typeof esquemaSite>;
