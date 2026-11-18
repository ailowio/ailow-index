import type { APIRoute } from "astro";
import { carregarFeed } from "../../changelog/carregar";

/** O changelog em dados (só entradas confirmadas). Também garante que todo build valida o feed. */
export const GET: APIRoute = async () => {
  const { prs, painel } = await carregarFeed();
  const corpo = {
    versao: 1,
    prs: prs.map(({ verificacao: _v, ...pr }) => pr),
    ferramentas: painel,
  };
  return new Response(JSON.stringify(corpo, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
