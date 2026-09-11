#!/bin/sh
# ---------------------------------------------------------------------------
# Cria o usuário demo do desafio via Admin API do GoTrue.
#
# Por que aqui e não numa migration SQL: as tabelas do schema `auth` não são
# criadas pelo Postgres. Quem as cria é o próprio GoTrue, nas migrations dele,
# que rodam DEPOIS que o Postgres termina o initdb. Um INSERT em `auth.users`
# a partir de /docker-entrypoint-initdb.d roda cedo demais: a tabela ainda não
# existe. A Admin API é o caminho canônico e, de quebra, deixa o GoTrue gerar
# o hash da senha, sem acoplamento com o schema interno dele.
#
# Idempotente: se o usuário já existe, sai com sucesso.
# ---------------------------------------------------------------------------
set -eu

API="${AUTH_URL:-http://auth:9999}"
EMAIL="${SEED_EMAIL:-desafio@keeptor.com}"
PASSWORD="${SEED_PASSWORD:-desafio123}"

log() { echo "[auth-seed] $*"; }

if [ -z "${SERVICE_ROLE_KEY:-}" ]; then
    log "ERRO: SERVICE_ROLE_KEY não definida. Sem ela a Admin API recusa a chamada."
    exit 1
fi

# O depends_on já espera o auth ficar healthy, mas uma rede recém-criada às
# vezes engasga no primeiro pacote. Custa pouco ser paciente aqui.
i=1
while [ "$i" -le 30 ]; do
    if curl -sf -o /dev/null "${API}/health"; then
        break
    fi
    log "aguardando o GoTrue responder... (${i}/30)"
    sleep 2
    i=$((i + 1))
done

payload=$(printf '{"email":"%s","password":"%s","email_confirm":true,"user_metadata":{"name":"Candidato Desafio Keeptor"}}' \
    "$EMAIL" "$PASSWORD")

resp=$(curl -s -w '\n%{http_code}' -X POST "${API}/admin/users" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload")

code=$(printf '%s' "$resp" | tail -n 1)
body=$(printf '%s' "$resp" | sed '$d')

case "$code" in
    200 | 201)
        log "usuário criado: ${EMAIL} / ${PASSWORD}"
        exit 0
        ;;
    400 | 409 | 422)
        # Duplicado é sucesso: o ambiente já está no estado desejado.
        if printf '%s' "$body" | grep -qi 'already\|exists'; then
            log "usuário ${EMAIL} já existia, nada a fazer"
            exit 0
        fi
        log "ERRO HTTP ${code}: ${body}"
        exit 1
        ;;
    *)
        log "ERRO HTTP ${code}: ${body}"
        log "Se for 401/403, a SERVICE_ROLE_KEY não bate com o JWT_SECRET do stack."
        exit 1
        ;;
esac
