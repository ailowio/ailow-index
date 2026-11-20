/**
 * Formato público de um fluxo do n8n no Explorador (F5). É uma versão DERIVADA: gerada fora do repositório a partir
 * do export, com lista de permissões (posição, categoria, rótulo revisado, ligações). O export bruto nunca entra.
 */
import { z } from "astro/zod";

export const CATEGORIAS = [
  "gatilho",
  "ia",
  "modelo",
  "memoria",
  "ferramenta",
  "banco",
  "http",
  "decisao",
  "codigo",
  "mensagem",
  "espera",
  "outro",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const esquemaNo = z
  .object({
    id: z.string().regex(/^n\d+$/),
    categoria: z.enum(CATEGORIAS),
    rotulo: z.string().min(1).max(60),
    oQueFaz: z.string().min(1).max(240),
    tecnico: z.string().min(1).max(40),
    x: z.number().int().min(0),
    y: z.number().int().min(0),
  })
  .strict();

export const esquemaFluxo = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    titulo: z.string().min(1).max(80),
    pr: z.number().int().positive(),
    estado: z.enum(["ativo", "desligado"]),
    criado: z.string().regex(/^\d{4}-\d{2}$/),
    resumo: z.string().min(1).max(400),
    historia: z.string().min(1).max(600),
    nos: z.array(esquemaNo).min(1),
    ligacoes: z.array(z.object({ de: z.string(), para: z.string(), tipo: z.enum(["fluxo", "ia"]) }).strict()),
  })
  .strict();

export type Fluxo = z.infer<typeof esquemaFluxo>;
export type NoFluxo = z.infer<typeof esquemaNo>;

/** Padrões que nunca podem aparecer num fluxo publicado. Lista vazia = liberado. */
const PROIBIDOS: Array<[string, RegExp]> = [
  ["URL", /https?:\/\/|www\./i],
  ["e-mail", /[\w.+-]+@[\w-]+\.[\w.]+/],
  ["IPv4", /\b(?:\d{1,3}\.){3}\d{1,3}\b/],
  // ids de fluxo/credencial do n8n: 16 caracteres alfanuméricos misturando maiúscula e minúscula (dígito é opcional:
  // o canário usa um id real sem dígito)
  ["id do n8n", /\b(?=[A-Za-z0-9]{16}\b)(?=[A-Za-z0-9]*[A-Z])(?=[A-Za-z0-9]*[a-z])[A-Za-z0-9]{16}\b/],
  ["UUID", /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i],
  ["número longo", /\d{8,}/],
  ["campo parameters", /"parameters"\s*:/],
  ["campo credentials", /"credentials"\s*:/],
  ["campo webhookId", /"webhookId"\s*:/],
];

export function achadosSaneamento(texto: string): string[] {
  return PROIBIDOS.filter(([, re]) => re.test(texto)).map(([nome]) => nome);
}
