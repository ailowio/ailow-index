/**
 * Contato público (F0, 2026-11-20): o Pedro autorizou publicar o WhatsApp dele.
 * Fonte única: nenhuma página escreve o número ou o wa.me à mão.
 * O e-mail (pedro@ailow.com.br) ainda NÃO é publicado: em 2026-11-20 o domínio não tinha registro MX
 * (consulta DNS registrada no diário da F0). Publicar só depois de o Pedro confirmar que recebe.
 */
export const WHATSAPP = "5585996188080";

/** De onde a pessoa vem: vira uma marca no fim da mensagem, para o Pedro saber a origem sem analytics. */
export const ORIGENS = [
  "site",
  "apresentacao",
  "instagram",
  "consultoria",
  "educacao",
  "ia-grafica",
  "ia-textil",
  "ia-comercio",
  "ia-servico",
] as const;
export type Origem = (typeof ORIGENS)[number];

const MENSAGENS: Record<Origem, string> = {
  site: "Oi, Pedro! Vi o site da Ailow e queria conversar. [site]",
  apresentacao: "Oi, Pedro! Vi a sua apresentação e queria conversar. [apresentação]",
  instagram: "Oi, Pedro! Vim pelo Instagram e queria conversar. [instagram]",
  // V02 (ADR 007): as portas da home levam a páginas próprias; cada uma marca a sua origem.
  consultoria: "Oi, Pedro! Vi a consultoria no site e queria conversar sobre a minha empresa. [consultoria]",
  educacao: "Oi, Pedro! Vi os cursos no site e queria conversar sobre a minha instituição. [educação]",
  // V14 (ADR 007 item 7): cada página da "IA no seu negócio" marca o setor de onde a pessoa veio.
  "ia-grafica": "Oi, Pedro! Vi os usos de IA para gráfica no site e queria conversar. [ia-no-seu-negocio · gráfica]",
  "ia-textil": "Oi, Pedro! Vi os usos de IA para a indústria têxtil e queria conversar. [ia-no-seu-negocio · têxtil]",
  "ia-comercio": "Oi, Pedro! Vi os usos de IA para comércio no site e queria conversar. [ia-no-seu-negocio · comércio]",
  "ia-servico": "Oi, Pedro! Vi os usos de IA para serviço no site e queria conversar. [ia-no-seu-negocio · serviço]",
};

export const mensagemContato = (origem: Origem): string => MENSAGENS[origem];

const linkWhatsapp = (texto: string): string => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;

export const linkContato = (origem: Origem): string => linkWhatsapp(mensagemContato(origem));

/**
 * V03 (2026-11-20): raio-x de 5 perguntas da /consultoria. A mensagem é montada no aparelho de quem responde
 * e só sai pelo WhatsApp, que a pessoa confere antes de enviar: nada vai a servidor, nada fica guardado.
 */
export const PERGUNTAS_RAIO_X = [
  { id: "processo", rotulo: "Processo que dói", pergunta: "Que processo mais dói hoje?", opcoes: null },
  {
    id: "medicao",
    rotulo: "Como mede hoje",
    pergunta: "Como vocês medem isso hoje?",
    opcoes: ["Caderno", "Planilha", "Sistema", "Não mede"],
  },
  {
    id: "pessoas",
    rotulo: "Pessoas",
    pergunta: "Quantas pessoas trabalham nesse processo?",
    opcoes: ["Até 5", "6 a 20", "21 a 50", "Mais de 50"],
  },
  { id: "turnos", rotulo: "Turnos", pergunta: "Quantos turnos por dia?", opcoes: ["1", "2", "3"] },
  { id: "sistema", rotulo: "Sistema atual", pergunta: "Que sistema usam hoje?", opcoes: null },
] as const;

export type PerguntaRaioX = (typeof PERGUNTAS_RAIO_X)[number];
export type RespostasRaioX = Partial<Record<PerguntaRaioX["id"], string>>;

/** Teto de cada resposta livre, em caracteres (contados por ponto de código: o corte não parte emoji). */
export const MAX_RESPOSTA_RAIO_X = 200;

function limpar(p: PerguntaRaioX, valor: string | undefined): string {
  const v = (valor ?? "").replace(/\s+/g, " ").trim();
  if (!v) return "";
  if (p.opcoes) return (p.opcoes as readonly string[]).includes(v) ? v : "";
  return Array.from(v).slice(0, MAX_RESPOSTA_RAIO_X).join("").trim();
}

export function mensagemRaioX(respostas: RespostasRaioX): string {
  const linhas = PERGUNTAS_RAIO_X.map((p) => [p.rotulo, limpar(p, respostas[p.id])] as const)
    .filter(([, v]) => v)
    .map(([rotulo, v]) => `${rotulo}: ${v}`);
  if (linhas.length === 0) return mensagemContato("consultoria");
  return ["Oi, Pedro! Fiz o raio-x da consultoria no site.", ...linhas, "[consultoria]"].join("\n");
}

export const linkRaioX = (respostas: RespostasRaioX): string => linkWhatsapp(mensagemRaioX(respostas));
