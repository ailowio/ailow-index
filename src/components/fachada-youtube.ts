/**
 * Fachada do YouTube (ADR 005 item 2, V07). Componente próprio, sem lite-youtube e sem a API JS do YouTube.
 * O HTML só tem pôster (próprio, opcional), botão e aviso de privacidade: nenhum iframe, nenhuma URL do YouTube.
 * O iframe do youtube-nocookie nasce no toque (fachada-youtube.cliente.ts).
 * Sem `youtubeId`, devolve "" e a página não mostra nada (nem "em breve").
 */

/** Id de vídeo do YouTube: 11 caracteres de [A-Za-z0-9_-]. */
export const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

export const AVISO_YOUTUBE = "Ao tocar em Assistir, o Google recebe dados de quem assiste.";

export const urlEmbed = (id: string): string => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export interface OpcoesFachada {
  youtubeId: string | null;
  titulo: string;
  /** Pôster próprio (caminho do site). Sem pôster, a fachada é só a tarja com o botão. */
  poster?: string | null;
}

export function marcaFachadaYoutube({ youtubeId, titulo, poster = null }: OpcoesFachada): string {
  if (!youtubeId) return "";
  if (!ID_YOUTUBE.test(youtubeId)) throw new Error(`youtube_id inválido: ${youtubeId}`);
  const img = poster ? `<img src="${esc(poster)}" alt="" loading="lazy" decoding="async">` : "";
  return (
    `<div class="fachada-youtube" data-youtube="${youtubeId}">` +
    img +
    `<button type="button" class="fachada-play" data-youtube-play aria-label="Assistir no YouTube: ${esc(titulo)}">` +
    "Assistir no YouTube</button>" +
    `<p class="fachada-aviso">${AVISO_YOUTUBE}</p>` +
    "</div>"
  );
}
