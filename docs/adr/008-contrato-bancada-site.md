# ADR 008: Contrato bancada → site (pacote de publicação)

- **Status:** Aceito (2026-11-20)
- **Data:** 2026-11-20 (sessão V01 do plano v2)
- **Decisores:** Pedro (princípio "a bancada cria, o site recebe", 19/11); formato, local e tetos delegados ao agente orquestrador (2026-11-18 e 2026-11-20).
- **Tier do app:** A
- **Regras do harness relacionadas:** AUD-60..69 (pilar 4: interface com dono, contrato e evidência), ARQ-08/09, TEST-01, SEC-05, PERF
- **Depende de:** ADR 005 (mídia), ADR 006 (fatos)

## Contexto

A bancada de vídeo (`D:/videos`: roteiro, gravação, Remotion, DaVinci, legendas com AssemblyAI) produz as
peças que o site exibe. Hoje não há contrato: copiar à mão arrisca arquivo bruto, peso fora do orçamento,
vídeo sem legenda e dado em tela. `D:/videos` **não é repositório git** e tem material privado (mídia bruta,
`_catalogo`); o repositório do site é público.

### Decisões já dadas pelo Pedro

- **2026-11-19** (áudio "visão v2" e brainstorm §6): a bancada cria e edita; o site só recebe peça aprovada.
- **2026-11-19**: "YouTube não tem problema" para os vídeos longos (ADR 005).

## Decisão

1. **Pacote de publicação** = uma pasta `final/site/<slug>/` dentro do projeto da bancada, com:
   - `site.json` (obrigatório): `slug` (kebab-case), `titulo`, `tipo` (`teaser` · `episodio` · `pitch` · `entrevista`), `duracao_s`, `data` (`AAAA-MM-DD`), `aprovado_por` (`Pedro`) e `aprovado_em`, `fatos` (`#NNN[]`, ADR 006), `youtube_id` (só para `entrevista` longa), `capitulos[]` (`{ t, pergunta }`, opcional), `selo_ia` (boolean: voz ou avatar gerado por IA);
   - `video-720p.mp4` (≤ 8 MB, ≤ 60 s) **ou** `youtube_id` (vídeo longo, ADR 005);
   - `poster.webp` (≤ 80 KB, 16:9 ou 9:16);
   - `legenda.vtt` (obrigatória quando há vídeo), `capitulos.vtt` (opcional);
   - `og-1200x630.png` (opcional, ≤ 200 KB).
2. **Validação no site:** schema Zod em `src/midia/pacote.ts`; o comando `npm run importar-midia <pasta>` valida o schema, os tetos de tamanho, extensões permitidas (lista de permissões), o linter de conteúdo (ADR 002) no `site.json` e na legenda, e só então copia para `public/midia/<slug>/`. Pacote fora do contrato é recusado inteiro (nada parcial).
3. **Lado físico:** o importador lê de um **caminho local**; o CI **nunca** vê a bancada. O que entra no repo é só o resultado importado (derivado, aprovado). A bancada **não** vira git agora (lacuna 12 do brainstorm decidida como "não": evita repositório e acesso novos; revisitar se houver segundo editor).
4. **Tokens do Pulso:** `D:/videos/design-system-pulso/tokens.json` é a origem; o site guarda uma cópia versionada (`src/styles/pulso-tokens.json`) e um teste de deriva reprova se `src/styles/tokens.css` divergir da cópia. Atualizar a cópia é passo manual do importador.
5. **Aprovação:** o pacote só existe em `final/site/` depois do ok do Pedro na bancada; `aprovado_por`/`aprovado_em` são a evidência. No site, cada importação entra por PR (rastreável, AUD-20).
6. **Inventário de interfaces:** a interface I-13 "bancada → site (pacote de publicação)" entra no `docs/auditoria/inventario-interfaces.md` na V05, com dono (Pedro), contrato (este ADR + `src/midia/pacote.ts`) e evidência (PR de importação).
7. **Escopo de implementação:** V05 (contrato, importador, tokens, canário) e V06 (primeiros pacotes reais).

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| A. Cópia manual de arquivos para `public/` | Sem validação de peso, legenda e conteúdo; é o que gera o erro que o contrato evita |
| B. Versionar `D:/videos` como git privado e o CI do site ler dele | Acesso novo (token do CI para outro repo, pilar 1), repositório de mídia grande; ganho pequeno para uma pessoa |
| C. O site gerar os derivados (ffmpeg no build) | Build pesado e não determinístico; mídia bruta teria de chegar perto do repo público |
| D. Bucket/CDN externo para a mídia | Terceiro antes do toque (viola ADR 005) e conta nova |

Contraponto registrado: sem git na bancada, não há histórico do pacote do lado dela; o histórico do que foi publicado fica no PR do site.

## Consequências

- **Positivas:** toda mídia do site tem legenda, pôster e peso conhecido; nada bruto chega perto do repo público.
- **Negativas / custo:** passo de importação a cada peça; uma cópia de tokens a manter.
- **Riscos e mitigação:** pacote com dado em tela (CNPJ, valor, IP) → linter no texto + revisão humana do vídeo na bancada (o linter não vê a imagem: **limite declarado**).
- **Como saberemos que deu certo:** V05: canário (pacote com vídeo > 8 MB ou sem `.vtt`) é recusado; teste de deriva reprova token mudado.
- **Revisão em:** depois da V06.

## Revisão em 2026-11-20 (V13): fotos estáticas do Explorador

- **Decisão (orquestrador, por delegação do Pedro de 2026-11-18 e 2026-11-20):** o pacote do item 1 é de vídeo. As fotos estáticas do Explorador (`/explorar/<slug>`, modo foto) **não** passam pelo `importar-midia`: entram por **PR com revisão quadro a quadro**. Cada foto é um quadro de vídeo do acervo da bancada (só leitura), extraído com ffmpeg numa pasta temporária, recortado para tirar qualquer dado, com marcas de fabricante borradas quando legíveis, e revisada uma a uma pelo agente (sem rosto de terceiros, cliente, placa, tela com dado, número de série, IP). O PR registra, por foto, a origem (id do catálogo e instante), o texto alternativo e o que foi recortado ou borrado.
- **Tetos e lista de permissões (verificados por teste, `test/v13-fotos.test.ts`, com canário):** só `public/explorar/fotos/<slug>.webp`; cada arquivo ≤ 80 KB (o teto do pôster, `TETOS.posterBytes`), WebP de verdade (cabeçalho lido), referenciado por um `src/data/fotos/<slug>.json` (schema Zod estrito, `src/fotos/esquema.ts`) com largura e altura iguais às do arquivo; arquivo órfão, extensão fora da lista ou referência ausente reprovam o build.
- **Primeiras fotos:** V156 (quadro de comando, #047) e V385 (caixa de sensores do piloto, #081).
- **Limite declarado:** como no vídeo, o teste não vê a imagem; a revisão visual é do PR. Se as fotos passarem de poucas, revisitar: um pacote `final/site/<slug>/` com `foto.webp` e `site.json` aprovado na bancada, como o de vídeo.
- **Contraponto:** a foto não tem `aprovado_por` da bancada; a evidência de aprovação é o PR (AUD-20). Se o Pedro quiser vetar uma foto, basta remover o JSON e o WebP no mesmo PR (o teste de órfão garante que não sobra arquivo).
