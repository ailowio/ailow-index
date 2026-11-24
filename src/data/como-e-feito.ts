/**
 * V16 (2026-11-24): a página "Como este site é feito". Cada portão aponta para o arquivo do repositório que o
 * prova (`prova`), e `test/v16-como-e-feito.test.ts` confere que o arquivo existe, que o job citado existe em
 * `.github/workflows/ci.yml` e que o texto não promete o que o repositório não tem. Número só sai de dado medido
 * no build (`contagens` em src/pages/como-e-feito.astro); aqui não há número digitado.
 */
export const REPO = "https://github.com/ailowio/ailow-index";

export const url = {
  workflow: (arquivo: string) => `${REPO}/blob/main/.github/workflows/${arquivo}`,
  adr: (arquivo: string) => `${REPO}/blob/main/docs/adr/${arquivo}`,
  arquivo: (caminho: string) => `${REPO}/blob/main/${caminho}`,
};

export interface Gate {
  id: string;
  titulo: string;
  /** O que o portão faz, em uma ou duas frases, só com o que o arquivo de prova mostra. */
  texto: string;
  /** Job de `ci.yml` (nome exato) que roda o portão; vazio quando o portão não é um job do CI. */
  job?: string;
  /** Caminhos do repositório que provam o portão (devem existir). */
  prova: readonly string[];
  /** Link de saída: workflow, ADR ou arquivo. Rótulo e URL. */
  links: readonly { rotulo: string; href: string }[];
  /** Verdadeiro quando o portão ainda não bloqueia o merge (informativo). */
  informativo?: boolean;
}

export const GATES: readonly Gate[] = [
  {
    id: "verify",
    titulo: "verify: lint, tipos, testes, build e peso",
    texto:
      "Um comando só (npm run verify) roda o Biome sem aviso, o astro check, o Vitest, o build estático e o orçamento de peso por rota. Se um passo falha, o PR não passa.",
    job: "verify",
    prova: ["package.json", ".github/workflows/ci.yml"],
    links: [{ rotulo: "Workflow de CI", href: url.workflow("ci.yml") }],
  },
  {
    id: "e2e",
    titulo: "E2E no navegador, em 2 tamanhos de tela",
    texto:
      "O Playwright sobe o build de produção e testa o site de verdade, em tela de celular (360 px) e de desktop (1280 px). A mesma bateria roda local e no CI.",
    job: "e2e",
    prova: ["playwright.config.ts", "e2e"],
    links: [
      { rotulo: "Workflow de CI", href: url.workflow("ci.yml") },
      { rotulo: "Configuração do Playwright", href: url.arquivo("playwright.config.ts") },
    ],
  },
  {
    id: "axe",
    titulo: "Acessibilidade medida (axe, nos 2 temas)",
    texto:
      "As páginas passam pelo axe nos temas claro e escuro, e os testes conferem que não há rolagem horizontal em 360 px. A nota de acessibilidade do Lighthouse tem de ser a máxima.",
    prova: ["e2e/v18-trajetoria.e2e.ts", "package.json"],
    links: [{ rotulo: "Exemplo: E2E da Trajetória", href: url.arquivo("e2e/v18-trajetoria.e2e.ts") }],
  },
  {
    id: "peso",
    titulo: "Orçamento de peso por rota",
    texto:
      "Cada rota tem um teto de JavaScript e de peso total (gzip). O script lê o build e reprova se alguma rota passar. A tabela dos tetos é um arquivo do repositório.",
    job: "verify",
    prova: ["scripts/peso.mjs", "scripts/orcamentos-peso.json"],
    links: [
      { rotulo: "Tetos por rota", href: url.arquivo("scripts/orcamentos-peso.json") },
      { rotulo: "Script de peso", href: url.arquivo("scripts/peso.mjs") },
    ],
  },
  {
    id: "terceiros",
    titulo: "Zero requisição a terceiros antes do toque",
    texto:
      "Fontes, imagens, ícones e scripts são do próprio site. A única exceção é o player de vídeo, criado só depois do toque numa fachada, e o E2E conta as requisições antes e depois.",
    prova: ["docs/adr/005-midia-teaser-proprio-e-youtube-com-fachada.md"],
    links: [{ rotulo: "ADR 005", href: url.adr("005-midia-teaser-proprio-e-youtube-com-fachada.md") }],
  },
  {
    id: "seguranca",
    titulo: "Segurança: dependências, código e segredos",
    texto:
      "Três checagens separadas: auditoria das dependências de produção (npm audit), análise estática do código (Semgrep) e varredura de segredos em todo o histórico (gitleaks).",
    job: "seguranca-sca",
    prova: [".github/workflows/ci.yml", "SECURITY.md", "docs/seguranca/threat-model.md"],
    links: [
      { rotulo: "Workflow de CI", href: url.workflow("ci.yml") },
      { rotulo: "Política de segurança", href: url.arquivo("SECURITY.md") },
    ],
  },
  {
    id: "imagem",
    titulo: "Imagem de produção testada",
    texto:
      "O CI constrói a imagem do container, sobe de verdade, confere que o processo não roda como root, roda um smoke das rotas e dos cabeçalhos e passa o scan de vulnerabilidades (Trivy).",
    job: "imagem",
    prova: ["Dockerfile", "scripts/smoke-imagem.mjs"],
    links: [
      { rotulo: "Workflow de CI", href: url.workflow("ci.yml") },
      { rotulo: "Smoke da imagem", href: url.arquivo("scripts/smoke-imagem.mjs") },
    ],
  },
  {
    id: "deploy",
    titulo: "Deploy por pipeline, com aprovação de uma pessoa",
    texto:
      "A imagem é publicada a partir de uma tag, e o deploy só segue depois que uma pessoa aprova no ambiente de produção. O script faz a reversão sozinho se o site não ficar saudável, e um teste com canário prova isso.",
    job: "deploy-test",
    prova: [".github/workflows/deploy.yml", ".github/workflows/publicar.yml", "scripts/deploy-test.sh"],
    links: [
      { rotulo: "Workflow Publicar imagem", href: url.workflow("publicar.yml") },
      { rotulo: "Workflow Deploy", href: url.workflow("deploy.yml") },
      { rotulo: "ADR 004", href: url.adr("004-pipeline-de-deploy.md") },
    ],
  },
  {
    id: "lighthouse",
    titulo: "Lighthouse com orçamento de celular",
    texto:
      "Seis rotas principais passam pelo Lighthouse no perfil de celular, sobre o build estático. As metas de nota e de recurso estão num ADR. Por enquanto este portão é informativo: aparece no PR, mas ainda não bloqueia o merge.",
    job: "lighthouse",
    informativo: true,
    prova: ["lighthouserc.cjs", "docs/adr/009-lighthouse-ci-orcamento-mobile.md"],
    links: [
      { rotulo: "ADR 009", href: url.adr("009-lighthouse-ci-orcamento-mobile.md") },
      { rotulo: "Configuração", href: url.arquivo("lighthouserc.cjs") },
    ],
  },
];

export const ADRS: readonly { numero: string; titulo: string; arquivo: string }[] = [
  { numero: "001", titulo: "Site estático em Astro", arquivo: "001-site-estatico-em-astro.md" },
  { numero: "002", titulo: "Portfólio como changelog", arquivo: "002-portfolio-como-changelog.md" },
  { numero: "003", titulo: "Navegação em app, PWA e tema Pulso", arquivo: "003-navegacao-app-pwa-e-tema-pulso.md" },
  { numero: "004", titulo: "Pipeline de deploy", arquivo: "004-pipeline-de-deploy.md" },
  { numero: "005", titulo: "Mídia: teaser próprio e YouTube com fachada", arquivo: "005-midia-teaser-proprio-e-youtube-com-fachada.md" },
  { numero: "006", titulo: "Fonte única de fatos", arquivo: "006-fonte-unica-de-fatos.md" },
  { numero: "007", titulo: "Navegação v2: duas portas e escada", arquivo: "007-navegacao-v2-duas-portas-e-escada.md" },
  { numero: "008", titulo: "Contrato bancada → site", arquivo: "008-contrato-bancada-site.md" },
  { numero: "009", titulo: "Lighthouse CI com orçamento de celular", arquivo: "009-lighthouse-ci-orcamento-mobile.md" },
];

export const TOPO = {
  sobretitulo: "Engenharia aberta",
  titulo: "Como este site é feito",
  tese: "O código deste site é público. Estes são os portões que cada mudança atravessa antes de chegar ao ar, com o arquivo que prova cada um.",
};
