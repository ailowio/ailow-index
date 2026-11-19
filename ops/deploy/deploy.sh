#!/usr/bin/env bash
# Deploy da stack `ailow-index` (S12, ADR 004). Chamado SÓ por ops/deploy/ssh-entrada.sh, que já validou a tag
# (formato, existe, está na main) e serializou com flock. Uso: deploy.sh vX.Y.Z
# Regras: OPS-04 (automatizado, repetível, serializado), OPS-05 (gatilho de reversão numérico), AUD-24/27.
#
# Fluxo: confere as variáveis e a imagem no GHCR (nada alterado se falhar) -> docker stack deploy -> espera o serviço
# convergir (1/1, imagem na tag, sem tarefa Failed nova) E 3 checagens seguidas de /health = 200 -> grava a tag em
# estado/tag-atual. Se não ficar saudável, reimplanta a tag anterior.
# Saúde: `docker exec` no container da tag nova (wget em 127.0.0.1:8080/health, já presente na imagem). Decisão: não
# puxa imagem extra (curl), não depende de DNS/certificado/Traefik (funciona antes do DNS existir) e testa o binário
# real. O caminho pelo Traefik (TLS, HSTS, redirect do www) é conferido DE FORA pelo workflow Deploy.
# Primeira implantação (sem tag anterior): se falhar, NADA é apagado (nem o serviço novo); sai 21 e um humano decide.
# Sem backup: site estático, sem dados no servidor (a imagem é reconstruível pela tag).
# Códigos de saída: 0 ok | 2 tag inválida | 10 variáveis ausentes/vazias (nada alterado) | 11 imagem não encontrada
# no registro (nada alterado) | 20 deploy falhou e a reversão FUNCIONOU | 21 falhou e a reversão não se confirmou
# (ou não há versão anterior): intervenção humana, ver docs/runbooks/rollback.md.
# Comentários sempre em linha própria.
set -euo pipefail

tag="${1:-}"
[[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "tag inválida: '${tag}'" >&2; exit 2; }

DIR="${AILOW_INDEX_DIR:-/opt/ailow-index}"
STACK="${STACK:-ailow-index}"
SVC="${STACK}_site"
ARQ_ENV="$DIR/index.env"
ARQ_TAG="${ARQ_TAG:-$DIR/estado/tag-atual}"
ARQ_STACK="${STACK_FILE:-$(cd "$(dirname "$0")/../.." && pwd)/ops/stack/index.yaml}"
ESPERA_MAX_S="${ESPERA_MAX_S:-180}"
INTERVALO_S="${INTERVALO_S:-5}"
# Gatilho de reversão (OPS-05): /health 200 em N checagens seguidas.
SAUDAVEL_N="${SAUDAVEL_N:-3}"

log() { printf '{"ts":"%s","evento":"deploy","msg":"%s"}\n' "$(date -u +%FT%TZ)" "$*"; }

valor_env() { grep "^$1=" "$ARQ_ENV" 2> /dev/null | head -n1 | cut -d= -f2- || true; }

# Só nomes e "não vazio": nunca imprime valores.
conferir_env() {
  local nome faltam=""
  [ -f "$ARQ_ENV" ] || { echo "arquivo de variáveis ausente: ${ARQ_ENV}" >&2; return 1; }
  for nome in CERT_RESOLVER PROXY_NETWORK; do
    [ -n "$(valor_env "$nome")" ] || faltam="$faltam $nome"
  done
  [ -z "$faltam" ] || { echo "variáveis obrigatórias ausentes ou vazias:${faltam}" >&2; return 1; }
}

registro() { local r; r="$(valor_env REGISTRY)"; printf '%s' "${r:-ghcr.io/ailowio}"; }

implantar() {
  set -a
  # shellcheck disable=SC1090
  . "$ARQ_ENV"
  set +a
  export TAG="$1"
  docker stack config -c "$ARQ_STACK" > /dev/null
  docker stack deploy -c "$ARQ_STACK" --with-registry-auth "$STACK" > /dev/null
}

# Tarefas em Failed/Rejected no histórico do serviço (para comparar com a contagem de antes do deploy).
falhas_tarefas() {
  docker service ps "$SVC" --format '{{.CurrentState}}' 2> /dev/null | grep -cE '^(Failed|Rejected)' || true
}

# Container em execução cuja imagem está na tag esperada.
container_da_tag() {
  docker ps --filter "label=com.docker.swarm.service.name=${SVC}" --filter status=running --format '{{.ID}} {{.Image}}' 2> /dev/null \
    | awk -v t=":$1" 'index($2, t) { print $1; exit }'
}

health_ok() {
  local cid
  cid="$(container_da_tag "$1")"
  [ -n "$cid" ] && docker exec "$cid" wget -q -O /dev/null -T 3 http://127.0.0.1:8080/health > /dev/null 2>&1
}

# 0 = saudável na tag pedida; 1 = não ficou saudável (Swarm reverteu, pausou, tarefa falhou ou estourou o tempo).
esperar_saudavel() {
  local esperada=$1 base=$2 saudaveis=0 n=0 maximo estado imagem replicas
  maximo=$((ESPERA_MAX_S / INTERVALO_S))
  while [ "$n" -lt "$maximo" ]; do
    n=$((n + 1))
    estado="$(docker service inspect "$SVC" --format '{{.UpdateStatus.State}}' 2> /dev/null || true)"
    imagem="$(docker service inspect "$SVC" --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2> /dev/null || true)"
    replicas="$(docker service ls --filter "name=${SVC}" --format '{{.Replicas}}' 2> /dev/null | head -n1 || true)"
    case "$estado" in
      rollback_completed | paused) log "serviço em estado ${estado}"; return 1 ;;
    esac
    # Estado vazio = serviço que nunca teve atualização (1ª implantação ou mesma tag): vale como convergido.
    # `rollback_started` não é falha imediata: espera o Swarm terminar a reversão (L-0023).
    if { [ "$estado" = completed ] || [ -z "$estado" ]; } && [[ "$imagem" == *":${esperada}"* ]] \
      && [ "$replicas" = "1/1" ] && [ "$(falhas_tarefas)" -le "$base" ] && health_ok "$esperada"; then
      saudaveis=$((saudaveis + 1))
    else
      saudaveis=0
    fi
    [ "$saudaveis" -ge "$SAUDAVEL_N" ] && return 0
    sleep "$INTERVALO_S"
  done
  return 1
}

# 0 = serviço fora de atualização/reversão e N checagens seguidas de saúde (qualquer tag); 1 = não estabilizou.
# Usado quando a tag pedida é a que já estava no ar: não há "versão anterior" e vale o estado real depois que o
# Swarm terminou de reverter sozinho (failure_action: rollback).
esperar_estavel() {
  local saudaveis=0 n=0 maximo estado cid
  maximo=$((ESPERA_MAX_S / INTERVALO_S))
  while [ "$n" -lt "$maximo" ]; do
    n=$((n + 1))
    estado="$(docker service inspect "$SVC" --format '{{.UpdateStatus.State}}' 2> /dev/null || true)"
    cid="$(docker ps --filter "label=com.docker.swarm.service.name=${SVC}" --filter status=running --format '{{.ID}}' 2> /dev/null | head -n1 || true)"
    case "$estado" in
      updating | rollback_started | paused) saudaveis=0 ;;
      *)
        if [ -n "$cid" ] && docker exec "$cid" wget -q -O /dev/null -T 3 http://127.0.0.1:8080/health > /dev/null 2>&1; then
          saudaveis=$((saudaveis + 1))
        else
          saudaveis=0
        fi
        ;;
    esac
    [ "$saudaveis" -ge "$SAUDAVEL_N" ] && return 0
    sleep "$INTERVALO_S"
  done
  return 1
}

resumo() {
  printf 'web=%s\n' "$(docker service inspect "$SVC" --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}')"
}

gravar_estado() {
  mkdir -p "$(dirname "$ARQ_TAG")"
  printf '%s\n' "$1" > "$ARQ_TAG"
}

anterior=""
[ -f "$ARQ_TAG" ] && anterior="$(head -n1 "$ARQ_TAG" | tr -d '[:space:]')"
inicio="$(date +%s)"
log "início tag=${tag} anterior=${anterior:-nenhuma}"

conferir_env || { log "variáveis inválidas: nada foi alterado"; exit 10; }
if ! docker manifest inspect "$(registro)/ailow-index-web:${tag}" > /dev/null 2>&1; then
  log "imagem ${tag} não encontrada no registro: nada foi alterado"
  exit 11
fi

base="$(falhas_tarefas)"
implantar "$tag"
if esperar_saudavel "$tag" "$base"; then
  gravar_estado "$tag"
  log "deploy ok tag=${tag} segundos=$(($(date +%s) - inicio))"
  resumo
  exit 0
fi

log "gatilho de reversão acionado: tag=${tag} não ficou saudável"
if [ -z "$anterior" ]; then
  # Primeira implantação: não há versão para a qual voltar e nada é apagado.
  log "REVERSÃO NÃO CONFIRMADA: primeira implantação, sem versão anterior; nada foi removido (docs/runbooks/rollback.md)"
  exit 21
elif [ "$anterior" != "$tag" ]; then
  base="$(falhas_tarefas)"
  implantar "$anterior"
  if esperar_saudavel "$anterior" "$base"; then
    log "reversão concluída para ${anterior} segundos=$(($(date +%s) - inicio))"
    resumo
    exit 20
  fi
else
  # Mesma tag: nada a restaurar. Confere o estado real e não finge nem condena (L-0023).
  if esperar_estavel; then
    log "a reaplicação de ${tag} falhou e o Swarm reverteu o serviço; a stack voltou a responder segundos=$(($(date +%s) - inicio))"
    resumo
    exit 20
  fi
fi
log "REVERSÃO NÃO CONFIRMADA: intervenção humana (docs/runbooks/rollback.md)"
exit 21
