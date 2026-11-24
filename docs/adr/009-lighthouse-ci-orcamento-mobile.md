# ADR 009: Lighthouse CI com orçamento de celular

- **Status:** Aceito (2026-11-24)
- **Data:** 2026-11-24 (sessão V16 do plano v2)
- **Decisores:** Pedro delegou as decisões ao orquestrador (2026-11-18 e 2026-11-20); proposta e aceite registrados pelo agente. Fica pendente do Pedro: tornar o job um check obrigatório da branch protection.
- **Tier do app:** A
- **Regras do harness relacionadas:** CI-01/05/07, SEC-10, PERF (orçamento por rota), TEST-01, DOC-02
- **Relacionado:** ADR 003 (orçamento de peso por rota, D3), ADR 005 (zero terceiros antes do toque)

## Contexto

O `npm run peso` mede bytes por rota, e o axe do E2E mede acessibilidade, mas nada mede o que a pessoa sente no celular
(tempo de pintura, deslocamento de layout, SEO técnico, boas práticas do navegador). O plano V16 pede um orçamento
mobile no CI. O site é estático (`dist/`), então dá para medir sem servidor de aplicação.

## Decisão

1. **Ferramenta:** `@lhci/cli` **0.16.1** (Lighthouse 13.6.0 embutido), devDependency com versão exata. Conferido no
   registro npm em 2026-11-24: `latest` = 0.16.1, `engines.node >=22.19.0` (o projeto exige `>=22.12.0` e o CI usa
   `.nvmrc` = 22, que resolve para a última 22.x; local, 22.23.5), licença Apache-2.0, `npm audit` sem achados após
   a instalação. A árvore traz 314 pacotes novos só de desenvolvimento (não entram na imagem nem em `--omit=dev`).
2. **Como roda:** `npm run build` e depois `npm run lighthouse` (`lhci autorun`), com `staticDistDir: ./dist` (o lhci
   serve o build com compressão, como o nginx da produção) e `upload.target: filesystem`. Nada sai do runner: sem
   servidor LHCI, sem `temporary-public-storage`, sem segredo. O Chrome vem no `ubuntu-latest`.
3. **Perfil:** mobile, o padrão do Lighthouse (emulação de celular e rede 4G lenta simulada); 3 execuções por rota.
   A agregação é a padrão do lhci, `optimistic`: a meta passa se a melhor das 3 execuções a cumprir. Motivo medido: o
   desempenho do `/pedro` oscilou de 0,89 a 0,99 na mesma máquina e no mesmo build (ruído de CPU); uma regressão real
   derruba as 3 execuções. Acessibilidade e orçamento de recurso não oscilaram.
4. **Rotas:** `/`, `/consultoria/`, `/educacao/`, `/trajetoria/`, `/pedro/`, `/explorar/`.
5. **Metas (reprovam o job):**

   | Categoria / recurso | Meta | Por quê |
   |---|---|---|
   | Desempenho | ≥ 0,90 | Medido no primeiro run real: 0,93 a 1,00 nas 6 rotas (a menor é `/pedro`, com o feed longo e deslocamento de layout de 0,13; é a rota com menos folga). |
   | Acessibilidade | **= 1** | O axe do E2E já exige 0 violações graves nos 2 temas; nota menor é regressão. Sem exceção. |
   | Boas práticas | ≥ 0,95 | Medido: 1,00. Folga para uma mudança de navegador. |
   | SEO | ≥ 0,95 | Medido: 1,00. |
   | JS transferido por rota | ≤ `jsGzKB` de `scripts/orcamentos-peso.json` | A mesma tabela do `npm run peso`; hoje o Lighthouse conta só script externo (0), e o JS inline segue guardado pelo `peso`. |
   | Peso total por rota | ≤ `pesoGzKB` da rota + 96 KiB | O `peso` exclui fontes de propósito; o Lighthouse conta. A folga é a maior soma de fontes medida (88,3 KiB) arredondada para cima. |
   | Recursos de terceiros | 0 | ADR 005; o `resource-summary:third-party:count` reprova qualquer um. |

   A categoria `agentic-browsing`, nova no Lighthouse 13, **não** é meta: não está no plano e o `/pedro` marca 0,91
   nela; fica só como leitura.
6. **Gate informativo.** O job `lighthouse` roda em todo PR e em `main`, mas **não** é check obrigatório da branch
   protection (a decisão de torná-lo obrigatório é do Pedro; nada foi mudado na proteção). Falha aparece em
   vermelho no PR sem bloquear o merge.
7. **Canários (L-0006):** um site com imagem pesada ou `aria` quebrado faz o job reprovar (relato no diário e no PR);
   o canário de peso (`orcamentos-peso.json`) reprova a rota nova se passar do teto.

## Alternativas descartadas

- **PageSpeed Insights API:** manda a URL para o Google (terceiro), precisa de chave (segredo novo no CI), mede o site
  publicado e não o PR, e o resultado varia com a rede deles.
- **Lighthouse só manual (DevTools):** sem repetição, sem gate; foi o que já existia e não pega regressão.
- **Lighthouse CLI direto (`lighthouse` + script próprio):** funciona, mas trocaria as asserções prontas, a mediana de
  execuções e o servidor estático do lhci por código novo para manter.
- **LHCI com servidor e `temporary-public-storage`:** publicaria os relatórios num armazenamento público do Google,
  contra o ADR 005 e o escopo da sessão.
- **Unlighthouse:** rastreia o site inteiro (115 páginas) e dá visão geral boa, mas sem asserções por rota nem
  orçamento de recurso; é mais lento e pesado para um gate de PR. Pode servir como relatório avulso.
- **Lighthouse em `astro preview` (porta 4330):** mais fiel ao E2E, porém sem compressão (infla o peso) e disputa a
  porta do preview de screenshot (L-0012).

## Consequências

- Mais um job de CI (~3 a 4 min). O ruído do Lighthouse (variação de CPU do runner) é mitigado pelas 3 execuções com
  agregação otimista e pela folga das metas; se o falso positivo passar de 50% dos achados, a meta é reconfigurada por PR (PROTOCOLO §7).
- Rota nova entra na lista de `lighthouserc.cjs` quando virar rota principal; a tabela de tetos continua única.
- Obrigatoriedade: o Pedro decide se o job `lighthouse` vira check exigido (hoje não é).
