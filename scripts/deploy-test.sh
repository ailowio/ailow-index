#!/usr/bin/env bash
# Testes do pipeline de deploy (S12, ADR 004): ops/deploy/ssh-entrada.sh e ops/deploy/deploy.sh, SEM tocar em servidor.
# `docker`, `sleep` e o resto do que o deploy chama são substituídos por atalhos em um diretório temporário.
# Uso: bash scripts/deploy-test.sh           roda os cenários
#      bash scripts/deploy-test.sh canario   prova que o teste DETECTA uma reversão quebrada (L-0006): exit 0 = detectou
set -uo pipefail
cd "$(dirname "$0")/.."
RAIZ="$PWD"
DEPLOY="${DEPLOY_SCRIPT:-$RAIZ/ops/deploy/deploy.sh}"
ENTRADA="$RAIZ/ops/deploy/ssh-entrada.sh"
STACK_REAL="$RAIZ/ops/stack/index.yaml"
FALHAS=0

afirmar() { # descrição, comando que deve dar verdadeiro
  local desc=$1; shift
  if "$@"; then echo "ok   $desc"; else echo "FALHOU $desc"; FALHAS=$((FALHAS + 1)); fi
}

novo_ambiente() {
  TMP="$(mktemp -d)"
  mkdir -p "$TMP/bin" "$TMP/idx/estado" "$TMP/estado"
  export LOG="$TMP/chamadas.log" ESTADO="$TMP/estado" AILOW_INDEX_DIR="$TMP/idx" STACK_FILE="$TMP/stack.yaml"
  : > "$LOG"; : > "$STACK_FILE"
  printf 'CERT_RESOLVER=r\nPROXY_NETWORK=n\n' > "$AILOW_INDEX_DIR/index.env"
  echo v1.0.0 > "$AILOW_INDEX_DIR/estado/tag-atual"
  echo v1.0.0 > "$ESTADO/tag"
  : > "$ESTADO/falhas"
  cat > "$TMP/bin/docker" <<'SH'
#!/usr/bin/env bash
echo "docker $*" >> "$LOG"
case "$1" in
  manifest) exit "${MANIFEST_EXIT:-0}" ;;
  stack)
    case "$2" in
      config) exit 0 ;;
      deploy)
        echo "$TAG" > "$ESTADO/tag"
        [ "$TAG" = "${TAREFA_FALHA_NA_TAG:-nenhuma}" ] && echo "Failed 2 seconds ago" >> "$ESTADO/falhas"
        exit 0 ;;
    esac ;;
  service)
    case "$2" in
      inspect)
        case "$*" in
          *UpdateStatus*)
            if [ -s "$ESTADO/seq" ]; then
              # Sequência de estados: consome uma linha por consulta e repete a última.
              head -n 1 "$ESTADO/seq"
              [ "$(wc -l < "$ESTADO/seq")" -gt 1 ] && sed -i 1d "$ESTADO/seq"
            else
              echo "${UPDATE_STATE-completed}"
            fi ;;
          *ContainerSpec.Image*) echo "ghcr.io/ailowio/ailow-index-web:$(cat "$ESTADO/tag")@sha256:webfake" ;;
        esac ;;
      ls) echo "${REPLICAS:-1/1}" ;;
      ps) cat "$ESTADO/falhas" ;;
    esac ;;
  ps) echo "abc123 ghcr.io/ailowio/ailow-index-web:$(cat "$ESTADO/tag")" ;;
  exec)
    t="$(cat "$ESTADO/tag")"
    if [ "$t" = "${FALHA_NA_TAG:-nenhuma}" ] || [ "${FALHA_NA_TAG:-}" = todas ]; then exit 1; fi
    exit 0 ;;
esac
SH
  printf '#!/usr/bin/env bash\nexit 0\n' > "$TMP/bin/sleep"
  chmod +x "$TMP/bin/"*
  export PATH="$TMP/bin:$PATH" ESPERA_MAX_S=20 INTERVALO_S=1 SAUDAVEL_N=3
  unset FALHA_NA_TAG UPDATE_STATE MANIFEST_EXIT REPLICAS TAREFA_FALHA_NA_TAG
}

chamadas() { grep -c "$1" "$LOG" || true; }
tag_no_estado() { head -n1 "$AILOW_INDEX_DIR/estado/tag-atual"; }

cenarios_entrada() {
  echo "== ssh-entrada.sh (comando forçado da chave de deploy)"
  afirmar "aceita 'deploy v1.2.3'" bash -c "SSH_ORIGINAL_COMMAND='deploy v1.2.3' ENTRADA_SO_VALIDAR=1 bash '$ENTRADA' | grep -qx v1.2.3"
  local ruim
  for ruim in "" "deploy" "deploy latest" "deploy v1.2" "deploy v1.2.3 " "deploy v1.2.3; rm -rf /" "deploy v1.2.3 && id" 'deploy $(id)' "bash -c id" "ls" "rm -rf /" "deploy v1.2.3 v1.2.4" "DEPLOY v1.2.3" "deploy  v1.2.3"; do
    afirmar "recusa '${ruim//$'\n'/\\n}'" bash -c "SSH_ORIGINAL_COMMAND=\$1 ENTRADA_SO_VALIDAR=1 bash '$ENTRADA' >/dev/null 2>&1; [ \$? -eq 2 ]" _ "$ruim"
  done
  afirmar "recusa quebra de linha" bash -c "SSH_ORIGINAL_COMMAND=\$'deploy v1.2.3\nid' ENTRADA_SO_VALIDAR=1 bash '$ENTRADA' >/dev/null 2>&1; [ \$? -eq 2 ]"
}

cenario_stack() {
  echo "== stack: docker stack config (se houver docker)"
  if command -v docker > /dev/null 2>&1 && docker stack config --help > /dev/null 2>&1; then
    afirmar "index.yaml renderiza com as variáveis obrigatórias" env TAG=v0.0.0 CERT_RESOLVER=r PROXY_NETWORK=n docker stack config -c "$STACK_REAL" > /dev/null
    afirmar "index.yaml recusa sem TAG" bash -c "! env -u TAG CERT_RESOLVER=r PROXY_NETWORK=n docker stack config -c '$STACK_REAL' > /dev/null 2>&1"
  else
    echo "pulado: sem docker (o teste Vitest test/deploy-stack.test.ts trava o conteúdo do YAML)"
  fi
}

cenario_sucesso() {
  echo "== deploy.sh: sucesso"
  novo_ambiente
  bash "$DEPLOY" v1.1.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 0" test "$rc" -eq 0
  afirmar "tag gravada no estado" test "$(tag_no_estado)" = v1.1.0
  afirmar "um único stack deploy" test "$(chamadas 'stack deploy')" -eq 1
  afirmar "a imagem foi conferida no registro ANTES do deploy" bash -c "[ \$(grep -n 'manifest inspect' '$LOG' | head -1 | cut -d: -f1) -lt \$(grep -n 'stack deploy' '$LOG' | head -1 | cut -d: -f1) ]"
  afirmar "resumo traz o digest em uso" grep -q 'web=ghcr.io/ailowio/ailow-index-web:v1.1.0@sha256:webfake' "$TMP/saida.txt"
  afirmar "nada de valor das variáveis na saída" bash -c "! grep -qE 'CERT_RESOLVER=|PROXY_NETWORK=' '$TMP/saida.txt'"
}

cenario_primeira_implantacao() {
  echo "== deploy.sh: primeira implantação ok (sem tag anterior)"
  novo_ambiente
  rm -f "$AILOW_INDEX_DIR/estado/tag-atual"
  UPDATE_STATE="" bash "$DEPLOY" v1.0.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 0" test "$rc" -eq 0
  afirmar "tag gravada (cria a pasta de estado)" test "$(tag_no_estado)" = v1.0.0
}

cenario_primeira_falha() {
  echo "== deploy.sh: primeira implantação falha => 21 e NADA é apagado"
  novo_ambiente
  rm -f "$AILOW_INDEX_DIR/estado/tag-atual"
  export FALHA_NA_TAG=v1.0.0
  bash "$DEPLOY" v1.0.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 21" test "$rc" -eq 21
  afirmar "não removeu serviço nem stack" bash -c "! grep -qE 'service rm|stack rm' '$LOG'"
  afirmar "não gravou a tag que falhou" test ! -f "$AILOW_INDEX_DIR/estado/tag-atual"
}

cenario_health_falha() {
  echo "== deploy.sh: health falha => reversão automática"
  novo_ambiente
  export FALHA_NA_TAG=v1.1.0
  bash "$DEPLOY" v1.1.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 20 (reversão executada)" test "$rc" -eq 20
  afirmar "estado continua v1.0.0" test "$(tag_no_estado)" = v1.0.0
  afirmar "dois stack deploy (nova e reversão)" test "$(chamadas 'stack deploy')" -eq 2
  afirmar "stack termina na versão anterior" test "$(cat "$ESTADO/tag")" = v1.0.0
}

cenario_tarefa_falha() {
  echo "== deploy.sh: tarefa Failed nova => não aceita como convergido, reverte"
  novo_ambiente
  export TAREFA_FALHA_NA_TAG=v1.1.0
  bash "$DEPLOY" v1.1.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 20" test "$rc" -eq 20
  afirmar "estado continua v1.0.0" test "$(tag_no_estado)" = v1.0.0
}

cenario_reversao_falha() {
  echo "== deploy.sh: a nova falha e a anterior também => 21"
  novo_ambiente
  export FALHA_NA_TAG=todas
  bash "$DEPLOY" v1.1.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 21" test "$rc" -eq 21
  afirmar "avisa que precisa de intervenção humana" grep -q 'REVERSÃO NÃO CONFIRMADA' "$TMP/saida.txt"
}

cenario_imagem_ausente() {
  echo "== deploy.sh: imagem inexistente no registro => 11, stack intacta"
  novo_ambiente
  export MANIFEST_EXIT=1
  bash "$DEPLOY" v1.1.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 11" test "$rc" -eq 11
  afirmar "nenhum stack deploy" test "$(chamadas 'stack deploy')" -eq 0
  afirmar "estado intacto" test "$(tag_no_estado)" = v1.0.0
}

cenario_env_vazio() {
  echo "== deploy.sh: variável obrigatória vazia => 10, nada alterado"
  novo_ambiente
  printf 'CERT_RESOLVER=\nPROXY_NETWORK=n\n' > "$AILOW_INDEX_DIR/index.env"
  bash "$DEPLOY" v1.1.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 10" test "$rc" -eq 10
  afirmar "nenhum stack deploy" test "$(chamadas 'stack deploy')" -eq 0
  afirmar "cita o nome, nunca valores" grep -q 'CERT_RESOLVER' "$TMP/saida.txt"
}

cenario_swarm_reverteu() {
  echo "== deploy.sh: Swarm reverte sozinho (rollback_completed) => falha sem fingir sucesso"
  novo_ambiente
  export UPDATE_STATE=rollback_completed
  bash "$DEPLOY" v1.1.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit diferente de 0" test "$rc" -ne 0
  afirmar "estado não fica na versão que falhou" test "$(tag_no_estado)" != v1.1.0
}

cenario_mesma_tag_ok() {
  echo "== deploy.sh: mesma tag, serviço sem atualização (estado vazio) => converge, exit 0"
  novo_ambiente
  export UPDATE_STATE=""
  bash "$DEPLOY" v1.0.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 0" test "$rc" -eq 0
  afirmar "um único stack deploy" test "$(chamadas 'stack deploy')" -eq 1
}

cenario_mesma_tag_swarm_reverteu() {
  echo "== deploy.sh: mesma tag, o Swarm reverte sozinho e o site volta a responder => 20, não 21"
  novo_ambiente
  printf 'rollback_started\nrollback_completed\n' > "$ESTADO/seq"
  bash "$DEPLOY" v1.0.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 20" test "$rc" -eq 20
  afirmar "não afirma reversão não confirmada" bash -c "! grep -q 'REVERSÃO NÃO CONFIRMADA' '$TMP/saida.txt'"
}

cenario_mesma_tag_sem_recuperar() {
  echo "== deploy.sh: mesma tag e o /health nunca volta => 21"
  novo_ambiente
  export FALHA_NA_TAG=v1.0.0
  bash "$DEPLOY" v1.0.0 > "$TMP/saida.txt" 2>&1; local rc=$?
  afirmar "exit 21" test "$rc" -eq 21
}

cenario_tag_invalida() {
  echo "== deploy.sh: tag inválida"
  novo_ambiente
  bash "$DEPLOY" "latest" > /dev/null 2>&1; local rc=$?
  afirmar "exit 2 e nada executado" bash -c "[ $rc -eq 2 ] && [ ! -s '$LOG' ]"
}

if [ "${1:-}" = canario ]; then
  # Mutante: a reversão não reimplanta a tag anterior. O cenário de falha de health TEM de reprovar.
  MUT="$(mktemp -d)/deploy.sh"
  sed 's/^\( *\)implantar "\$anterior"/\1true/' "$DEPLOY" > "$MUT"
  if cmp -s "$DEPLOY" "$MUT"; then echo "canário inválido: o mutante é idêntico ao original (o padrão não casou)"; exit 1; fi
  DEPLOY_SCRIPT="$MUT" bash "$0" so-saude > "$(mktemp)" 2>&1 && { echo "CANÁRIO REPROVADO: o teste não detectou a reversão quebrada"; exit 1; }
  echo "canário ok: o teste detecta a reversão quebrada"
  exit 0
fi
if [ "${1:-}" = so-saude ]; then cenario_health_falha; [ "$FALHAS" -eq 0 ]; exit; fi

cenarios_entrada
cenario_stack
cenario_sucesso
cenario_primeira_implantacao
cenario_primeira_falha
cenario_health_falha
cenario_tarefa_falha
cenario_reversao_falha
cenario_imagem_ausente
cenario_env_vazio
cenario_swarm_reverteu
cenario_mesma_tag_ok
cenario_mesma_tag_swarm_reverteu
cenario_mesma_tag_sem_recuperar
cenario_tag_invalida
if [ "$FALHAS" -eq 0 ]; then echo "TODOS OS CENÁRIOS OK"; else echo "$FALHAS verificação(ões) falharam"; exit 1; fi
