// V18 (2026-11-23): aprimoramento progressivo da /trajetoria. Sem este script a página fica inteira visível e o traço
// desenhado (é o que vale sem JS). Aqui:
// - com movimento reduzido: só liga o contador (texto que muda; nada se move);
// - com CSS scroll-driven (`animation-timeline: view()`): marca `.anima.nativo` e o CSS desenha o traço e revela as
//   paradas pela própria rolagem;
// - sem ele: marca só `.anima`; o IntersectionObserver revela cada parada (`.vista`) e leva o traço até a última
//   parada alcançada.
// Nunca escuta a roda do mouse nem o toque e nunca mexe na posição da rolagem: a rolagem é sempre a nativa
// (test/v18-trajetoria.test.ts reprova esses nomes de evento neste arquivo).
const raiz = document.querySelector<HTMLElement>("[data-trajetoria]");

if (raiz && "IntersectionObserver" in window) {
  const paradas = [...raiz.querySelectorAll<HTMLElement>(".parada")];
  const posicao = new Map(paradas.map((p, i) => [p as Element, i]));
  const caminho = raiz.querySelector<HTMLElement>("[data-caminho]");
  const traco = raiz.querySelector<SVGPathElement>("[data-traco]");
  const contador = raiz.querySelector<HTMLElement>("[data-contador]");
  const n = raiz.querySelector("[data-contador-n]");
  const ano = raiz.querySelector("[data-contador-ano]");
  const anima = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nativo = anima && CSS.supports("animation-timeline: view()");
  if (anima) raiz.classList.add("anima");
  if (nativo) raiz.classList.add("nativo");
  if (contador) contador.hidden = false;

  // Parada "alcançada" = já passou da linha a 65% da altura da tela (a margem de baixo do observador).
  const alcancadas = new Set<number>();
  const observador = new IntersectionObserver(
    (registros) => {
      for (const r of registros) {
        const i = posicao.get(r.target) ?? -1;
        const linha = r.rootBounds ? r.rootBounds.bottom : innerHeight;
        if (r.isIntersecting) r.target.classList.add("vista");
        if (r.isIntersecting || r.boundingClientRect.top < linha) alcancadas.add(i);
        else alcancadas.delete(i);
      }
      const atual = alcancadas.size > 0 ? paradas[Math.max(...alcancadas)] : undefined;
      if (n) n.textContent = atual?.dataset.acumulado ?? "0";
      if (ano && atual?.dataset.ano) ano.textContent = atual.dataset.ano;
      if (anima && !nativo && traco && caminho) {
        const c = caminho.getBoundingClientRect();
        const p = atual ? atual.getBoundingClientRect() : null;
        const fracao = p && c.height > 0 ? (p.top + Math.min(p.height, 48) / 2 - c.top) / c.height : 0;
        traco.style.strokeDashoffset = String(100 - Math.max(0, Math.min(1, fracao)) * 100);
      }
    },
    { rootMargin: "0px 0px -35% 0px" },
  );
  for (const p of paradas) observador.observe(p);
}
