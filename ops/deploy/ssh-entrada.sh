#!/usr/bin/env bash
# Comando forçado da chave de deploy do ailow-index (S12, ADR 004). No authorized_keys do servidor:
#   command="/opt/ailow-index/bin/ssh-entrada.sh",restrict ssh-ed25519 AAAA... ailow-index-deploy-github
# Este arquivo é instalado UMA vez, à mão, como root (0755, dono root) em /opt/ailow-index/bin/: é a única parte que a
# chave consegue alcançar, então ele é pequeno e não executa nada vindo do cliente além de validar "deploy vX.Y.Z".
# Aceita SOMENTE o comando exato `deploy vX.Y.Z`. Depois: serializa (flock), confere que a tag existe e que o commit
# dela está na main e só então executa o deploy.sh DAQUELA tag.
# Códigos: 2 comando recusado | 3 outro deploy em andamento | 4 tag inexistente | 5 tag fora da main.
# Comentários sempre em linha própria.
set -euo pipefail

comando="${SSH_ORIGINAL_COMMAND:-}"
if [[ ! "$comando" =~ ^deploy\ (v[0-9]+\.[0-9]+\.[0-9]+)$ ]]; then
  echo "comando recusado (aceito apenas: deploy vX.Y.Z)" >&2
  exit 2
fi
tag="${BASH_REMATCH[1]}"

# Modo de teste: só valida e imprime a tag.
if [ "${ENTRADA_SO_VALIDAR:-}" = 1 ]; then
  echo "$tag"
  exit 0
fi

REPO="${AILOW_INDEX_REPO:-/opt/ailow-index/repo}"
exec 9> "${AILOW_INDEX_LOCK:-/var/lock/ailow-index-deploy.lock}"
flock -n 9 || { echo "outro deploy em andamento" >&2; exit 3; }

git -C "$REPO" fetch --quiet --tags origin main
git -C "$REPO" rev-parse -q --verify "refs/tags/${tag}^{commit}" > /dev/null || { echo "tag inexistente: ${tag}" >&2; exit 4; }
git -C "$REPO" merge-base --is-ancestor "refs/tags/${tag}" origin/main || { echo "tag fora da main: não implanto" >&2; exit 5; }
git -C "$REPO" checkout --quiet --detach "refs/tags/${tag}"
exec bash "$REPO/ops/deploy/deploy.sh" "$tag"
