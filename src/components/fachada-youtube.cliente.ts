// Fachada do YouTube (ADR 005, V07): o iframe do youtube-nocookie só é criado no toque. Até 1 KB gzip (teste).
export function ligarFachadas(doc: Document): void {
  for (const b of doc.querySelectorAll<HTMLButtonElement>("[data-youtube-play]")) {
    b.addEventListener(
      "click",
      () => {
        const caixa = b.closest<HTMLElement>("[data-youtube]");
        const id = caixa?.dataset.youtube ?? "";
        if (!caixa || !/^[\w-]{11}$/.test(id)) return;
        const f = doc.createElement("iframe");
        f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
        f.title = b.getAttribute("aria-label") ?? "YouTube";
        f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        f.allowFullscreen = true;
        caixa.replaceChildren(f);
        f.focus();
      },
      { once: true },
    );
  }
}

if (typeof document !== "undefined") ligarFachadas(document);
