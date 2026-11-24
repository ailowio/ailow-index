# Imagem de produção do site (S11). Contexto de build = raiz do repositório:
#   docker build -t ailow-index:local .
# Comentários sempre em linha própria (L-0001): o Docker não aceita comentário na mesma linha da instrução.

# ---- build: Astro gera o dist/ e o script de CSP calcula os hashes dos scripts inline ----
FROM node:22.23.4-alpine3.24 AS build
WORKDIR /site
COPY package.json package-lock.json ./
# --ignore-scripts: nenhum script de terceiros roda no build.
RUN npm ci --ignore-scripts
COPY astro.config.mjs tsconfig.json ./
COPY src src
COPY public public
# /versoes lê o CHANGELOG.md no build.
COPY CHANGELOG.md CHANGELOG.md
COPY scripts/csp.mjs scripts/csp.mjs
# V16: /como-e-feito conta arquivos de teste e lê os tetos de peso no build (src/data/como-e-feito-contagens.ts).
# Só entram no estágio de build; o runtime leva apenas o dist/.
COPY scripts/orcamentos-peso.json scripts/orcamentos-peso.json
COPY test test
COPY e2e e2e
ENV ASTRO_TELEMETRY_DISABLED=1
RUN npm run build
RUN node scripts/csp.mjs dist /site/csp-hashes.conf

# ---- runtime: nginx sem root, só o dist/ ----
# Escuta na 8080 (não precisa de privilégio). Nada de Node, npm ou código-fonte aqui.
# 2026-11-20: linha mainline 1.31.7. A 1.30.6 tem 4 CVEs CRITICAL e 2 HIGH (corrigidas no nginx 1.30.7-r0),
# e a imagem 1.30.7 não foi publicada (a "stable" do Docker Hub parou em 2026-10-19). O apk upgrade não troca
# o nginx, que vem do repositório do próprio nginx. Voltar à linha estável quando sair uma 1.30.x corrigida.
FROM nginxinc/nginx-unprivileged:1.31.7-alpine3.24 AS runtime
# Patches de segurança do Alpine publicados depois da imagem base (gate SEC-12: o Trivy barra CRITICAL/HIGH com correção).
# Root só neste passo; volta ao usuário nginx (uid 101) logo depois.
USER root
RUN apk upgrade --no-cache
USER 101
COPY ops/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY ops/web/seguranca.conf /etc/nginx/ailow/seguranca.conf
COPY --from=build /site/csp-hashes.conf /etc/nginx/ailow/csp-hashes.conf
COPY --from=build /site/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
