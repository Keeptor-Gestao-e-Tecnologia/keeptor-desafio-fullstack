# Frontend do Desafio Fullstack Keeptor

Boilerplate mínimo: ambiente montado, login funcionando, e nada além disso.
**O resto é o seu trabalho.** Os requisitos, os critérios de avaliação e as
regras de entrega estão no `README.md` na raiz do repositório.

## Como rodar

O backend (Supabase self-hosted) precisa estar no ar antes. Veja `../backend`.

```bash
npm run setup    # na RAIZ do repositório, cria os .env
npm install      # aqui em frontend/
npm run dev
```

A aplicação sobe em <http://localhost:5173>. Credencial de demonstração já
cadastrada no banco: `desafio@keeptor.com` / `desafio123`.

## Scripts

| Comando             | O que faz                                      |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento                    |
| `npm run build`     | Checagem de tipos + build de produção           |
| `npm run preview`   | Serve o build de produção                      |
| `npm run lint`      | ESLint (inclui a trava do design system)       |
| `npm run typecheck` | Checagem de tipos isolada (`vue-tsc`)          |

## O que já vem pronto

- **Vue 3.5 + Vite 7 + TypeScript 5.8**, alias `@/` → `src/`
- **Tailwind 4** via `@tailwindcss/vite` (sem `tailwind.config.js`: no v4 a
  configuração fica no CSS, em `src/style.css`)
- **PrimeVue 4** registrado em `src/main.ts` com o preset Aura e `ToastService`
- **Supabase**: client em `src/lib/supabase.ts` lendo do `.env`
- **vue-router 4** com guard de sessão: `/login` é pública, `/parceiros` exige
  sessão válida, `/` redireciona para `/parceiros`
- **Login funcional** (`src/pages/LoginPage.vue`) via
  `supabase.auth.signInWithPassword`, com estado de carregando e erro
- **Shell autenticado** (`src/layouts/AppLayout.vue`): topbar com o usuário e
  botão de sair

## O que NÃO vem pronto (de propósito)

`/parceiros` está **vazia**. Listagem, formulário, validação, paginação,
filtros e tratamento de erro são o que está sendo avaliado.

Também não há gerenciador de estado, camada de dados, biblioteca de validação
ou de máscara instalados. Escolher essas ferramentas, e justificar a escolha,
faz parte da avaliação. Instale o que você considerar certo.

---

## ⚠️ Padronização: a trava do design system

**Importar `primevue/*` ou `@primevue/*` fora de `src/design-system/` quebra o
lint.** Não é uma convenção que dá para ignorar: é uma regra
`no-restricted-imports` no `eslint.config.ts`, e `npm run lint` falha.

```
src/pages/ParceirosPage.vue    → import DataTable from 'primevue/datatable'   ❌
src/design-system/XTabela.vue  → import DataTable from 'primevue/datatable'   ✅
src/pages/ParceirosPage.vue    → import XTabela from '@/design-system/XTabela.vue'  ✅
```

Duas exceções, e só elas: `src/design-system/**` e `src/main.ts` (registro do
plugin).

### Por quê

Telas não devem conhecer a biblioteca de UI. Com os wrappers no meio do
caminho, trocar ou atualizar o PrimeVue, padronizar espaçamento, aplicar
identidade visual e corrigir acessibilidade acontecem em **um ponto só**, em vez
de espalhados por dezenas de telas. É assim que trabalhamos em produção.

`src/design-system/` está vazia por decisão: **nenhum componente de exemplo é
fornecido.** O contrato que você desenha para os componentes (nomes, props,
eventos, slots, e quanto cada wrapper abrange) é justamente um dos pontos
avaliados. Um exemplo nosso viraria gabarito.

Por isso a tela de login usa `<input>` e `<button>` nativos com Tailwind: ela
precisava funcionar sem influenciar o seu design system.
