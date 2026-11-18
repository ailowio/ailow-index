# Diário — arquivo (S05)

Entradas movidas de `ATUAL.md` sem edição. Ler só sob demanda.

### S05 — Home como app + Voltar — 2026-11-18 — Claude Sonnet 5.5 (subagente)
Feito: `/` é a tela inicial (widget Ailow, grade 3x2 de 6 ícones SVG, halo amarelo e pulso de fundo, barra de gesto); `App.astro` + 6 rotas "em construção" `noindex`; transição `@view-transition` com `view-transition-name: app-<id>` (ícone↔selo do cabeçalho), "abrir" 0,94→1 e "fechar" 1,05→1 (`:root:has(.tela-home)`), desligada em movimento reduzido; trava do Voltar inline (script < 1 KB gz).
Números: testes 165→171; E2E 28→138. Home: JS 0,67 KiB gz, total 5,89 KiB (orç. 10 e 60).
Decisões: desktop = moldura de aparelho (24 rem) centralizada, não grade ampla (uma só experiência, sem scroll); tokens novos `--moldura`, `--icone-fundo`, `--icone-traco` (par no teste de contraste); hora omitida (exigiria JS); "Contato" = rótulo da rota `/apresentacao`; seta das internas: `history.back()` se o referrer é do site, senão link ao pai. Voltar: pushState de reserva no 1º gesto; `popstate` sem a marca → `forward()`. Limitação: sem gesto o navegador pode sair (igual ao Cloud).
Canário (L-0006): sem o pushState de reserva, E2E (a), (b) e (b2) reprovaram; restaurado, verdes. A transição só foi vista por regras CSS, screenshot e vídeo (webm no `_scratch`); Firefox não testado.
Pendências para a próxima: S06. Revisão visual do Pedro em lote (tema claro, transição).
Verificação: `npm run verify` e `npm run e2e` verdes; screenshots/vídeo em `D:/apps/_scratch/ailow-index-s05/`.
