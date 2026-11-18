/**
 * Fonte única de /pedro/entrevistas (S08). `feed` é o número da entrada confirmada em src/content/prs.
 * Mais recente primeiro. Sem nome de entrevistador (direitos de veículo/programa liberados pelo Pedro).
 * Imagens em public/entrevistas/ (WebP, até 80 KB; o teste confere).
 */
export interface Entrevista {
  feed: number;
  veiculo: string;
  /** AAAA-MM-DD */
  data: string;
  /** dd/mm/aaaa */
  dataTexto: string;
  texto: string;
  imagem: string;
  largura: number;
  altura: number;
  alt: string;
}

export const entrevistas: Entrevista[] = [
  {
    feed: 37,
    veiculo: "TV Verdes Mares (afiliada Globo)",
    data: "2026-02-12",
    dataTexto: "12/02/2026",
    texto:
      "Entrevista sobre Geração Z e empreendedorismo. Pedro conta o caminho do chão de fábrica ao software e o registro da marca no INPI.",
    imagem: "/entrevistas/verdes-mares.webp",
    largura: 640,
    altura: 352,
    alt: "Pedro em entrevista à TV, com a tarja Empreendedorismo em alta na Geração Z",
  },
  {
    feed: 14,
    veiculo: "TV Record",
    data: "2025-10-03",
    dataTexto: "03/10/2025",
    texto:
      "Reportagem sobre a Feira do Empreendedor, do Sebrae. Pedro fala da relação com o Sebrae, de estagiário a cliente, e do trabalho com layout, 5S e gestão de processos.",
    imagem: "/entrevistas/record.webp",
    largura: 640,
    altura: 360,
    alt: "Pedro, de camisa branca, ao lado de máquinas têxteis durante a reportagem",
  },
  {
    feed: 12,
    veiculo: "Programa Experiências Inspiradoras, da UFC",
    data: "2025-09-05",
    dataTexto: "05/09/2025",
    texto:
      "Conversa de cerca de 32 minutos sobre música, MBA, as crises da empresa, o uso de dados e uma aquisição.",
    imagem: "/entrevistas/ufc.webp",
    largura: 640,
    altura: 360,
    alt: "Pedro conversando sentado num banco ao ar livre, em frente a um prédio histórico",
  },
];
