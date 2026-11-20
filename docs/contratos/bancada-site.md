# Contrato bancada → site: como montar e importar um pacote

Decisão: ADR 008. Schema: `src/midia/pacote.ts`. Validação: `src/midia/validar.ts`. Interface I-13 do inventário.
A bancada (`D:/videos`) cria; o site só recebe peça **aprovada pelo Pedro**.

## O pacote

Uma pasta `final/site/<slug>/` (o nome da pasta = o `slug`, kebab-case), só com estes arquivos:

| Arquivo | Regra |
|---|---|
| `site.json` | obrigatório; campos abaixo; campo desconhecido é recusado |
| `video-720p.mp4` | opcional (só vídeo ≤ 60 s): ≤ 8 MB, H.264 + AAC. Exclusivo com `youtube_id` |
| `poster.webp` | obrigatório, ≤ 80 KB, 16:9 ou 9:16 |
| `legenda.vtt` | **obrigatória quando há `video-720p.mp4`** |
| `capitulos.vtt` | opcional |
| `og-1200x630.png` | opcional, ≤ 200 KB |

Qualquer outro arquivo, extensão fora de `.json .mp4 .webp .vtt .png`, subpasta ou link simbólico recusa o pacote.
Tetos em bytes decimais (8 MB = 8.000.000; 80 KB = 80.000; 200 KB = 200.000).

`site.json`: `slug`, `titulo`, `tipo` (`teaser` · `episodio` · `pitch` · `entrevista`), `duracao_s`, `data` (`AAAA-MM-DD`),
`aprovado_por` (`"Pedro"`), `aprovado_em` (`AAAA-MM-DD`), `fatos` (lista de `#NNN`, ADR 006; pode ser `[]`),
`selo_ia` (true se voz ou avatar for gerado por IA), e opcionais `youtube_id` (11 caracteres; só `entrevista`; obrigatório
se ela durar mais de 60 s) e `capitulos` (`[{ "t": segundos, "pergunta": "..." }]`, `t` ≤ `duracao_s`).
Exemplos sintéticos: `test/fixtures/midia/`.

## Importar

```
npm run importar-midia -- D:/videos/.../final/site/<slug>
```

Opções: `--substituir` (troca um slug já importado), `--destino <pasta>` (padrão `public/midia`).
Tudo ou nada: confere schema, tetos, extensões, cabeçalho de cada arquivo (mp4, webp, png, vtt), `.vtt` obrigatório, e passa o
linter de conteúdo (`src/changelog/bloqueio.ts` + lista local `conteudo-bloqueado.local.txt`) no `site.json` e nas legendas.
Qualquer erro: exit 1, lista os motivos e **nada** é copiado. Depois abra um PR com a importação: ele é a evidência (AUD-20).

## O que a máquina não vê (revise na bancada)

- A imagem: dado em tela (CNPJ, valor, IP, rosto de terceiro) só se pega olhando o vídeo e o pôster.
- A duração real do vídeo (só a declarada em `duracao_s` é conferida) e a proporção do pôster.
- Se `fatos` existem e estão confirmados no feed (ADR 006).

## Tokens do Pulso

`src/styles/pulso-tokens.json` é a cópia versionada (só nome e valor, sem as notas de uso) de `D:/videos/design-system-pulso/tokens.json`.
`test/pulso-tokens.test.ts` reprova se `src/styles/tokens.css` divergir dela. Mapeamento: `MAPA` em `src/styles/pulso-deriva.ts`
(cor, espaçamento, raio, traço, duração, easing e famílias titulo/corpo/mono; px da bancada ÷ 16 = rem). O que só existe de um lado
(canvas, sombra, `veu`, `space-12`, `dur-pulso`…) não é comparado. Divergências aceitas e declaradas: `--sinal-fraco` e `--fonte-mono`.

Atualizar a cópia (passo manual): `npm run tokens:sincronizar`, depois `npm test` e PR.
