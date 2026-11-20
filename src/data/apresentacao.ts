/**
 * Fonte única de /apresentacao (S09).
 * Textos só com o que já está confirmado em /pedro. Sem telefone, e-mail ou WhatsApp (dado pessoal sem ok do Pedro).
 *
 * Como plugar o vídeo de pitch: ponha os arquivos em public/apresentacao/ (mp4 720p H.264 até 8 MB,
 * poster WebP, legenda .vtt) e troque `video: null` pelo objeto abaixo. Enquanto for null, a seção não existe.
 */
export interface VideoPitch {
  mp4: string;
  poster: string;
  vtt: string;
  largura: number;
  altura: number;
  /** Voz ou imagem gerada por IA (pacote da bancada, ADR 008): a página avisa ao lado do vídeo. */
  selo_ia?: boolean;
}

export interface Foto {
  src: string;
  largura: number;
  altura: number;
}

export interface Contato {
  id: "linkedin" | "instagram" | "github";
  rotulo: string;
  href: string;
}

export const apresentacao: {
  saudacao: string;
  pessoa: { nome: string; cargo: string; resumo: string; alt: string; fotoPequena: Foto; fotoGrande: Foto };
  video: VideoPitch | null;
  caminho: { rotulo: string; href: string }[];
  contatos: Contato[];
} = {
  saudacao: "Muito prazer, meu nome é Pedro. Segue meu trabalho abaixo; fico à disposição.",
  pessoa: {
    nome: "Pedro Fernandes",
    cargo: "Produtos Digitais e Operações",
    resumo:
      "Founder da Ailow desde out/2025 e sócio da Copel desde 2015. Trabalha com IoT, dados e automação no chão de fábrica.",
    alt: "Foto de Pedro Fernandes, de frente",
    fotoPequena: { src: "/pedro-foto/pedro-160.webp", largura: 160, altura: 160 },
    fotoGrande: { src: "/pedro-foto/pedro-480.webp", largura: 480, altura: 480 },
  },
  // V06 (2026-11-20): pacote "Fixado 00 · O que eu faço?" da bancada (ADR 005/008), 720x1280, 52 s, com clone e voz de IA.
  video: {
    mp4: "/midia/fixado-00-o-que-eu-faco/video-720p.mp4",
    poster: "/midia/fixado-00-o-que-eu-faco/poster.webp",
    vtt: "/midia/fixado-00-o-que-eu-faco/legenda.vtt",
    largura: 720,
    altura: 1280,
    selo_ia: true,
  },
  caminho: [
    { rotulo: "Portfólio", href: "/pedro" },
    { rotulo: "Entrevistas", href: "/pedro/entrevistas" },
    { rotulo: "Ailow", href: "/sobre" },
    { rotulo: "Pulse", href: "/pulse" },
    { rotulo: "Cloud", href: "/cloud" },
  ],
  contatos: [
    { id: "linkedin", rotulo: "LinkedIn", href: "https://www.linkedin.com/in/pedro-fernand/" },
    { id: "instagram", rotulo: "Instagram", href: "https://www.instagram.com/pedro_fernand/" },
    { id: "github", rotulo: "GitHub da Ailow", href: "https://github.com/ailowio" },
  ],
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Markup do vídeo de pitch. `null` => string vazia (a seção não é renderizada). Nunca carrega sozinho. */
export function marcaVideo(v: VideoPitch | null): string {
  if (!v) return "";
  return (
    `<video preload="none" poster="${esc(v.poster)}" controls playsinline width="${v.largura}" height="${v.altura}">` +
    `<source src="${esc(v.mp4)}" type="video/mp4">` +
    `<track kind="captions" src="${esc(v.vtt)}" srclang="pt-BR" label="Português" default>` +
    "</video>"
  );
}
