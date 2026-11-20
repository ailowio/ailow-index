# ADR 005: Mídia do v2 — teaser auto-hospedado e vídeo longo no YouTube com fachada

- **Status:** Aceito (2026-11-20)
- **Data:** 2026-11-20 (sessão V01 do plano v2)
- **Decisores:** Pedro (dono do produto). A escolha entre as alternativas foi delegada ao agente orquestrador ("não quero mais tomar nenhum tipo de decisão", 2026-11-18; "vc tb resolverá todos os gates", 2026-11-20). Proposta e aceite registrados pelo agente.
- **Tier do app:** A
- **Regras do harness relacionadas:** ARQ-08/09, SEC-02 (threat model), PERF (orçamento por rota), TEST-01, CI-01, AUD-60 (interfaces), DOC-02
- **Revoga em parte:** ADR 001 ("zero requisição a terceiros") e ADR 003 D2 (vídeo só auto-hospedado). O resto deles continua valendo.

## Contexto

O v2 precisa de vídeo: entrevistas de TV (até ~32 min), teasers da bancada (P1–P3, E6, Chão de Fábrica), o
Fixado 00 e o pitch do `/apresentacao`. A regra atual (CLAUDE.md, ADR 001) proíbe qualquer requisição a
terceiros e a CSP de `ops/web/seguranca.conf` tem `default-src 'self'` sem `frame-src`. Auto-hospedar 32 min
em 720p custa ~300 MB por arquivo (estimativa: 1,2 Mbit/s; não medida) e banda da VPS a cada play.

### Decisões já dadas pelo Pedro

- **2026-11-19** (áudio "visão v2", `docs/execucao/v2/transcricoes/`, local): "Se for o caso, eu posso anexar no YouTube, não tem problema no YouTube. Eu passo para lá, eu passo o link." e "o ícone da entrevista tem que ter. E apresentar de forma dinâmica".
- **2026-11-18** (ADR 003): o pitch é gravado por ele e fica no `/apresentacao`.

## Decisão

1. **Teaser curto** (≤ 60 s, 720p, ≤ 8 MB por arquivo, H.264 + AAC em `.mp4`) é **auto-hospedado** em `public/midia/<slug>/`, sempre com `preload="none"`, pôster WebP próprio e legenda `.vtt`. Vem da bancada pelo pacote do ADR 008.
2. **Vídeo longo** (> 60 s, entrevistas completas) vai para o **YouTube** e entra no site só por **fachada**: pôster próprio + botão "Assistir no YouTube"; o `<iframe>` de `https://www.youtube-nocookie.com/embed/<id>` só é criado **depois do toque**. Sem a API JS do YouTube, sem `lite-youtube` de terceiro: o componente é nosso (≤ 1 KB de JS).
3. **A regra muda** de "zero requisição a terceiros" para **"zero requisição a terceiros antes do toque"**. Fontes, imagens, ícones e scripts continuam 100% auto-hospedados; a única exceção é o player do YouTube depois do toque.
4. **CSP:** só as rotas com fachada ganham `frame-src https://www.youtube-nocookie.com` (bloco `location` próprio no nginx); as demais seguem sem `frame-src`. `script-src` não muda (o iframe roda na origem dele).
5. **Prova automática (entra na V06/V07):** E2E conta as requisições por origem antes e depois do toque: antes = 0 de terceiros e 0 byte de vídeo; depois do toque = só `youtube-nocookie.com` e domínios que ele chama. Canário: fachada que cria o iframe no carregamento tem de reprovar (L-0006).
6. **Privacidade:** o threat model e a política do site ganham a linha "ao tocar em Assistir, o Google recebe dados de quem assiste" e o texto aparece junto ao botão.
7. **Vídeo listado ou não listado no canal:** "não listado" por padrão; o Pedro pode tornar público depois sem mexer no site.

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| A. Tudo auto-hospedado (inclusive 32 min) | Banda e disco da VPS; um play inteiro ≈ 300 MB (estimativa). Arquivo grande demais para o repositório e para a imagem do nginx |
| B. Embed direto do YouTube no carregamento | Requisições e cookies de terceiro antes de qualquer ação; ~500 KB+ de JS de terceiro na rota (não medido); quebra o orçamento de peso e a CSP |
| C. `lite-youtube-embed` (pacote npm) | Resolve o mesmo, mas é dependência a mais para ~30 linhas que escrevemos; regra do app: não adicionar dependência sem necessidade |
| D. Outra plataforma (Vimeo, Bunny, R2) | Conta e custo novos (acesso novo = auditoria pilar 1) sem ganho sobre o YouTube, que o Pedro já aceitou |

Contraponto registrado: depois do toque o Google sabe quem assistiu. Aceito porque é ação explícita do visitante e o aviso fica ao lado do botão.

## Consequências

- **Positivas:** entrevistas longas cabem sem custo de banda; a home e as rotas sem vídeo continuam idênticas em peso.
- **Negativas / custo:** a CSP passa a ter duas variantes; o E2E de "sem terceiros" vira "sem terceiros antes do toque".
- **Riscos e mitigação:** iframe criado cedo por engano → E2E + canário; o YouTube tirar o vídeo do ar → a fachada mostra o pôster e o link, sem quebrar a página.
- **Inventário de interfaces:** nova interface I-12 (navegador do visitante → YouTube, só após o toque) entra na sessão que implementar a fachada.
- **Como saberemos que deu certo:** E2E "0 terceiros antes do toque" verde com canário que reprova; cada teaser ≤ 8 MB (teste de teto no importador, ADR 008).
- **Revisão em:** 2027-02-20 ou quando um vídeo do site passar de 1.000 plays/mês (custo de banda).
