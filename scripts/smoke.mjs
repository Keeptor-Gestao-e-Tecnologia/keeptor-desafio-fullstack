// ---------------------------------------------------------------------------
// npm run smoke
//
// Confere, em 10 passos, se o ambiente local está realmente funcionando: da
// infraestrutura até um login de verdade e o preflight de CORS que o navegador
// faz antes de cada chamada.
//
// Sem dependências: usa o fetch nativo do Node e node:child_process. Roda igual
// em macOS, Linux e Windows. Sai com código 0 só se as 10 passarem.
// ---------------------------------------------------------------------------
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import {
  CONTAINER_DB,
  ONDE_PROCUREI,
  PRECISAM_HEALTHY,
  ROOT,
  SEEDER,
  SERVICOS,
  acharCompose,
  acharDocker,
  conferirEnvFrontend,
  dicaDockerAusente,
  lerEnv,
  rodarCapturando,
} from './lib/toolchain.mjs'

const TOTAL = 10
let passaram = 0

const cor = process.stdout.isTTY && !process.env.NO_COLOR
const VERDE = cor ? '\x1b[32m' : ''
const VERMELHO = cor ? '\x1b[31m' : ''
const CIANO = cor ? '\x1b[1;36m' : ''
const FRACO = cor ? '\x1b[2m' : ''
const FIM = cor ? '\x1b[0m' : ''

const passo = (n, t) => console.log(`\n${CIANO}[${n}/${TOTAL}]${FIM} ${t}`)
const ok = (t) => {
  passaram += 1
  console.log(`${VERDE}✅${FIM} ${t}`)
}
const nao = (t, ...dicas) => {
  console.log(`${VERMELHO}❌${FIM} ${t}`)
  for (const d of dicas) {
    if (!d) console.log('')
    else if (d.startsWith('   ')) console.log(`        ${FRACO}${d}${FIM}`)
    else console.log(`        ${FRACO}- ${d}${FIM}`)
  }
}
const info = (t) => console.log(`        ${FRACO}${t}${FIM}`)
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
/** Achata quebras de linha para o corpo caber em uma linha do relatorio. */
const umaLinha = (t, max) => t.replace(/\s+/g, ' ').trim().slice(0, max)

function encerrar() {
  console.log('')
  if (passaram === TOTAL) {
    console.log(`${VERDE}${passaram}/${TOTAL} OK, ambiente pronto.${FIM}`)
    console.log('   App: http://localhost:5173 · login desafio@keeptor.com / desafio123')
    console.log('')
    process.exit(0)
  }
  console.log(
    `${VERMELHO}${passaram}/${TOTAL} OK${FIM}. Veja as dicas acima. Na dúvida, o atalho que` +
      ` resolve a maioria dos casos é: ${CIANO}npm run reset${FIM}`,
  )
  console.log('')
  process.exit(1)
}

function abortar() {
  console.log('')
  console.log(`${VERMELHO}${passaram}/${TOTAL} OK${FIM}. O ambiente não está pronto.`)
  console.log('')
  process.exit(1)
}

// --- configuração ----------------------------------------------------------
const { arquivo: envFile, valores: env } = lerEnv()
const portaKong = env.KONG_HTTP_PORT || '8000'
const portaStudio = env.STUDIO_PORT || '3000'
const bancoNome = env.POSTGRES_DB || 'postgres'
const bancoSenha = env.POSTGRES_PASSWORD || ''
const anonKey = env.ANON_KEY || ''
const origem = env.SITE_URL || 'http://localhost:5173'
const API = `http://localhost:${portaKong}`

console.log(`${CIANO}Smoke test do Desafio Fullstack Keeptor${FIM}`)
info(`API ${API} · Studio http://localhost:${portaStudio} · env: ${envFile || '(nenhum)'}`)

// --- helper de HTTP --------------------------------------------------------
async function http(metodo, url, headers = {}) {
  try {
    const r = await fetch(url, {
      method: metodo,
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(25000),
    })
    let corpo = ''
    try {
      corpo = await r.text()
    } catch {
      corpo = ''
    }
    return { status: r.status, headers: r.headers, corpo, erro: null }
  } catch (e) {
    return { status: 0, headers: new Headers(), corpo: '', erro: e.message || String(e) }
  }
}

// ===========================================================================
// 1. Docker
// ===========================================================================
passo(1, 'Docker instalado e daemon respondendo')
const docker = acharDocker()
if (!docker) {
  nao('Não encontrei o binário do docker em nenhum caminho conhecido.', ...dicaDockerAusente())
  info(`Procurei em: ${ONDE_PROCUREI}`)
  abortar()
}
const versao = rodarCapturando(docker, ['--version'])
if (!versao.ok) {
  nao(
    `Existe um ${docker}, mas ele não executa.`,
    'Não é o daemon parado: o próprio binário está quebrado ou ausente.',
    'Instale ou reinstale o Docker Desktop: https://www.docker.com/products/docker-desktop',
  )
  abortar()
}
if (!rodarCapturando(docker, ['info']).ok) {
  nao(
    `O docker está instalado (${versao.stdout}) mas o daemon não responde.`,
    'Abra o Docker Desktop e espere o ícone da baleia parar de animar.',
    `Para investigar: ${docker} info`,
  )
  abortar()
}
const compose = acharCompose(docker)
if (!compose) {
  nao(
    'O docker responde, mas não achei o Docker Compose.',
    'Sem ele nenhum comando do ambiente roda. Reinstale o Docker Desktop.',
    `Para confirmar: ${docker} compose version`,
  )
  abortar()
}
ok(`docker ok (${versao.stdout}) · compose: ${compose.nome}`)

// ===========================================================================
// 2. Containers de pé + seeder concluído
// ===========================================================================
passo(2, 'Os 6 serviços de pé + o seeder do usuário demo concluído')

const estado = (nome) => {
  const r = rodarCapturando(docker, ['inspect', '-f', '{{.State.Status}}', nome])
  return r.ok ? r.stdout : 'ausente'
}
const saude = (nome) => {
  const r = rodarCapturando(docker, [
    'inspect',
    '-f',
    '{{if .State.Health}}{{.State.Health.Status}}{{else}}sem-healthcheck{{end}}',
    nome,
  ])
  return r.ok ? r.stdout : 'ausente'
}
const estadoSeeder = () => {
  const st = estado(SEEDER)
  if (st === 'ausente') return 'ausente'
  if (st !== 'exited') return 'pendente'
  const r = rodarCapturando(docker, ['inspect', '-f', '{{.State.ExitCode}}', SEEDER])
  return r.ok && r.stdout === '0' ? 'ok' : `falhou:${r.stdout || '?'}`
}

const limite = Number(process.env.SMOKE_TIMEOUT || 180)
const inicio = Date.now()
let backoff = 2
let pendentes = []
let seeder = 'pendente'

for (;;) {
  pendentes = []
  for (const c of SERVICOS) {
    const st = estado(c)
    if (st !== 'running') {
      pendentes.push(`${c}(${st})`)
      continue
    }
    if (PRECISAM_HEALTHY.includes(c)) {
      const h = saude(c)
      if (h !== 'healthy' && h !== 'sem-healthcheck') pendentes.push(`${c}(${h})`)
    }
  }
  seeder = estadoSeeder()
  if (seeder === 'pendente') pendentes.push(`${SEEDER}(rodando)`)
  else if (seeder === 'ausente') pendentes.push(`${SEEDER}(ainda não criado)`)

  const decorrido = Math.round((Date.now() - inicio) / 1000)
  if (pendentes.length === 0) break
  if (decorrido >= limite) break

  const linha = `aguardando ${decorrido}s/${limite}s: ${pendentes.join(' ')}`
  if (process.stdout.isTTY) process.stdout.write(`\r        ${FRACO}${linha}${FIM}   `)
  else console.log(`        ${linha}`)

  await espera(backoff * 1000)
  if (backoff < 10) backoff += 2
}
if (process.stdout.isTTY) process.stdout.write(`\r${' '.repeat(100)}\r`)

// Nem todo serviço tem healthcheck, e isso é esperado: a imagem do PostgREST
// em amd64 é scratch, sem shell, então ela não pode ter um. O relatório conta
// os dois grupos em vez de afirmar que estão "todos healthy".
const situacao = SERVICOS.map((c) => saude(c))
const nHealthy = situacao.filter((s) => s === 'healthy').length
const nSemHc = situacao.filter((s) => s === 'sem-healthcheck').length

if (pendentes.length === 0 && seeder === 'ok') {
  const detalhe = nSemHc
    ? `${nHealthy} healthy, ${nSemHc} sem healthcheck (esperado)`
    : `${nHealthy} healthy`
  ok(
    `${SERVICOS.length}/${SERVICOS.length} serviços running, ${detalhe};` +
      ' seeder do usuário demo concluiu com sucesso',
  )
} else if (pendentes.length === 0) {
  nao(
    `Os 6 serviços subiram, mas o seeder do usuário demo não concluiu (${seeder}).`,
    'É ele quem cria desafio@keeptor.com. Sem ele o login do passo 5 falha.',
    `Veja o que aconteceu: ${docker} logs ${SEEDER}`,
  )
} else {
  nao(
    `Nem todos os serviços ficaram prontos em ${limite}s: ${pendentes.join(' ')}`,
    'No PRIMEIRO boot é normal demorar: baixa as imagens e roda o seed de 5.571 municípios. Rode de novo.',
    'Se algum aparece como exited ou restarting, veja o log dele: npm run logs -- <serviço>',
    'Se aparece ausente, o ambiente não subiu: npm run up',
    'Visão geral: npm run status',
  )
}
for (const c of SERVICOS) info(`${c.padEnd(18)} ${estado(c).padEnd(10)} ${saude(c)}`)
info(`${SEEDER.padEnd(18)} ${estado(SEEDER).padEnd(10)} one-shot: ${seeder}`)
if (nSemHc) {
  info('sem-healthcheck aqui não é falha: o rest fica sem healthcheck de propósito,')
  info('porque a imagem do PostgREST em amd64 é scratch e não tem shell para invocar.')
  info('Quem prova que ele está servindo é o passo 3, logo abaixo.')
}

// ===========================================================================
// 3. PostgREST servindo dados
// ===========================================================================
passo(3, 'GET /rest/v1/uf, PostgREST servindo dados')
if (!anonKey) {
  nao(`ANON_KEY não encontrada em ${envFile || '(nenhum arquivo .env)'}.`, 'Rode: npm run setup')
} else {
  const r = await http('GET', `${API}/rest/v1/uf?select=sigla&limit=3`, { apikey: anonKey })
  let linhas = -1
  try {
    const j = JSON.parse(r.corpo)
    if (Array.isArray(j)) linhas = j.length
  } catch {
    linhas = -1
  }
  if (r.status === 200 && linhas === 3) {
    ok(`HTTP 200 com 3 UFs: ${umaLinha(r.corpo, 80)}`)
  } else if (r.status === 0) {
    nao(
      `Não consegui falar com ${API}.`,
      `O Kong não está respondendo na porta ${portaKong}.`,
      'Confira: npm run status  ·  npm run logs -- kong',
      `Se a porta ${portaKong} estiver ocupada, ajuste KONG_HTTP_PORT no .env.`,
      `   detalhe: ${r.erro}`,
    )
  } else if (r.status === 404 || linhas === 0) {
    nao(
      `HTTP ${r.status} com ${linhas} linha(s). A tabela uf parece vazia ou inexistente.`,
      'Causa mais provável: as migrations não rodaram porque o volume do banco já existia.',
      'As migrations só executam com o volume VAZIO. Solução: npm run reset',
    )
  } else {
    nao(
      `HTTP ${r.status} com ${linhas} linha(s) (esperado: 200 e 3).`,
      'Se a resposta fala em no Route matched, o Kong não leu backend/volumes/kong/kong.yml.',
      `   resposta: ${umaLinha(r.corpo, 160)}`,
    )
  }
}

// ===========================================================================
// 4. Seed do IBGE completo
// ===========================================================================
passo(4, 'Seed do IBGE: 5571 municípios')
{
  const r = await http('GET', `${API}/rest/v1/municipio?select=id`, {
    apikey: anonKey,
    Range: '0-0',
    Prefer: 'count=exact',
  })
  const cr = r.headers.get('content-range') || ''
  const total = cr.includes('/') ? cr.split('/').pop().trim() : ''
  if ((r.status === 206 || r.status === 200) && total === '5571') {
    ok('Content-Range confirma 5571 municípios')
  } else if (total) {
    nao(
      `O banco tem ${total} municípios, esperado 5571.`,
      'Seed incompleto. Quase sempre é migration rodada pela metade ou volume antigo.',
      'Solução: npm run reset',
    )
  } else {
    nao(
      `Não consegui ler o total (HTTP ${r.status}, sem cabeçalho Content-Range).`,
      'Se o passo 3 também falhou, resolva ele primeiro: é a mesma causa.',
    )
  }
}

// ===========================================================================
// 5. Login do usuário demo
// ===========================================================================
passo(5, 'POST /auth/v1/token: login de desafio@keeptor.com')
let accessToken = ''
{
  const r = await fetch(`${API}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'desafio@keeptor.com', password: 'desafio123' }),
    signal: AbortSignal.timeout(25000),
  }).catch((e) => ({ status: 0, text: async () => String(e.message || e) }))
  const corpo = await r.text()
  try {
    accessToken = JSON.parse(corpo).access_token || ''
  } catch {
    accessToken = ''
  }
  if (r.status === 200 && accessToken) {
    ok(`HTTP 200 com access_token (${accessToken.slice(0, 24)}…)`)
  } else if (r.status === 400) {
    nao(
      'HTTP 400: o GoTrue recusou as credenciais.',
      `Causa mais provável: o seeder (${SEEDER}) não rodou ou falhou. É ele quem cria o usuário.`,
      `Veja o log dele: ${docker} logs ${SEEDER}`,
      'Se a tabela auth.users estiver vazia, rode: npm run reset',
    )
  } else if (r.status === 401) {
    nao(
      'HTTP 401: a ANON_KEY foi rejeitada.',
      'O JWT_SECRET do .env provavelmente foi trocado sem regerar ANON_KEY e SERVICE_ROLE_KEY.',
      'O comando para regerar as duas está no rodapé do .env.example.',
    )
  } else {
    nao(`HTTP ${r.status} (esperado 200 com access_token).`, 'Veja: npm run logs -- auth')
  }
}

// ===========================================================================
// 6. O token do GoTrue é aceito pelo PostgREST
// ===========================================================================
passo(6, 'O access_token do login é aceito pelo PostgREST')
if (!accessToken) {
  nao('Sem access_token do passo 5, não dá para testar.', 'Resolva o passo 5 primeiro.')
} else {
  const r = await http('GET', `${API}/rest/v1/uf?select=sigla&limit=1`, {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
  })
  if (r.status === 200) {
    ok('HTTP 200: GoTrue e PostgREST assinam/validam com o mesmo JWT_SECRET')
  } else if (r.status === 401) {
    nao(
      'HTTP 401: o PostgREST rejeitou um token que o GoTrue acabou de emitir.',
      'Os dois estão com JWT_SECRET diferente. Isso acontece quando o .env muda com o ambiente de pé.',
      'Solução: npm run down  e depois  npm run up',
    )
  } else {
    nao(`HTTP ${r.status} (esperado 200).`, 'Investigue: npm run logs -- rest')
  }
}

// ===========================================================================
// 7. Studio
// ===========================================================================
passo(7, `Supabase Studio respondendo na porta ${portaStudio}`)
{
  let status = 0
  for (let i = 0; i < 6; i += 1) {
    const r = await http('GET', `http://localhost:${portaStudio}/`)
    status = r.status
    if (status >= 200 && status < 400) break
    await espera(5000)
  }
  if (status >= 200 && status < 400) {
    ok(`HTTP ${status} em http://localhost:${portaStudio}`)
  } else {
    nao(
      `Studio não respondeu (HTTP ${status}).`,
      'O Studio é um Next.js e demora mais que o resto para subir. Tente de novo em 1 minuto.',
      `Se a porta ${portaStudio} estiver ocupada, ajuste STUDIO_PORT no .env.`,
      'Log: npm run logs -- studio',
    )
  }
}

// ===========================================================================
// 8. Conferência direto no banco
// ===========================================================================
passo(8, 'Conferência no Postgres (dentro do container)')
{
  const consultar = (sql) => {
    let r = rodarCapturando(docker, [
      'exec',
      '-e',
      `PGPASSWORD=${bancoSenha}`,
      CONTAINER_DB,
      'psql',
      '-U',
      'postgres',
      '-h',
      '127.0.0.1',
      '-d',
      bancoNome,
      '-tAc',
      sql,
    ])
    if (!r.ok || !r.stdout) {
      r = rodarCapturando(docker, [
        'exec',
        CONTAINER_DB,
        'psql',
        '-U',
        'postgres',
        '-d',
        bancoNome,
        '-tAc',
        sql,
      ])
    }
    return r.ok ? r.stdout.trim() : ''
  }
  const mun = consultar('select count(*) from public.municipio')
  const usr = consultar('select count(*) from auth.users')
  if (mun === '5571' && usr && Number(usr) >= 1) {
    ok(`municipio = 5571 · auth.users = ${usr}`)
  } else if (!mun && !usr) {
    nao(
      `Não consegui rodar psql dentro do container ${CONTAINER_DB}.`,
      'O container do banco pode não estar de pé: npm run status',
      'Teste manual: npm run psql',
    )
  } else if (usr === '0' && mun === '5571') {
    nao(
      'O banco está certo (municipio = 5571), mas auth.users = 0.',
      'As tabelas do schema auth são criadas pelo GoTrue, e quem popula o usuário é o seeder.',
      `Veja o log dele: ${docker} logs ${SEEDER}`,
    )
  } else {
    nao(
      `municipio = '${mun}' (esperado 5571) · auth.users = '${usr}' (esperado >= 1).`,
      'As migrations só executam com o volume VAZIO. Solução: npm run reset',
      'Para ver o que rodou no boot do banco: npm run logs -- db',
    )
  }
}

// ===========================================================================
// 9. Preflight CORS
// ===========================================================================
passo(9, 'Preflight CORS aceita todos os headers que o supabase-js envia')
{
  // Fonte única da lista: os headers de request do @supabase/supabase-js.
  // Quando o frontend está instalado, lemos as constantes direto do pacote e
  // somamos o que houver de novo, para uma atualização do cliente não passar
  // despercebida.
  const headers = [
    'accept',
    'accept-profile',
    'authorization',
    'content-type',
    'content-profile',
    'prefer',
    'range',
    'range-unit',
    'x-client-info',
    'x-supabase-api-version',
    'x-region',
    'x-upsert',
    'apikey',
  ]
  const dirSupabase = path.join(ROOT, 'frontend', 'node_modules', '@supabase')
  if (existsSync(dirSupabase)) {
    for (const pacote of readdirSync(dirSupabase)) {
      const constantes = path.join(dirSupabase, pacote, 'dist', 'module', 'lib', 'constants.js')
      if (!existsSync(constantes)) continue
      const texto = readFileSync(constantes, 'utf8')
      for (const m of texto.matchAll(/=\s*'(x-[a-z-]+)'/gi)) {
        const h = m[1].toLowerCase()
        if (!headers.includes(h)) {
          headers.push(h)
          info(`header novo detectado no supabase-js instalado: ${h}`)
        }
      }
    }
  }

  let tudoOk = true
  for (const rota of ['/auth/v1/token?grant_type=password', '/rest/v1/uf']) {
    const r = await http('OPTIONS', `${API}${rota}`, {
      Origin: origem,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': headers.join(','),
    })
    const permitidos = (r.headers.get('access-control-allow-headers') || '')
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const faltando = headers.filter((h) => !permitidos.includes(h))
    if (r.status === 0) {
      tudoOk = false
      nao(
        `Preflight OPTIONS ${rota} não obteve resposta.`,
        'Resolva primeiro os passos anteriores: a API não está respondendo.',
      )
      break
    }
    if (faltando.length > 0) {
      tudoOk = false
      nao(
        `O preflight de ${rota} REJEITA header(s) que o supabase-js envia: ${faltando.join(' ')}`,
        'O navegador vai abortar a chamada antes de sair, e o login e as telas quebram',
        'mesmo com o backend 100% saudável. curl não faz preflight, por isso os',
        'passos anteriores passam.',
        '',
        'Provável causa: alguém declarou um config.headers explícito no plugin cors',
        'de backend/volumes/kong/kong.yml. Sem esse config o Kong ecoa o que o browser',
        'pedir, e isto não quebra a cada header novo do supabase-js.',
        'Remova o config e rode: npm run down  e depois  npm run up',
        '',
        `   Kong respondeu HTTP ${r.status} permitindo: ${permitidos.join(',')}`,
      )
      break
    }
  }
  if (tudoOk) {
    ok(`OPTIONS em /auth/v1/ e /rest/v1/ liberam os ${headers.length} headers (origem ${origem})`)
  }
}


// ===========================================================================
// 10. Os dois .env falam da mesma API
// ===========================================================================
passo(10, 'frontend/.env coerente com o .env da raiz')
{
  const c = conferirEnvFrontend()
  if (c.estado === 'ausente') {
    // Não é falha: pode ser que você ainda não tenha chegado no frontend.
    ok('frontend/.env ainda não existe (rode npm run setup quando for mexer no frontend)')
  } else if (c.estado === 'ok') {
    ok(`a chave e a URL do frontend batem com a raiz (porta ${c.portaRaiz})`)
  } else {
    const dicas = []
    for (const p of c.problemas) {
      dicas.push(`${p.campo}: ${p.efeito}`)
      dicas.push(`   raiz:     ${p.raiz}`)
      dicas.push(`   frontend: ${p.frontend}`)
    }
    dicas.push('')
    dicas.push('A ANON_KEY do .env da raiz é a fonte da verdade: é ela que o GoTrue valida.')
    dicas.push('Conserto: apague o frontend/.env e rode npm run setup, que recria o arquivo')
    dicas.push('já com os valores da raiz.')
    nao('O frontend está apontando para uma configuração diferente da do backend.', ...dicas)
  }
}

encerrar()
