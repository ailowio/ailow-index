# Diário — arquivo (S09)

Entradas movidas de `ATUAL.md` sem edição. Ler só sob demanda.

### S09 — Apresentação (R3) + avatar pop-up — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: `/apresentacao` rolável (scroll do `.conteudo`, como as demais): saudação exata, avatar redondo que abre `<dialog>` nativo (foto grande, nome, cargo, 1 frase do `/pedro`; botão fechar 48 px com `aria-label`; Esc, clique no fundo, Tab preso, foco devolvido ao gatilho), caminho com 5 links internos, 3 ícones SVG (LinkedIn, Instagram, GitHub `ailowio`) de 48 px. Fonte única `src/data/apresentacao.ts` (`video: null` + `marcaVideo()`), `src/styles/apresentacao.css`, `test/apresentacao.test.ts`, `e2e/apresentacao.e2e.ts`. Foto real: TV Verdes Mares, t=84 s, `yadif`, recorte de 780 px no rosto sem tarja, WebP 160 px (3,4 KB) e 480 px (12 KB) em `public/pedro-foto/`.
Números: Vitest 191 -> 200; E2E 258 -> 286 (7 testes x 2 temas x 2 projetos + 2 x 2 projetos). `/apresentacao` 22,06 KiB gz de 150, JS 0,87 KiB de 10.
Canários (L-0006): `preload="auto"` e `tel:` em contatos reprovaram o Vitest; "retirar" o `g.focus()` NÃO reprovou (o Chromium já devolve o foco do `<dialog>`), então o canário foi reforçado (tirar o foco do gatilho ao fechar) e reprovou os 4 E2E de avatar. Tudo revertido.
Como plugar o vídeo (Pedro grava depois): copiar para `public/apresentacao/` o mp4 (720p H.264, alvo ≤ 8 MB), o poster WebP e o `.vtt`; em `src/data/apresentacao.ts` trocar `video: null` por `{ mp4, poster, vtt, largura, altura }`. A seção aparece com `preload="none"`. Nenhum teste precisa mudar: o teste de dados confere que os 3 arquivos existem quando o vídeo está configurado (o orquestrador trocou, antes do merge, o teste que travava `video: null`).
Decisões: sem telefone, e-mail ou WhatsApp; ícone do GitHub é um glifo `</>` genérico (sem copiar a marca); Tab dentro do dialog é interceptado (1 só elemento focável).
Pendências do Pedro: ok para publicar telefone/e-mail/WhatsApp (o WhatsApp é o cartão da S10); gravar o vídeo; conferir a foto escolhida.
Pendências para a próxima: S10 (cartão PWA). Revisão visual em lote.
Verificação: `npm run verify` (200 testes, peso ok) e `npm run e2e` (286 passed) verdes; screenshots em `D:/apps/_scratch/ailow-index-s09/`.
