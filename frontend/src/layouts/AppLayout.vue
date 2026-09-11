<!--
  Shell mínimo da área autenticada: topbar com o usuário logado e botão de sair.

  É simples de propósito. Se o seu layout final pedir sidebar, breadcrumb ou
  menu, a evolução é sua. Veja o README.md na raiz do repositório.
-->
<template>
  <div class="flex min-h-full flex-col bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <span class="text-sm font-semibold tracking-tight text-slate-900">
          Desafio Fullstack Keeptor
        </span>

        <div class="flex items-center gap-3">
          <span class="hidden text-sm text-slate-600 sm:inline">{{ email }}</span>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            @click="sair"
          >
            Sair
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'

import { supabase } from '@/lib/supabase'

const router = useRouter()
const email = ref('')

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  email.value = data.user?.email ?? ''
})

async function sair() {
  await supabase.auth.signOut()
  await router.push({ name: 'login' })
}
</script>
