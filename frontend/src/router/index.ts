import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { supabase } from '@/lib/supabase'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { publica: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', redirect: { name: 'parceiros' } },
      {
        path: 'parceiros',
        name: 'parceiros',
        component: () => import('@/pages/ParceirosPage.vue'),
      },
    ],
  },
  // Qualquer rota desconhecida cai na home (que por sua vez exige sessão).
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * Guard de autenticação.
 *
 * Rotas sem `meta.publica` exigem uma sessão válida do Supabase. Sem sessão,
 * o usuário é mandado para `/login` guardando o destino original em `redirect`.
 */
router.beforeEach(async (to) => {
  const { data } = await supabase.auth.getSession()
  const autenticado = Boolean(data.session)
  const rotaPublica = to.meta.publica === true

  if (!autenticado && !rotaPublica) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (autenticado && rotaPublica) {
    return { name: 'parceiros' }
  }

  return true
})
