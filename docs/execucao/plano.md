# Plano de execução — ailow-index

Origem (plano aprovado em 2026-11-17, leitura integral só se faltar contexto):
`C:\Users\pedro\.claude\plans\pasted-content-id-80dc-pensei-aqui-swirling-gem.md`.
Dossiê de entrada: `D:\apps\_scratch\ilo-index-discovery-2026-11-17.md` (gitignored, não commitar).

Resumo: site da Ailow em `ailow.com.br` (Astro estático, tier A). `/pedro` é o portfólio do Pedro
em formato de **changelog em feed de PRs** (marca Pulso); `/`, `/pulse`, `/cloud` usam a marca Ailow.
Decisões do Pedro: ADR 001 (stack) e ADR 002 (modelo do changelog) em `docs/adr/`.

## Contrato de toda sessão

1. **Abrir em camadas:** este Contrato + a linha da sessão + Estado de retomada, e a última entrada
   de `diario/ATUAL.md`. O resto (ADRs, dossiê, plano de origem) só sob demanda. Declarar o que leu.
2. **Gate do harness:** tier A; regras e lições listadas no ADR 001 e no `CLAUDE.md` do app.
3. **Estado real:** conferir `git -C D:/apps/ailow-index rev-parse --show-toplevel` = pasta do app
   (L-0010), `git status`, versão do Node, antes de escrever.
4. **Escopo fechado:** não adiantar a próxima sessão; respeitar o "não fazer".
5. **Test-first** nas regras do changelog; cada gate novo ganha um **canário** que tem de reprovar (L-0006).
6. **Verificar:** `npm run verify` (e `npm run e2e` a partir da S04), com a saída citada no diário.
7. **Commit/push/remoto/deploy:** só com pedido explícito do Pedro. Arquivos só com Write/Edit (L-0002).
8. **Conteúdo público:** nada de IP, segredo, número de fatura, nome de cliente/prospect, projeto pessoal privado,
   grafia `ilo.`, KPI sem claim confirmado, feature que não existe. Só entra entrada `confirmado`.
9. **Fechar:** diário curto + poda + Estado de retomada sobrescrito + prompt da próxima (ou portão).
10. Identificar a LLM no fim da resposta e na linha do diário.

## Sessões

| Sessão | Título | Escopo | Pronto quando | Não fazer |
|---|---|---|---|---|
| S01 | Scaffold | git próprio, `.gitignore`, README, `CLAUDE.md`, `.env.example`, Astro estático + Biome + Vitest + `astro check`, `verify`, CI (verify + gitleaks), PR template, ADR 001/002 | `npm run verify` verde local; `rev-parse` = pasta do app | conteúdo do feed, UI, remoto, commit sem ok |
| S02 | Modelo do changelog (TDD) | schema da collection `prs`, catálogos `ferramentas`/`soft-skills`, ordem número×data, diff derivado `+ferramenta`, filtro `confirmado`, linter de conteúdo (lista de bloqueio) | testes vermelhos→verdes; 1 canário por gate reprova; fixture `pendente` fora do `dist/` | páginas visuais, conteúdo real |
| S02b | Governança do repositório (subagente) | `seguranca-sast` (Semgrep igual ao Cloud), Dependabot, threat model, inventários de auditoria, harness-adoption, CONTRIBUTORS, SECURITY, `docs/ia.md`, CHANGELOG | `verify` + gitleaks verdes; PR aberto pelo orquestrador | `src/`, `test/`, deps, licença (decisão do Pedro) |
| S03b 🚦 | Discovery do A1 + ADR 003 (subagente) | ver "Aprimoramento A1": verificar viabilidade técnica nas docs oficiais, escrever `docs/execucao/brief-app.md` e o ADR 003 **proposto** com alternativas, propor nova tabela S04+ | brief + ADR 003 proposto + tabela proposta; cada hipótese marcada verificada/não verificada com link oficial | código, dependência nova, decidir pelo Pedro |
| S03 🚦 | Curadoria com o Pedro | gerar `docs/curadoria.md` com as sementes; o Pedro marca `confirmado`/`fora`, escreve cargo e #001, escolhe fluxos n8n, passa LinkedIn; conferir handles vivos da company page | lista aprovada pelo Pedro (portão humano) | publicar algo não marcado |
| S04 | `/pedro` (Pulso) | bloco "antes do primeiro commit", feed de PRs, `/pedro/label/<id>`, painel de ferramentas derivado, fontes auto-hospedadas (OFL conferida) | E2E: sem scroll horizontal 360/1280 nos 2 temas; axe sem serious/critical; zero requisição externa | home/produtos |
| S05 🚦 | Home, `/pulse`, `/cloud` (Ailow) | copy só da tese de mar/2026 e fatos confirmados; logo com hash do oficial (L-0028); link para `cloud.ailow.com.br` | E2E verde + texto aprovado pelo Pedro | tagline inventada |
| S06 | Endurecimento | imagem nginx não-root com log JSON, orçamento de JS (≤10 KB gz/página) e peso, E2E no ambiente do CI (L-0025) | `verify` + E2E verdes no CI | deploy |
| S07 🚦 | Deploy (só com pedido) | rota Traefik, DNS pelo Pedro, workflow de deploy parado no approval (L-0027), inventários de auditoria com evidência | site no ar + smoke test | aprovar o deploy pelo Pedro |

> **S04–S07 estão suspensas** até o Pedro decidir o ADR 003 (A1 muda a navegação, o orçamento de JS e o tema).
> A curadoria (S03) segue em paralelo: o modelo do changelog (ADR 002) vale em qualquer alternativa.

## Aprimoramento A1 — "a Ailow como app" (brainstorm do Pedro, 2026-11-18)

Marca: a fala usa "ILO/Ailo"; vale **Ailow / ailow.com.br** (ADR 001, travado por teste).

**Requisitos (R) — o que o Pedro pediu:**
- **R1 Home como app:** `ailow.com.br` abre como a tela inicial de um celular novo e estilizado. Cada ícone é um "app" (Pulse, Cloud, portfólio/changelog, institucional, entrevistas/procedência, contatos). Navegar é descobrir: o que é a Ailow, quem é o fundador, o que ele faz. O institucional padrão (rotas já planejadas) vira um dos ícones.
- **R2 Experiência por plataforma:** primeiro um Android impecável (Material). Depois uma variante iOS (estilo Apple), com seletor de estilo e de tema claro/escuro no topo.
- **R3 Página de apresentação** (destino do QR): mobile first, também responsiva no desktop, animada, com rolagem. Abre com um vídeo de pitch (elevator pitch, ~1 min, produzido à parte). O avatar continua em segundo plano ou num pop-up que pode ser expandido. Ícones de contato: Instagram, telefone, sites.
- **R4 Cartão de visita (página só do Pedro):** QR Code estilizado com o logo. A página é instalável como PWA no Android e fica escondida: sem link, `noindex`. Não é protegida por login, porque não há segredo nela. Ela traz:
  - (a) botão de NFC, a estudar;
  - (b) botão de WhatsApp: digita o número, abre a conversa com a saudação pronta;
  - (c) envio de PDF, imagem ou vídeo de apresentação, se for possível.
- **R5 Entrevistas/procedência:** uma seção com as entrevistas gravadas, como prova do trabalho. Só peças com "pode mostrar".

**Hipóteses técnicas (NÃO verificadas; a S03b confirma em doc oficial):**
- **NFC (H1):** o Web NFC (Chrome no Android) grava e lê etiquetas NFC. Não existe envio celular→celular, porque o Android Beam saiu do Android 10. Alternativa: gravar a URL num cartão ou etiqueta NFC física.
- **WhatsApp (H2):** `wa.me/<número>?text=<texto>` abre a conversa com o texto, mas não anexa arquivo.
- **Arquivos (H3):** o Web Share com arquivos (`navigator.share({ files })`) manda imagem/PDF/vídeo para o WhatsApp, mas a pessoa escolhe o contato dentro do WhatsApp. Saída provável: o texto do `wa.me` leva o link da página de apresentação.
- **Vídeo (H4):** auto-hospedado (peso e banda na VPS) ou embed (requisição a terceiro, o que conflita com o critério de zero terceiros). Exige decisão.
- **PWA (H5):** precisa de manifest e service worker; a instalação pede HTTPS (S07).

**Conflitos com o plano atual (o ADR 003 resolve):**
- **Orçamento de JS:** ≤ 10 KB gzip por página não cabe numa navegação de app animada. É preciso um orçamento novo, medido, por rota.
- **UXM-\*:** passam a valer, porque agora é PWA.
  - A UXM-01 libera o scroll da apresentação (pedido explícito).
  - A UXM-03 (voltar do Android) e a UXM-10 (grade de ícones) se aplicam.
  - A **UXM-08** (paleta única) conflita com o Pulso no `/pedro`.
- **Requisições a terceiros:** o embed de vídeo e os ícones de rede social conflitam com o critério de zero terceiros.
- **Tier:** continua **A** enquanto nada gravar dado de terceiro. O número digitado no R4 vai direto para o `wa.me` e não é guardado. Guardar histórico sobe o tier.

**Decisões do Pedro (vêm no ADR 003):** alternativa de navegação (app-shell em tudo × app-shell só na home × site com página-app), estratégia de vídeo, Android primeiro e quando entra o iOS, tema do `/pedro` (Pulso × Ailow), rota do cartão, ordem das novas sessões.

## Modelo do prompt de handoff

```text
Sessão SNN de 7 — <título> (plano "ailow-index").
Plano: D:/apps/ailow-index/docs/execucao/plano.md · Diário: D:/apps/ailow-index/docs/execucao/diario/ATUAL.md
Abra em camadas (NÃO leia o plano de origem inteiro): Contrato + linha da SNN + Estado de
retomada, e a última entrada do diário. Leia o resto só se precisar.
Skills/regras desta sessão: execucao-em-sessoes, <outras>.
Escopo: <da tabela>.
Pronto quando: <da tabela>.
Não fazer: <da tabela>.
Ao terminar: diário curto + poda + Estado de retomada; entregue o prompt da SNN+1 (ou portão).
```

### Estado de retomada

- **Data:** 2026-11-18 · **Última sessão:** S03b (discovery do A1; subagente Sonnet 5.5). Entregues: `docs/execucao/brief-app.md`, `docs/adr/003-navegacao-app-pwa-e-tema-pulso.md` (**Proposto, aguardando decisão do Pedro**) e `docs/execucao/roteiro-pitch.md` (rascunho). **S03 parte 2 pendente** (grava só o que o Pedro marcou `confirmado`). S04–S07 seguem suspensas; a tabela S04+ proposta está no ADR 003. Execução: um subagente Sonnet por sessão, uma por vez, orquestrado pelo Opus.
- **GitHub:** remoto `ailowio/ailow-index` (público); `main` protegida por ruleset com 4 checks (`verify`, `seguranca-sca`, `seguranca-sast`, `seguranca-segredos`); secret scanning, push protection, Dependabot e private vulnerability reporting ligados. Mudança só por PR.
- **Ambiente:** Node 22.23.5 · Astro 7.4.12 · TypeScript 6.0.3 · `@types/node` 22.20.5 · gitleaks 8.30.1 local (winget). Exceção EX-02 (picomatch sem correção) em `docs/excecoes.md`.
- **Pendências do Pedro:**
  - decidir o ADR 003 (10 perguntas no fim dele);
  - ligar MFA no GitHub e no Registro.br;
  - passar o LinkedIn e a lista de fluxos n8n;
  - criar o `conteudo-bloqueado.local.txt` (lista bloqueada local); a curadoria foi respondida em áudio em 2026-11-18 ("nada sai"), com o resumo em `D:/apps/_scratch/ailow-index-respostas-extraidas-2026-11-18.md`, fora do git;
  - gravar o vídeo de pitch (roteiro em rascunho).
- **Pendências abertas:** `CHANGELOG.md` do sgi-copel com ano errado em v1.0.0/v1.1.0 (decisão do Pedro: não corrigir; no SGI só leitura).
