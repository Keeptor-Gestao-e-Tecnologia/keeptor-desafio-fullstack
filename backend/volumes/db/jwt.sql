-- ---------------------------------------------------------------------------
-- GUCs de JWT no banco.
--
-- Algumas funções auxiliares do Supabase (auth.uid(), auth.role(), helpers de
-- RLS) leem current_setting('app.settings.jwt_secret'). Deixamos o valor
-- alinhado com o JWT_SECRET do .env.
-- ---------------------------------------------------------------------------

\set jwt_secret `echo "$JWT_SECRET"`
\set jwt_exp    `echo "$JWT_EXP"`

ALTER DATABASE :"DBNAME" SET "app.settings.jwt_secret" TO :'jwt_secret';
ALTER DATABASE :"DBNAME" SET "app.settings.jwt_exp"    TO :'jwt_exp';
