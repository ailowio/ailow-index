/**
 * Assinatura da logo oficial (L-0028): SHA-256 dos atributos `d` dos 5 paths de public/logo.svg,
 * normalizados (espaços colapsados) e unidos por "\n". O arquivo é cópia byte a byte de
 * ailow-cloud/apps/web/public/logo.svg. A cor vem do tema (--logo em tokens.css), nunca do arquivo.
 */
import { createHash } from "node:crypto";

export const LOGO_PATHS = 5;
export const LOGO_ASSINATURA = "3582b79d31067a39c2c4eeea231cc95e74f26b427cbe4aaf24af8df32c9649f5";

export function assinaturaDaLogo(svg: string): { paths: number; hash: string } {
  const ds = [...svg.matchAll(/<path\b[^>]*?\sd="([^"]*)"/g)].map((m) => m[1].replace(/\s+/g, " ").trim());
  return { paths: ds.length, hash: createHash("sha256").update(ds.join("\n")).digest("hex") };
}
