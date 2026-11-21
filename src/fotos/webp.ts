/**
 * Largura e altura de um WebP lendo só o cabeçalho (sem dependência). Cobre os três formatos do contêiner:
 * VP8 (com perdas), VP8L (sem perdas) e VP8X (estendido). Lança erro se o arquivo não for WebP.
 */
export function dimensoesWebp(buf: Buffer): { largura: number; altura: number } {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("não é WebP (cabeçalho RIFF/WEBP ausente)");
  }
  const tipo = buf.toString("ascii", 12, 16);
  if (tipo === "VP8 ") {
    return { largura: buf.readUInt16LE(26) & 0x3fff, altura: buf.readUInt16LE(28) & 0x3fff };
  }
  if (tipo === "VP8L") {
    const b = buf.readUInt32LE(21);
    return { largura: (b & 0x3fff) + 1, altura: ((b >>> 14) & 0x3fff) + 1 };
  }
  if (tipo === "VP8X") {
    return { largura: buf.readUIntLE(24, 3) + 1, altura: buf.readUIntLE(27, 3) + 1 };
  }
  throw new Error(`não é WebP reconhecido (chunk ${JSON.stringify(tipo)})`);
}
