# Ambiente local: Supabase enxuto

Postgres, autenticação, API REST e Studio, em Docker.

```bash
npm run setup    # cria os arquivos .env
npm run up       # sobe o ambiente
npm run smoke    # confere se está tudo certo (10 verificações)
```

O primeiro boot demora alguns minutos, porque baixa as imagens e popula os
5.571 municípios. Depois disso, `npm run up` leva segundos.

## Endereços

| O quê                 | Onde                                              |
| --------------------- | ------------------------------------------------- |
| API (use no frontend) | `http://localhost:8000`                           |
| Supabase Studio       | `http://localhost:3000`                           |
| Postgres              | `localhost:5432`, user `postgres`, db `postgres`  |

A senha do Postgres é a `POSTGRES_PASSWORD` do `.env`.

### Usuário demo

```
e-mail: desafio@keeptor.com
senha:  desafio123
```

Já vem criado e com e-mail confirmado, então dá para logar no primeiro boot.

## Comandos

| Comando                  | O que faz                                         |
| ------------------------ | ------------------------------------------------- |
| `npm run up`             | Sobe o ambiente                                   |
| `npm run down`           | Derruba, mas **preserva** os dados                |
| `npm run reset`          | Apaga o banco e sobe do zero                      |
| `npm run status`         | Estado dos containers                             |
| `npm run logs -- db`     | Logs de um serviço (`db`, `auth`, `rest`, `kong`) |
| `npm run psql`           | Abre um psql no banco                             |
| `npm run smoke`          | As 10 verificações de ponta a ponta               |

## Migrations

Ficam em `backend/migrations/` e rodam sozinhas no primeiro boot:
`0001_geo.sql` cria `uf` e `municipio`, `0002_seed_ibge.sql` popula as 27 UFs e
os 5.571 municípios. **As suas começam em `0003_`.**

> O Postgres só executa as migrations quando o banco está vazio. Mexeu numa
> migration, ou criou uma nova? Rode `npm run reset`.

## Parece erro, mas não é

- **`desafio-auth-seed` aparece como `Exited (0)`.** É o certo: ele roda uma
  vez, cria o usuário demo e termina. Os outros seis containers ficam de pé.
- **A aba "Logs" do Studio dá erro.** Ela depende de um serviço de analytics
  que não faz parte deste ambiente. Table Editor e SQL Editor funcionam.

## Se der problema

**Porta ocupada** (`port is already allocated`): algo na sua máquina já usa a
`8000`, a `5432` ou a `3000`. Mude no `.env` (`KONG_HTTP_PORT`, `POSTGRES_PORT`,
`STUDIO_PORT`) e rode `npm run down` e `npm run up`.

**Tabela não existe, ou o login falha:** o banco provavelmente subiu de um
volume antigo, anterior às migrations. `npm run reset` resolve.

**Primeiro boot ainda em andamento:** se o `npm run smoke` reclamar que algum
serviço não ficou pronto, espere um pouco e rode de novo.

Em qualquer outro caso, rode `npm run smoke`: cada falha já vem com a causa
provável e o comando para investigar.
