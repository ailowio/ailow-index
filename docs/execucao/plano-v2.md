# Plano v2 — portfólio ailow.com.br (sessões V01–V17)

Origem: auditoria de 19/11 e brainstorm do v2 (`docs/execucao/v2/BRAINSTORM-V2.md`, **local, fora do git**), decisões do Pedro de 19–20/11.
Já no ar antes deste plano: **F0** (v1.3.0: indexação, preview, WhatsApp, `/bio`, home com posicionamento) e **F5** (v1.4.0: Explorador do n8n em `/explorar`).
Diário: `docs/execucao/diario/ATUAL.md` (o mesmo do app). Plano anterior (S01–S13): `docs/execucao/plano.md`.

## Contrato de toda sessão

1. **Abrir em camadas:** este Contrato + a linha da sessão + Estado de retomada + a última entrada do diário. Os locais (`docs/execucao/v2/BRAINSTORM-V2.md`, `COLHEITA.md`, `IOT-COLHEITA.md`) e a bancada (`D:/videos/_projetos/marca-pedro/ESTRATEGIA.md`, `TRAJETORIA.md`, `D:/videos/_projetos/STATUS.md`) só nas seções que o escopo citar (Grep + Read com offset). Declarar o que leu.
2. **Gate do harness:** tier A; regras do `CLAUDE.md` do app e do `PROTOCOLO.md` (§1: tipo, tier, IDs, aceite mensurável). Lições ativas valem, em especial L-0006 (canário), L-0012 (portas 4329/4330 livres antes e depois), L-0015 (screenshot 360 e 1440, 2 temas, medir contra o contêiner que recorta), L-0025 (E2E igual ao CI).
3. **Estado real:** `git -C D:/apps/ailow-index rev-parse --show-toplevel` = pasta do app; `git status`; branch a partir da `main` atualizada.
4. **Escopo fechado:** só a sessão; respeitar o "não fazer". Material que faltar vira pendência no diário, não invenção.
5. **Test-first:** teste vermelho pelo motivo certo antes do código; teste antigo só muda por decisão do Pedro registrada (comentário com a sessão e a data).
6. **Verificar:** `npm run verify` e `npx playwright test` com exit 0 citado; peso por rota dentro do orçamento; axe limpo; 0 terceiros antes do toque.
7. **Conteúdo público:** só fato confirmado; nada de IP, segredo, número de fatura, nome de cliente/prospect sem ok, nome de pessoa da equipe, valor, grafia `ilo.`; verbo × status do PLANO da bancada ("uso", "estou testando", "estou construindo", "o próximo passo é"). O repositório é público: estratégia comercial e notas de clientes ficam em `docs/execucao/v2/` (ignorado).
8. **Mídia:** a bancada (`D:/videos`) cria e edita; o site só recebe pacote aprovado (contrato da V05). Vídeo: `preload="none"`, pôster, `.vtt`, 720p ≤ 8 MB; vídeo longo no YouTube só com fachada (0 requisição antes do toque, ADR 005).
9. **Commit, PR, merge:** delegados ao orquestrador com os 7 checks verdes (`verify`, `e2e`, `imagem`, `deploy-test` e os 3 de segurança). **Deploy:** tag `vX.Y.Z` + `Publicar imagem` + `Deploy`; aprovação pelo agente só sob a **EX-04** (até 2026-11-27, frase do Pedro no comentário); depois disso, para no approval (L-0027) e entrega o link. Smoke de fora após cada deploy.
10. **Fechar:** entrada curta no diário (≤ 2 KB) + poda (≤ 3 entradas) + Estado de retomada sobrescrito + prompt da próxima no chat (ou portão). Identificar a LLM.

## Sessões

| Sessão | Título | Escopo | Pronto quando | Não fazer |
|---|---|---|---|---|
| V01 | Decisões (ADRs 005–008) | 005 mídia (teaser próprio + YouTube com fachada; regra vira "0 terceiros antes do toque"); 006 fonte única de fatos (este repo; bancada cita `#NNN`); 007 navegação v2 (duas portas + escada; feed vira "Diário de obra", secundário; rotas novas); 008 contrato bancada → site (pacote de publicação) | 4 ADRs **aceitos**, cada um com as decisões já dadas pelo Pedro citadas com data e alternativas descartadas; CLAUDE.md do app ajustado na regra de terceiros | código |
| V02 | Home v2 | duas portas de mesmo peso ("Fazer na minha empresa" → `/consultoria`; "Levar para minha instituição" → `/educacao`) + "Conhecer a história"; fundo de pulso em SVG/CSS que "bate" no toque; apps abaixo | 360×640 sem rolagem e tudo acima do rodapé; JS da home ≤ 10 KB gz incluindo o fundo; reduced-motion zera animação (teste do estilo computado); axe limpo nos 2 temas | páginas de destino (só placeholders honestos) |
| V03 | `/consultoria` | "Faz aqui na minha": método em 4 etapas com a Copel como exemplo (cliente zero, laboratório), escada aprender → automatizar → sistema, casos (Copel; Cloud com a loja piloto), raio-x de 5 perguntas que monta o `wa.me` (nada vai a servidor) | E2E: o raio-x gera a mensagem certa sem requisição; texto só com fatos do diário de obra; slot de vídeo vazio até a V06 | preço, prazo ou número sem prova |
| V04 | `/educacao` | IA para empresários e Sistema S: o que já ensinou (equipe, palcos), formatos **como proposta**, kit do analista (formação, palcos, contato), ligação com a série Ensinando IA da bancada | requisitos de credenciamento só com fonte oficial lida (senão "não verificado"); E2E + axe; nada de carga horária ou preço inventado | simulador (V14) |
| V05 | Ponte bancada → site | contrato do pacote (`site.json` com Zod), `npm run importar-midia <pasta>` (valida, aplica tetos, copia para `public/midia/<slug>/`), tokens do Pulso da bancada → teste de deriva com `src/styles/tokens.css` | importador recusa pacote fora do contrato (canário); teste de deriva reprova token mudado; inventário de interfaces atualizado (auditoria, pilar 4) | importar vídeo real |
| V06 | Pacotes de vídeo | na bancada (só derivados em `final/site/`): Fixado 00, teasers P1–P3, E6, Chão #1 e #2 → 720p, pôster WebP, `.vtt` (AssemblyAI); importar; vídeo da `/apresentacao` (slot existente) | 0 byte de vídeo antes do toque (E2E); cada arquivo ≤ 8 MB; legenda em todos | mexer em mídia bruta ou `_catalogo` da bancada |
| V07 | Na TV (entrevistas) | arco UFC → Record → afiliada Globo; card estilo tarja de TV; teasers da V06; perguntas que pulam para o segundo exato (marcas de tempo dos transcripts); legenda grande | E2E: chip de pergunta leva o player ao tempo certo; teclado; sem marca de emissora | entrevista completa no repo |
| V08 | Chão de Fábrica | seção da série: episódios #1 e #2 (vídeos da V06) e #3 como relatório de campo (sintoma → hipótese → o que era → decisão → estado), ligados às entradas #080/#081 | textos só com fatos já confirmados no diário; o que depende da V11 fica como "em validação" | corrigir entradas do feed |
| V09 | Diário de obra | o feed vira "Diário de obra" (secundário, URL `/pedro` mantida), lente "Para empresários / Para técnicos" (campo `resumo_dono` nas entradas de vitrine), "os 3 que eu mostraria numa visita" no topo | schema aceita o campo opcional; E2E da lente nos 2 modos; contagem do feed inalterada | renumerar entradas |
| V10 | Fonte única de fatos | campo de verbo × status no schema das entradas de vitrine; script local que compara com o `claims.csv` da bancada e lista divergências (C04, C11, C16); coluna `fato_site` no `claims.csv` | relatório de divergências gerado; teste do schema; nada da bancada vai para o CI | resolver divergência sem o Pedro |
| V11 🚦 | Correções do feed (IoT) | aplicar X7–X10 da colheita (#056, #063, #081, aceite da v1.9) e as entradas novas candidatas (v1.7-gw02, gravação de campo 20–21/10) **só com o ok do Pedro** | cada correção com a prova citada; contagem e ordem do feed testadas | nada sem o ok |
| V12 | Vem aí | quadro com colunas Em uso · Em teste · Construindo · Próximo passo; cards do que está documentado (Engenharia de Produtos, "A fábrica no celular", software do Pulse, cursos de IA) | cada card com verbo honesto e link quando houver; E2E | prometer data |
| V13 | Explorador de fotos | o componente do `/explorar` com fotos: quadro de comando e caixa do gateway (frames do acervo da bancada, saneados) com pontos tocáveis | imagens ≤ 80 KB revisadas uma a uma; sem dado em tela; E2E dos pontos | foto com cliente, placa ou tela com dado |
| V14 | IA no seu negócio | simulador estático por setor (gráfica, têxtil, comércio, serviço): 3 usos reais em 3 níveis (celular · automação · sistema), cada setor numa página indexável | sem API de IA; usos tirados da prática do Pedro; E2E | inventar caso |
| V15 | Desktop por rota | layout próprio ≥ 1280 para home, `/consultoria`, `/educacao`, Na TV, Diário de obra, `/explorar`; screenshot de referência por rota | regressão visual (Playwright) em 1280 e 1440; sem rolagem horizontal | mexer no mobile aprovado |
| V16 | Engenharia exemplar | Lighthouse CI com orçamento mobile (dependência verificada no registro), página "Como este site é feito" com os gates e links do CI | Lighthouse ≥ meta acordada no ADR; canário de peso reprova | dependência sem versão fixada |
| V17 🚦 | Teste da pessoa não técnica + revisão em lote | roteiro do teste (3 pessoas leigas: em 30 s dizem o que o Pedro faz; acham o contato em ≤ 2 toques) e revisão visual do Pedro | resultado registrado; ajustes viram sessão nova | mudar critério depois do resultado (L-0017) |

> 🚦 = portão do Pedro. Backlog (fora das sessões): pulso real da Copel no fundo da home, visita 360°, respostas pré-gravadas do clone.

## Modelo do prompt de handoff

```text
Sessão VNN de 17 — <título> (plano "ailow-index v2").
Plano: D:/apps/ailow-index/docs/execucao/plano-v2.md · Diário: D:/apps/ailow-index/docs/execucao/diario/ATUAL.md
Abra em camadas (NÃO leia o plano inteiro): Contrato + linha da VNN + Estado de retomada, e a última entrada do diário.
Leia o resto (docs/execucao/v2/*, bancada) só se o escopo pedir.
Skills/regras: execucao-em-sessoes; <outras>.
Escopo: <da tabela>.
Pronto quando: <da tabela>.
Não fazer: <da tabela>.
Ao terminar: diário curto + poda + Estado de retomada; entregue o prompt da VNN+1 (ou portão).
```

### Estado de retomada

- **Data:** 2026-11-20 · **Última sessão:** V03 (`/consultoria` com método em 4 etapas e a Copel como exemplo, escada, casos Copel e Cloud "com a loja piloto", raio-x de 5 perguntas que monta o `wa.me` sem requisição; indexável e no sitemap; versão 1.6.0 sem tag). **Próxima: V04** (conteúdo de `/educacao`: tirar o noindex, a rota entra em `ROTAS_INDEXAVEIS`, a escada com o degrau seguinte linkando `/consultoria`; o teste de placeholder do `v02-home.e2e.ts` deixa de ter rota e sai com comentário "V04").
- **Modo de execução (Pedro, 2026-11-20):** o orquestrador dispara uma sessão por subagente, em sequência, e resolve os portões; subagente em **Sonnet**, **Opus só nas sessões de UI**. O subagente abre o PR; o orquestrador confere o diff e faz o merge (delegado). Deploy em lote nos marcos (depois da V04, da V09 e da V16), aprovado sob a EX-04.
- **Git:** `main` em `9e79c10` (PR #30, V02, versão 1.5.0) + PR da V03 (`feat/v03-consultoria`, versão 1.6.0, sem tag); tags `v1.3.0` e `v1.4.0` publicadas.
- **Produção:** inalterada, v1.4.0 (deploy run 44675383796, aprovado sob EX-04). EX-04 vale até 2026-11-27. Próximo deploy em lote: depois da V04.
- **Material:** vídeos finais e teasers em `D:/videos/_projetos/marca-pedro/` (`serie-entrevistas/final/publicar/`, `serie-o-que-eu-faco/`, `chao-de-fabrica/`, `ailow-projeto-final/final/publicar/`); catálogo de b-roll em `D:/videos/_catalogo/catalogo_mestre.csv` (só leitura); export do n8n em `D:/apps/_scratch/n8n/` (privado).
- **Pendências do Pedro:** bio do Instagram → `ailow.com.br/bio`; conferir o preview no WhatsApp; e-mail sem MX; ok das correções X7–X10 (V11); senhas em texto puro na pasta de IoT (S1 da colheita); gravações da lista de takes (brainstorm §7) quando der; ok (ou não) para o nome da loja piloto do Cloud no site (o `/cloud` e a #070 já o citam; a `/consultoria` não); corrigir ou nuançar a #081 ("todas as máquinas", colheita de IoT §7); foto ou clipe por etapa do método e o vídeo da consultoria (V05/V06).
