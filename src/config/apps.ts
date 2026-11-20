/**
 * Os 6 "apps" da tela inicial (ADR 003, D1 = B). Ordem = ordem da grade.
 * `glifo`: miolo de um SVG 24x24 (traço, quina reta, como o Pulso); `null` = usa a logo oficial em máscara.
 */
export interface AppDoSite {
  id: string;
  rotulo: string;
  rota: string;
  /** Título curto da página interna. */
  titulo: string;
  glifo: string | null;
}

export const APPS: readonly AppDoSite[] = [
  {
    id: "pedro",
    rotulo: "Portfólio",
    rota: "/pedro",
    titulo: "Portfólio",
    glifo:
      '<circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M6 7.5v9M6 12h9.5"/>',
  },
  {
    id: "entrevistas",
    // V07 · 2026-11-20 · ADR 007 item 5: o ícone de entrevista abre /na-tv (a rota antiga responde 301).
    rotulo: "Na TV",
    rota: "/na-tv",
    titulo: "Na TV",
    glifo:
      '<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V22M8.5 22h7"/>',
  },
  { id: "pulse", rotulo: "Pulse", rota: "/pulse", titulo: "Pulse", glifo: '<path d="M2 12h5l3-8 4 16 3-8h5"/>' },
  {
    id: "cloud",
    rotulo: "Cloud",
    rota: "/cloud",
    titulo: "Cloud",
    glifo: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  },
  { id: "sobre", rotulo: "Ailow", rota: "/sobre", titulo: "Ailow", glifo: null },
  {
    id: "contato",
    rotulo: "Contato",
    rota: "/apresentacao",
    titulo: "Contato",
    glifo: '<path d="M4 4h16v12H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  },
];

/**
 * V02 (ADR 007 item 1): as duas portas da home, de mesmo peso. Não entram na grade de apps; o selo da página
 * de destino usa o mesmo glifo e o mesmo view-transition-name (a porta "abre" como um app).
 */
export interface PortaDoSite extends AppDoSite {
  /** O que a pessoa quer fazer (título da porta). */
  chamada: string;
  /** Uma linha: a oferta, com as palavras já publicadas no site. */
  oferta: string;
}

export const PORTAS: readonly PortaDoSite[] = [
  {
    id: "consultoria",
    rotulo: "Consultoria",
    rota: "/consultoria",
    titulo: "Consultoria",
    chamada: "Fazer na minha empresa",
    oferta: "Consultoria sob medida",
    glifo: '<path d="M3 21V10l6 4V10l6 4V4h6v17z"/><path d="M7 17h2M12 17h2M17 17h1"/>',
  },
  {
    id: "educacao",
    rotulo: "Educação",
    rota: "/educacao",
    titulo: "Educação",
    chamada: "Levar para minha instituição",
    oferta: "Cursos de IA",
    glifo: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
  },
];

export const appPorId = (id: string): AppDoSite => {
  const app = [...APPS, ...PORTAS].find((a) => a.id === id);
  if (!app) throw new Error(`app desconhecido: ${id}`);
  return app;
};
