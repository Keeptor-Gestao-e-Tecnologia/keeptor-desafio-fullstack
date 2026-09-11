<!--
  Esta tela NÃO usa PrimeVue de propósito: o design system é o seu trabalho.

  Como o boilerplate não entrega nenhum wrapper em `src/design-system/` (e a
  trava do ESLint impede importar `primevue/*` fora de lá), o login foi feito
  com `<input>` e `<button>` nativos e Tailwind. Assim você recebe uma tela que
  funciona sem que a gente influencie as props e os eventos dos componentes que
  você vai desenhar.

  Se quiser, migre esta tela para os seus wrappers depois de criá-los. Não é
  obrigatório.
-->
<template>
  <div class="flex min-h-full items-center justify-center bg-slate-50 px-4 py-12">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Keeptor</h1>
        <p class="mt-1 text-sm text-slate-500">Desafio Fullstack</p>
      </div>

      <form
        class="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        novalidate
        @submit.prevent="entrar"
      >
        <div class="space-y-1.5">
          <label for="email" class="block text-sm font-medium text-slate-700">E-mail</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            autocomplete="username"
            required
            :disabled="carregando"
            class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-400"
            placeholder="voce@exemplo.com"
          />
        </div>

        <div class="space-y-1.5">
          <label for="senha" class="block text-sm font-medium text-slate-700">Senha</label>
          <input
            id="senha"
            v-model="senha"
            type="password"
            autocomplete="current-password"
            required
            :disabled="carregando"
            class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-400"
            placeholder="••••••••"
          />
        </div>

        <p
          v-if="erro"
          role="alert"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ erro }}
        </p>

        <button
          type="submit"
          :disabled="carregando"
          class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ carregando ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <p class="mt-4 text-center text-xs text-slate-500">
        Credencial de demonstração: <code class="text-slate-700">desafio@keeptor.com</code> /
        <code class="text-slate-700">desafio123</code>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()

const email = ref('')
const senha = ref('')
const carregando = ref(false)
const erro = ref('')

/** Traduz as mensagens mais comuns do GoTrue; o resto cai no fallback. */
const MENSAGENS: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha inválidos.',
  'Email not confirmed': 'E-mail ainda não confirmado.',
  'Failed to fetch':
    'Não foi possível conectar ao servidor. O backend está no ar? (`docker compose up -d`)',
}

function traduzir(mensagem: string) {
  return MENSAGENS[mensagem] ?? mensagem
}

async function entrar() {
  if (carregando.value) return

  carregando.value = true
  erro.value = ''

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: senha.value,
    })

    if (error) {
      erro.value = traduzir(error.message)
      return
    }

    const destino = typeof route.query.redirect === 'string' ? route.query.redirect : '/parceiros'
    await router.replace(destino)
  } catch (e) {
    erro.value = e instanceof Error ? traduzir(e.message) : 'Erro inesperado ao entrar.'
  } finally {
    carregando.value = false
  }
}
</script>
