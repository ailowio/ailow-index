### V04 — `/educacao` — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, linha V04, retomada, V03; ADR 007; brainstorm §1/§5.5; ESTRATEGIA §3.4/§4 e TRAJETORIA §1/§3 (bancada); README da série Ensinando IA.
Feito: formatos (palestra, oficina, trilha) com selo "Proposta" e sem número; áreas temáticas; palco e mídia (#044, #048, #014, #012) com o tipo real; "do outro lado da mesa" (Sebraetec, IEL, FIEC, Sebrae); kit do analista em ficha; escada com o Aprender em destaque e o Automatizar → `/consultoria`. Textos em `src/data/educacao.ts`. Sem script. Indexável, no sitemap. Versão 1.7.0.
Decisões (delegação): "ensinei a equipe a usar o ChatGPT" fora (só no áudio, sem revisão); sem CNPJ, ementa, duração ou valor; credenciamento: páginas do Sebrae por JS e editais PDF ilegíveis aqui, então "não verificado" e só "consulte a sua instituição"; sem citar a série (IA-00 só em 23/11).
Testes antigos alterados (comentário "V04 · 2026-11-20 · ADR 007 item 5"): `indexacao.test.ts` (ganha `/educacao/`); `v02-home.e2e.ts` perde o bloco de placeholder (sem rota).
Falhas no caminho: (1) "Exemplos reais" caiu no filtro de preço (`reais`): texto trocado; (2) meu E2E "sem script no main" pegou o script da seta do layout: passou a aceitar só ele (a regra "sem script próprio" fica no Vitest).
Canários (L-0006): "oficina de 4 h", "Para 40 empresários", "Sou credenciado… edital" (Vitest vermelho); destaque só pela cor (E2E vermelho). Revertidos.
Números: Vitest 402 → 462; E2E 648 → 684 passed; `/educacao` JS 0,70/10 KiB, peso 15,5/150.
Pendências: ver "Pendências do Pedro" na retomada (itens da V04).
Screenshots: `D:/apps/.playwright-mcp/auditoria/v04/`.
