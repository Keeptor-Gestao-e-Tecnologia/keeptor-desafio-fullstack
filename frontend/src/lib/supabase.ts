import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente ausentes. Copie `frontend/.env.example` para `frontend/.env` ' +
      'e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
  )
}

/** Client único do Supabase usado por toda a aplicação. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
