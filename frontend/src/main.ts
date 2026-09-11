import { createApp } from 'vue'

import Aura from '@primeuix/themes/aura'
// `main.ts` é uma das duas exceções da trava de importação do ESLint
// (a outra é `src/design-system/`). Aqui registramos o plugin; os
// componentes em si devem ser consumidos via wrappers do design system.
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'

import App from './App.vue'
import { router } from './router'
import './style.css'

createApp(App)
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        // Mantém a camada `primevue` depois de `theme`/`base` e antes das
        // utilities do Tailwind, para que as classes utilitárias consigam
        // sobrescrever o estilo dos componentes sem `!important`.
        cssLayer: { name: 'primevue', order: 'theme, base, primevue' },
      },
    },
  })
  .use(ToastService)
  .mount('#app')
