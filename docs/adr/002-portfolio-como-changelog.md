# ADR 002: Contar a trajetória do Pedro como um changelog em feed de PRs

- **Status:** aceito (formato escolhido pelo Pedro em 2026-11-17); detalhes do schema se confirmam na S02
- **Data:** 2026-11-17
- **Decisores:** Pedro; proposta preparada pelo agente
- **Tier do app:** A
- **Regras do harness relacionadas:** ARQ-08/09, TEST-01, DOC-01

## Contexto

O Pedro quer o portfólio fora do formato "README/currículo". A ideia: tudo o que ele construiu em
tecnologia como se estivesse num único repositório, cada evolução um PR, em ordem cronológica, com
stack, ferramentas e soft skills. Começa em **fev/2025** (VPS contratada; prova privada: e-mail de
pagamento de 17/02/2025). A carreira anterior (Copel desde 2015) entra como contexto, sem número de PR.

O risco principal é credibilidade: data errada, número sem prova, feature anunciada que não existe,
nome de cliente sem autorização. A discovery (§8) lista o que não pode aparecer.

## Decisão

- **Um arquivo por PR** em `src/content/prs/NNN-slug.md`, validado por schema no build:
  `numero` (append-only), `titulo` (Conventional Commit), `data` (`AAAA-MM`), `estado`
  (`merged` | `open` | `closed`), `escopo`, `ferramentas[]` e `soft_skills[]` (referências a catálogos),
  `prova` (pública ou privada, sem número/segredo) e `verificacao` (`confirmado` | `pendente` | `fora`).
- **Só `confirmado` entra no build.** Mesmo mecanismo do `claims.csv` da série de vídeo.
- **Diff de ferramentas derivado:** o `+ ferramenta` aparece no PR em que a ferramenta surge pela 1ª vez.
- **"Ferramentas que domino" é derivado** (quantos PRs, desde qual número). O Pedro só marca as principais.
- **Linter de conteúdo** quebra o build com termo da lista de bloqueio (IP, token, `ilo.`, nomes sem ok, fatura).
- O feed mora só em `/pedro`, com a marca Pulso; o resto do site usa a marca Ailow.
- **Implementação (S02):**
  - `src/changelog/` traz `tipos.ts` (tipos de commit, escopos, categorias), `esquemas.ts` (Zod do
    frontmatter e dos catálogos), `regras.ts` (validação do feed, publicáveis, diff, painel),
    `bloqueio.ts` (linter) e `carregar.ts` (monta o feed uma vez por build e lança erro se algo falhar).
  - Os catálogos ficam em `src/data/ferramentas.json` e `src/data/soft-skills.json`.
  - `/pedro/feed.json` publica o changelog em dados (só as entradas confirmadas). Ele existe para que
    **todo build valide o feed**, mesmo antes das páginas da S04.
  - **Todas as entradas passam pelo linter, inclusive `pendente` e `fora`**, porque o repositório é público.
  - Nomes que não podem aparecer (clientes, prospects, pessoas, marca em disputa) ficam em
    `conteudo-bloqueado.local.txt`, fora do git. Versionar a lista já seria publicá-la. No CI só valem os
    padrões estruturais, e a curadoria humana (S03) cobre o resto.
  - `data: "AAAA"` (só o ano) ordena antes dos meses do mesmo ano.
- **O histórico git deste repositório não é falsificado:** os PRs do feed são conteúdo; os PRs reais
  deste repo são o desenvolvimento do site, sem commit retrodatado.

## Alternativas consideradas

1. **Releases SemVer (Keep a Changelog)** — descartada pelo Pedro: agrupa demais e perde a granularidade
   (um fluxo n8n = um PR).
2. **Híbrido (eras + PRs)** — descartada pelo Pedro em favor do feed simples.
3. **Conteúdo em CMS ou planilha** — descartada: tira a validação do build e a revisão por PR.

## Consequências

- **Positivas:** cada afirmação pública tem prova e status; o feed cresce por PR revisado.
- **Negativas / custo:** curadoria manual de cada entrada (portão S03).
- **Riscos e mitigação:** número de PR mudar depois de publicado → teste de ordem e append-only.
- **Como saberemos que deu certo:** testes da S02 com canário por gate; fixture `pendente` fora do `dist/`.
- **Revisão em:** fim da S04.
