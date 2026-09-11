-- ---------------------------------------------------------------------------
-- Senhas dos roles internos do Supabase.
--
-- A imagem supabase/postgres já CRIA os roles (authenticator, supabase_admin,
-- supabase_auth_admin, anon, authenticated, service_role...). O que falta é
-- alinhar a senha deles com a POSTGRES_PASSWORD do .env. É assim que o
-- GoTrue, o PostgREST e o postgres-meta conseguem se conectar.
--
-- Roda em /docker-entrypoint-initdb.d/init-scripts/99-roles.sql, ou seja,
-- ANTES das migrations e só no primeiro boot.
-- ---------------------------------------------------------------------------

\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator        WITH PASSWORD :'pgpass';  -- PostgREST
ALTER USER supabase_auth_admin  WITH PASSWORD :'pgpass';  -- GoTrue
ALTER USER supabase_admin       WITH PASSWORD :'pgpass';  -- postgres-meta / Studio
