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
    rotulo: "Entrevistas",
    rota: "/pedro/entrevistas",
    titulo: "Entrevistas",
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

export const appPorId = (id: string): AppDoSite => {
  const app = APPS.find((a) => a.id === id);
  if (!app) throw new Error(`app desconhecido: ${id}`);
  return app;
};
