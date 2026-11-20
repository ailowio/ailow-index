# ADR 006: Fonte única de fatos — o site é o registro mestre; a bancada cita `#NNN`

- **Status:** Aceito (2026-11-20)
- **Data:** 2026-11-20 (sessão V01 do plano v2)
- **Decisores:** Pedro (decisão de mérito em 2026-11-19); detalhes delegados ao agente orquestrador (2026-11-18 e 2026-11-20).
- **Tier do app:** A
- **Regras do harness relacionadas:** ARQ-08/09, TEST-01, DOC-01, AUD-60/62 (interface e conciliação), MC (lições "ponte")
- **Estende:** ADR 002 (feed de PRs como changelog)

## Contexto

O mesmo fato aparece em dois canais: no site (`src/content/prs/NNN-*.md`, com `verificacao` e prova) e na
bancada de vídeo (`D:/videos/_projetos/marca-pedro/serie-o-que-eu-faco/claims.csv`, com `status_declarado`
e `verificacao`). Hoje eles divergem em pelo menos três casos, levantados na colheita de 19–20/11:

| Claim da bancada | Entrada do site | Divergência (resumo) |
|---|---|---|
| C04 "começou como planilha de vendas, em dez/2025" | #020 | data e origem |
| C11 "estou testando a emissão própria de NF-e" (Em teste) | #059 | status |
| C16 "estou finalizando a implantação dos sensores" (Em implantação) | #081 | status e escopo |

`D:/videos` **não é repositório git** (conferido em 2026-11-20); o repositório do site é público.

### Decisão já dada pelo Pedro

- **2026-11-19** (lacuna 2 do brainstorm, opção A): "a fonte única dos fatos é o site. Os `.md` de `src/content/prs/` são o registro mestre, com id estável e o verbo × status do PLANO §4; o `claims.csv` da bancada cita o id (`#NNN`) em vez de reescrever o fato; um teste de consistência reprova divergência."

## Decisão

1. **Mestre:** a entrada `src/content/prs/NNN-*.md`. O número (`#NNN`) é estável e append-only (ADR 002).
2. **Verbo × status** passa a ser campo da entrada de vitrine (`status_fato`: `uso` · `validado` · `testando` · `construindo` · `proximo`), com a tabela do PLANO §4 da bancada: Em produção → "uso"; Validado em MVP → "validei num piloto"; Em teste → "estou testando"; Em desenvolvimento → "estou construindo"; Planejado → "o próximo passo é". Campo opcional no schema; obrigatório só em entrada exibida fora do feed (home, consultoria, Vem aí).
3. **A bancada cita:** o `claims.csv` ganha a coluna `fato_site` com `#NNN` (ou vazio quando o fato não está no site). O texto do claim pode ser roteiro, mas o **status** vem do site.
4. **Conciliação local, não no CI:** um script (`npm run conferir-fatos -- <caminho do claims.csv>`) lê o CSV da bancada, cruza `fato_site` com o status do site e lista divergências. Roda na máquina do Pedro; **o CI nunca lê a bancada** (ela não é git e tem material privado). O teste do CI cobre só o script com um CSV de exemplo em `test/fixtures/` (com canário de divergência).
5. **Divergência não se resolve sozinha:** o script só relata. Mudar o status de um fato exige a prova e o ok do Pedro (é o portão da V11).
6. **Escopo de implementação:** V10 (schema, script, coluna) e V11 (correções com ok).

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| B. A bancada é a mestre (`claims.csv` → gera os `.md`) | O CSV não tem prova pública, validação de schema nem revisão por PR; o site perderia o gate de build do ADR 002 |
| C. Arquivo neutro (YAML de fatos) lido pelos dois | Terceiro lugar para manter; a bancada teria de ler um arquivo do repo público ou o contrário. Mais custo para o mesmo resultado |
| D. Teste de consistência no CI | O CI precisaria ver `D:/videos` (não é git, tem material privado). Exigiria versionar a bancada ou publicar o CSV |

Contraponto registrado: sem CI, a conciliação depende de alguém rodar o script. Mitigação: a sessão que publica um pacote da bancada (ADR 008) roda o script antes de importar.

## Consequências

- **Positivas:** um fato, um status, um lugar; o vídeo e o site falam o mesmo verbo.
- **Negativas / custo:** campo a mais nas entradas de vitrine; coluna nova no CSV da bancada.
- **Riscos e mitigação:** número citado na bancada apontar para entrada que não existe → o script reprova id inexistente.
- **Como saberemos que deu certo:** o relatório da V10 lista C04, C11 e C16 como divergentes antes da V11 e zero depois.
- **Revisão em:** fim da V11.
