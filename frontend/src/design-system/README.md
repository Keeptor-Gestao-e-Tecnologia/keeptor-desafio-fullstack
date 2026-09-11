# `src/design-system/`

Esta pasta está vazia de propósito. **O design system é o seu trabalho.**

## O que vive aqui

Os seus wrappers sobre o PrimeVue, ou seja, os componentes que o resto da
aplicação consome. O nome, as props, os eventos, os slots, quanto cada wrapper
abrange e como você trata o estilo são decisões suas, e estão entre os pontos
avaliados.

## A regra

**Esta é a única pasta do `src/` onde importar `primevue/*` é permitido.**

Não depende de boa vontade: o ESLint (`no-restricted-imports` em
`eslint.config.ts`) barra qualquer import do PrimeVue fora daqui e de
`src/main.ts`. Rodar `npm run lint` em uma tela que importa PrimeVue direto
falha o build.

```
src/pages/ParceirosPage.vue   →  import ... from 'primevue/datatable'   ❌ lint falha
src/design-system/XTabela.vue →  import ... from 'primevue/datatable'   ✅ permitido
src/pages/ParceirosPage.vue   →  import XTabela from '@/design-system/XTabela.vue'  ✅
```

## Por que

É assim que a Keeptor trabalha em produção: telas não conhecem a biblioteca de
UI. Trocar ou atualizar o PrimeVue, padronizar espaçamento, aplicar identidade
visual e corrigir acessibilidade acontecem em um ponto só, em vez de espalhados
por dezenas de telas.

Nenhum componente de exemplo é fornecido. Qualquer exemplo viraria gabarito, e
o que interessa é a interface que **você** desenha para os seus componentes.
