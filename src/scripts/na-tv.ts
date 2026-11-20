// /na-tv (V07): chips que levam o player ao início da resposta e legenda grande fora do quadro.
// Sem JS, o vídeo segue com controles nativos e a legenda nativa do <track default>.

const players = [...document.querySelectorAll<HTMLVideoElement>("video[data-player]")];

function ir(v: HTMLVideoElement, t: number) {
  // Antes dos metadados (preload="none"), o tempo vale como posição inicial; ao carregar, reaplica.
  if (v.readyState < 1) v.addEventListener("loadedmetadata", () => (v.currentTime = t), { once: true });
  v.currentTime = t;
  v.play().catch(() => {});
}

for (const b of document.querySelectorAll<HTMLButtonElement>("button[data-alvo]")) {
  b.addEventListener("click", () => {
    const v = document.getElementById(b.dataset.alvo ?? "");
    if (v instanceof HTMLVideoElement) ir(v, Number(b.dataset.t));
  });
}

for (const v of players) {
  // Um vídeo por vez.
  v.addEventListener("play", () => {
    for (const o of players) if (o !== v) o.pause();
  });
  const caixa = document.querySelector<HTMLElement>(`[data-legenda="${v.id}"]`);
  const trilha = v.textTracks[0];
  if (!caixa || !trilha) continue;
  // A legenda nativa cairia por cima da queimada no vídeo: a fala vai para a caixa grande abaixo do quadro.
  trilha.mode = "hidden";
  trilha.addEventListener("cuechange", () => {
    const cue = trilha.activeCues?.[0] as VTTCue | undefined;
    caixa.textContent = cue ? cue.text : "";
  });
}
