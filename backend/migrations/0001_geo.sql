-- ---------------------------------------------------------------------------
-- 0001_geo.sql: tabelas de referência geográfica (IBGE)
--
-- São os dados que já vêm prontos no desafio: 27 UFs e 5.571 municípios,
-- populados pela migration 0002_seed_ibge.sql.
--
-- Use estas tabelas como referência; NÃO precisa recriá-las nem alterá-las.
-- A modelagem do domínio do desafio (parceiros, endereços, contatos...) é
-- com você. Crie suas próprias migrations a partir de 0003_.
-- ---------------------------------------------------------------------------

-- Unidades federativas ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.uf (
    id      integer     PRIMARY KEY,              -- código IBGE da UF (ex.: 29)
    sigla   char(2)     NOT NULL UNIQUE,          -- ex.: 'BA'
    nome    text        NOT NULL,                 -- ex.: 'Bahia'
    regiao  text                                  -- ex.: 'Nordeste'
);

COMMENT ON TABLE  public.uf        IS 'Unidades federativas do Brasil (fonte: IBGE).';
COMMENT ON COLUMN public.uf.id     IS 'Código IBGE da UF.';
COMMENT ON COLUMN public.uf.sigla  IS 'Sigla de 2 letras (UF).';
COMMENT ON COLUMN public.uf.regiao IS 'Macrorregião (Norte, Nordeste, Sudeste, Sul, Centro-Oeste).';

-- Municípios ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.municipio (
    id     integer  PRIMARY KEY,                  -- código IBGE de 7 dígitos
    nome   text     NOT NULL,
    uf_id  integer  NOT NULL REFERENCES public.uf (id)
);

COMMENT ON TABLE  public.municipio       IS 'Municípios do Brasil (fonte: IBGE).';
COMMENT ON COLUMN public.municipio.id    IS 'Código IBGE do município (7 dígitos).';
COMMENT ON COLUMN public.municipio.uf_id IS 'FK para uf.id.';

-- Índices -------------------------------------------------------------------
-- O Postgres NÃO cria índice de FK automaticamente: este é o índice que faz
-- "municípios de uma UF" ficar rápido.
CREATE INDEX IF NOT EXISTS municipio_uf_id_idx ON public.municipio (uf_id);

-- Busca por nome:
--   * municipio_nome_idx        -> ordenação alfabética e igualdade
--   * municipio_nome_lower_idx  -> autocomplete case-insensitive por prefixo,
--                                  ex.: WHERE lower(nome) LIKE lower('salv') || '%'
-- (Para busca por trecho no meio da palavra, com ILIKE '%xyz%', habilite a
--  extensão pg_trgm e crie um índice GIN; ela já vem disponível na imagem.)
CREATE INDEX IF NOT EXISTS municipio_nome_idx       ON public.municipio (nome);
CREATE INDEX IF NOT EXISTS municipio_nome_lower_idx ON public.municipio (lower(nome) text_pattern_ops);

-- Permissões ----------------------------------------------------------------
-- Dados públicos de referência: leitura liberada para os roles do Supabase.
-- Sem RLS de propósito: é catálogo aberto, não dado de usuário. Nas SUAS
-- tabelas, avalie habilitar RLS conforme o que você for defender.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role';
        EXECUTE 'GRANT SELECT ON TABLE public.uf, public.municipio TO anon, authenticated, service_role';
    END IF;
END
$$;
