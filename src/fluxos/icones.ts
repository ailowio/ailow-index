import type { Categoria } from "./esquema";

/** Ícones próprios (traço do Pulso, viewBox 24): sem logos do n8n nem de terceiros. */
export const ICONES: Record<Categoria, string> = {
  gatilho: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  ia: '<rect x="5" y="7" width="14" height="12" rx="2"/><path d="M12 3v4M9 12h.01M15 12h.01M9 16h6"/>',
  modelo: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>',
  memoria: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  ferramenta: '<path d="M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 0-2-2z"/>',
  banco: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
  http: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  decisao: '<path d="M12 3l9 9-9 9-9-9z"/>',
  codigo: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
  mensagem: '<path d="M4 4h16v12H9l-5 4z"/>',
  espera: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  outro: '<circle cx="12" cy="12" r="3"/>',
};

export const NOMES_CATEGORIA: Record<Categoria, string> = {
  gatilho: "gatilho",
  ia: "IA",
  modelo: "modelo de IA",
  memoria: "memória",
  ferramenta: "ferramenta",
  banco: "banco de dados",
  http: "integração",
  decisao: "decisão",
  codigo: "dados e código",
  mensagem: "mensagem",
  espera: "espera",
  outro: "passo",
};
