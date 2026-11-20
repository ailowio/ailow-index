/**
 * Contato público (F0, 2026-11-20): o Pedro autorizou publicar o WhatsApp dele.
 * Fonte única: nenhuma página escreve o número ou o wa.me à mão.
 * O e-mail (pedro@ailow.com.br) ainda NÃO é publicado: em 2026-11-20 o domínio não tinha registro MX
 * (consulta DNS registrada no diário da F0). Publicar só depois de o Pedro confirmar que recebe.
 */
export const WHATSAPP = "5585996188080";

/** De onde a pessoa vem: vira uma marca no fim da mensagem, para o Pedro saber a origem sem analytics. */
export const ORIGENS = ["site", "apresentacao", "instagram", "consultoria", "educacao"] as const;
export type Origem = (typeof ORIGENS)[number];

const MENSAGENS: Record<Origem, string> = {
  site: "Oi, Pedro! Vi o site da Ailow e queria conversar. [site]",
  apresentacao: "Oi, Pedro! Vi a sua apresentação e queria conversar. [apresentação]",
  instagram: "Oi, Pedro! Vim pelo Instagram e queria conversar. [instagram]",
  // V02 (ADR 007): as portas da home levam a páginas próprias; cada uma marca a sua origem.
  consultoria: "Oi, Pedro! Vi a consultoria no site e queria conversar sobre a minha empresa. [consultoria]",
  educacao: "Oi, Pedro! Vi os cursos no site e queria conversar sobre a minha instituição. [educação]",
};

export const mensagemContato = (origem: Origem): string => MENSAGENS[origem];

export const linkContato = (origem: Origem): string =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagemContato(origem))}`;
