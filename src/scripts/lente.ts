// Diário de obra (V09): a lente "Para empresários / Para técnicos".
// Sem JS o seletor fica escondido (atributo hidden) e a página mostra a leitura técnica com o resumo rotulado.
// Com JS: mostra o seletor, aplica a lente guardada nesta sessão do navegador e troca no toque (sem cookie).
import { CHAVE_LENTE, type Lente, lerLente } from "../changelog/lente";

const raiz = document.querySelector<HTMLElement>("[data-diario]");
const seletor = document.querySelector<HTMLElement>("[data-lente-seletor]");

if (raiz && seletor) {
  const botoes = [...seletor.querySelectorAll<HTMLButtonElement>("button[data-lente-botao]")];

  const aplicar = (lente: Lente) => {
    raiz.dataset.lente = lente;
    for (const b of botoes) b.setAttribute("aria-pressed", String(b.dataset.lenteBotao === lente));
  };

  let guardada: string | null = null;
  try {
    guardada = sessionStorage.getItem(CHAVE_LENTE);
  } catch {}
  aplicar(lerLente(guardada));
  seletor.hidden = false;

  for (const b of botoes) {
    b.addEventListener("click", () => {
      const lente = lerLente(b.dataset.lenteBotao);
      aplicar(lente);
      try {
        sessionStorage.setItem(CHAVE_LENTE, lente);
      } catch {}
    });
  }
}
