// ---------------------------------------------------------------------------
// npm run setup
//
// Prepara os dois arquivos .env. Existe por dois motivos:
//
//  1. `cp` não funciona no CMD do Windows. Aqui a cópia é em JavaScript e roda
//     igual em macOS, Linux e Windows.
//  2. O frontend/.env não é cópia cega do exemplo dele: a chave e a URL são
//     DERIVADAS do .env da raiz. A ANON_KEY da raiz é a fonte da verdade,
//     porque é ela que o GoTrue e o PostgREST validam. Derivar transforma um
//     erro possível (as duas divergirem) em um erro impossível.
//
// Nunca sobrescreve um .env que já existe.
// ---------------------------------------------------------------------------
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import {
  ENV_EXAMPLE,
  ENV_FILE,
  FRONT_ENV,
  FRONT_ENV_EXAMPLE,
  ROOT,
  conferirEnvFrontend,
  copiarEnvSeFaltar,
  lerEnv,
} from './lib/toolchain.mjs'

const rel = (p) => path.relative(ROOT, p)

// --- 1. o .env da raiz -----------------------------------------------------
const raiz = copiarEnvSeFaltar(ENV_EXAMPLE, ENV_FILE)
if (raiz === 'sem-modelo') {
  console.error(`Não achei ${rel(ENV_EXAMPLE)}. O repositório está incompleto.`)
  process.exit(1)
}
console.log(
  raiz === 'criado'
    ? `criado   ${rel(ENV_FILE)}  (copiado de ${rel(ENV_EXAMPLE)})`
    : `mantido  ${rel(ENV_FILE)}  (já existia, não foi sobrescrito)`,
)

// --- 2. o frontend/.env, derivado da raiz ----------------------------------
const { valores: env } = lerEnv()
const anonKey = env.ANON_KEY || ''
const porta = env.KONG_HTTP_PORT || '8000'
const urlApi = `http://localhost:${porta}`

/** Troca o valor de uma chave mantendo o resto do arquivo intacto. */
function definir(texto, chave, valor) {
  const linha = `${chave}=${valor}`
  const re = new RegExp(`^${chave}=.*$`, 'm')
  return re.test(texto) ? texto.replace(re, linha) : `${texto.trimEnd()}\n${linha}\n`
}

if (existsSync(FRONT_ENV)) {
  console.log(`mantido  ${rel(FRONT_ENV)}  (já existia, não foi sobrescrito)`)
} else if (!existsSync(FRONT_ENV_EXAMPLE)) {
  console.log(`ignorado ${rel(FRONT_ENV)}  (não encontrei ${rel(FRONT_ENV_EXAMPLE)})`)
} else {
  let texto = readFileSync(FRONT_ENV_EXAMPLE, 'utf8')
  texto = definir(texto, 'VITE_SUPABASE_URL', urlApi)
  texto = definir(texto, 'VITE_SUPABASE_ANON_KEY', anonKey)
  writeFileSync(FRONT_ENV, texto)
  console.log(`criado   ${rel(FRONT_ENV)}  (chave e URL vindas de ${rel(ENV_FILE)})`)
}

// --- 3. os dois batem? -----------------------------------------------------
// Se o frontend/.env já existia, não dá para corrigi-lo sem sobrescrever. Então
// avisamos, porque divergência aqui vira 401 sem explicação no navegador.
const conferencia = conferirEnvFrontend()
if (conferencia.estado === 'divergente') {
  console.log('')
  console.log('  ATENÇÃO: o frontend/.env não bate com o .env da raiz.')
  console.log('')
  for (const p of conferencia.problemas) {
    console.log(`  ${p.campo}`)
    console.log(`      raiz:     ${p.raiz}`)
    console.log(`      frontend: ${p.frontend}`)
    console.log(`      efeito:   ${p.efeito}`)
    console.log('')
  }
  console.log('  Para corrigir, apague o frontend/.env e rode npm run setup de novo.')
  console.log('  O setup recria o arquivo já com os valores da raiz.')
  console.log('')
  process.exit(1)
}

console.log('')
console.log('Pronto. Agora suba o ambiente:')
console.log('')
console.log('    npm run up')
console.log('    npm run smoke')
console.log('')
