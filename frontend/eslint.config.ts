import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

/**
 * Mensagem da trava do design system.
 *
 * Ver `src/design-system/README.md` e o README.md na raiz do repositório.
 */
const PRIMEVUE_FORA_DO_DESIGN_SYSTEM =
  'Proibido importar PrimeVue direto em telas. Crie um wrapper em src/design-system/ ' +
  'e consuma o wrapper. Ver README.md § Padronização.'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // `.vue` precisa do vue-eslint-parser para que o ESLint enxergue os imports
  // dentro de `<script setup lang="ts">`. É isso que faz a trava abaixo valer
  // também nos componentes, e não só nos `.ts`.
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
  },

  // ── Trava do design system ────────────────────────────────────────────────
  // Telas não conhecem a biblioteca de UI. Todo consumo do PrimeVue passa por
  // um wrapper em `src/design-system/`.
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      // O TypeScript já resolve identificadores/globais.
      'no-undef': 'off',

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['primevue', 'primevue/*', '@primevue/*'],
              message: PRIMEVUE_FORA_DO_DESIGN_SYSTEM,
            },
          ],
        },
      ],
    },
  },

  // As DUAS únicas exceções:
  //  - `src/design-system/**` → é onde os wrappers vivem;
  //  - `src/main.ts`          → registro do plugin PrimeVue na aplicação.
  {
    files: ['src/design-system/**', 'src/main.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
)
