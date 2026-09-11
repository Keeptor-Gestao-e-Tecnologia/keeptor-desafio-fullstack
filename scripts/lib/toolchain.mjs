// ---------------------------------------------------------------------------
// Resolução do Docker, do Compose e do .env, sem depender de shell.
//
// Tudo aqui roda igual em macOS, Linux e Windows: nada de `which`, `source`,
// `&&` ou variável de ambiente estilo Unix. Os dois scripts do repositório
// (dev.mjs e smoke.mjs) importam daqui, para não existirem duas versões da
// mesma lógica.
// ---------------------------------------------------------------------------
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const COMPOSE_FILE = path.join(ROOT, 'backend', 'docker-compose.yml')
export const ENV_FILE = path.join(ROOT, '.env')
export const ENV_EXAMPLE = path.join(ROOT, '.env.example')

const isWindows = process.platform === 'win32'

/** Procura um executável no PATH, sem usar shell. */
function fromPath(nome) {
  const exts = isWindows ? ['.exe', '.cmd', '.bat', ''] : ['']
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean)
  for (const dir of dirs) {
    for (const ext of exts) {
      const alvo = path.join(dir, nome + ext)
      if (existsSync(alvo)) return alvo
    }
  }
  return null
}

/**
 * Caminhos onde o docker costuma ficar, por sistema.
 * O Docker Desktop 4.90+ no macOS instala em ~/.docker/bin, que muitos shells
 * não carregam no PATH.
 */
function candidatosDocker() {
  const home = homedir()
  if (isWindows) {
    return [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Docker', 'Docker', 'resources', 'bin', 'docker.exe'),
      path.join(home, '.docker', 'bin', 'docker.exe'),
    ]
  }
  return [
    path.join(home, '.docker', 'bin', 'docker'),
    '/Applications/Docker.app/Contents/Resources/bin/docker',
    '/usr/local/bin/docker',
    '/opt/homebrew/bin/docker',
  ]
}

export const ONDE_PROCUREI = isWindows
  ? 'PATH, C:\\Program Files\\Docker\\Docker\\resources\\bin, %USERPROFILE%\\.docker\\bin'
  : 'PATH, ~/.docker/bin, /Applications/Docker.app/Contents/Resources/bin, /usr/local/bin, /opt/homebrew/bin'

/** Mensagem de ajuda para quem tem o Docker instalado mas fora do PATH. */
export function dicaDockerAusente() {
  if (isWindows) {
    return [
      'Instale o Docker Desktop: https://www.docker.com/products/docker-desktop',
      'Se ele já está instalado, abra o aplicativo uma vez e depois feche e',
      'reabra o terminal, para o PATH ser recarregado.',
    ]
  }
  return [
    'Se o Docker Desktop JÁ está instalado e aberto, isto é só PATH: a versão',
    '4.90+ instala em ~/.docker/bin, que nem todo shell carrega. Resolva assim:',
    '',
    '    export PATH="$HOME/.docker/bin:$PATH"',
    '',
    'Para valer sempre, ponha essa linha no seu ~/.zprofile e abra um terminal novo.',
    'Se ainda não instalou: https://www.docker.com/products/docker-desktop',
  ]
}

/** Caminho do binário do docker, ou null. Respeita a variável DOCKER. */
export function acharDocker() {
  if (process.env.DOCKER && existsSync(process.env.DOCKER)) return process.env.DOCKER
  const noPath = fromPath('docker')
  if (noPath) return noPath
  for (const c of candidatosDocker()) if (existsSync(c)) return c
  return null
}

/** Roda um comando capturando a saída. Nunca usa shell. */
export function rodarCapturando(bin, args) {
  const r = spawnSync(bin, args, { encoding: 'utf8', windowsHide: true })
  return {
    ok: r.status === 0,
    code: r.status,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim(),
  }
}

/** Roda um comando mostrando a saída no terminal do usuário. */
export function rodarHerdando(bin, args) {
  const r = spawnSync(bin, args, { stdio: 'inherit', windowsHide: true })
  return r.status === 0
}

/**
 * Como invocar o Compose: plugin (`docker compose`) ou binário separado
 * (`docker-compose`). Devolve { bin, prefixo } ou null.
 */
export function acharCompose(docker) {
  if (docker && rodarCapturando(docker, ['compose', 'version']).ok) {
    return { bin: docker, prefixo: ['compose'], nome: `${docker} compose` }
  }
  const solto = fromPath('docker-compose')
  if (solto) return { bin: solto, prefixo: [], nome: solto }
  const home = homedir()
  const extras = isWindows
    ? [path.join(home, '.docker', 'bin', 'docker-compose.exe')]
    : [
        path.join(home, '.docker', 'bin', 'docker-compose'),
        '/usr/local/bin/docker-compose',
        '/opt/homebrew/bin/docker-compose',
      ]
  for (const c of extras) if (existsSync(c)) return { bin: c, prefixo: [], nome: c }
  return null
}

/** Argumentos fixos do compose deste projeto. */
export function argsCompose(compose, extras) {
  return [...compose.prefixo, '-f', COMPOSE_FILE, '--env-file', ENV_FILE, ...extras]
}

/**
 * Copia um .env.example para .env, sem nunca sobrescrever o que já existe.
 * Devolve 'criado', 'ja-existia' ou 'sem-modelo'.
 */
export function copiarEnvSeFaltar(exemplo, destino) {
  if (existsSync(destino)) return 'ja-existia'
  if (!existsSync(exemplo)) return 'sem-modelo'
  copyFileSync(exemplo, destino)
  return 'criado'
}

export const FRONT_ENV = path.join(ROOT, 'frontend', '.env')
export const FRONT_ENV_EXAMPLE = path.join(ROOT, 'frontend', '.env.example')

/** Garante só o .env da raiz, que é o que o Compose precisa. */
export function garantirEnv() {
  const r = copiarEnvSeFaltar(ENV_EXAMPLE, ENV_FILE)
  if (r === 'sem-modelo') {
    console.error('Não achei .env nem .env.example na raiz do repositório.')
    process.exit(1)
  }
  return r === 'criado'
}

/** Lê um arquivo no formato .env como objeto. Sem `source`, sem shell. */
export function lerArquivoEnv(caminho) {
  const valores = {}
  if (!caminho || !existsSync(caminho)) return valores
  for (const linha of readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    const t = linha.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    valores[t.slice(0, i).trim()] = v
  }
  return valores
}

/** Lê o .env da raiz (ou o .env.example, se o .env ainda não existe). */
export function lerEnv() {
  const arquivo = existsSync(ENV_FILE) ? ENV_FILE : existsSync(ENV_EXAMPLE) ? ENV_EXAMPLE : null
  return { arquivo, valores: lerArquivoEnv(arquivo) }
}

/** Mostra uma chave longa sem expor o valor inteiro. */
export function truncarChave(v) {
  if (!v) return '(vazio)'
  if (v.length <= 24) return v
  return `${v.slice(0, 12)}...${v.slice(-6)} (${v.length} chars)`
}

/**
 * Confere se o frontend/.env está coerente com o .env da raiz.
 *
 * A ANON_KEY da raiz é a fonte da verdade: é ela que o GoTrue e o PostgREST
 * validam. Se o frontend carregar outra, o login devolve 401 e o motivo não
 * aparece no console do navegador.
 *
 * Estado: 'ok', 'ausente' (frontend/.env ainda não criado) ou 'divergente'.
 */
export function conferirEnvFrontend() {
  const raiz = lerEnv().valores
  const anonRaiz = raiz.ANON_KEY || ''
  const portaRaiz = raiz.KONG_HTTP_PORT || '8000'

  if (!existsSync(FRONT_ENV)) return { estado: 'ausente', problemas: [], anonRaiz, portaRaiz }

  const front = lerArquivoEnv(FRONT_ENV)
  const anonFront = front.VITE_SUPABASE_ANON_KEY || ''
  const urlFront = front.VITE_SUPABASE_URL || ''
  const problemas = []

  if (anonFront !== anonRaiz) {
    problemas.push({
      campo: 'VITE_SUPABASE_ANON_KEY',
      raiz: truncarChave(anonRaiz),
      frontend: truncarChave(anonFront),
      efeito: 'o login devolve 401, porque quem valida a chave é o GoTrue com a config da raiz',
    })
  }

  let portaFront = ''
  try {
    portaFront = new URL(urlFront).port || '80'
  } catch {
    portaFront = ''
  }
  if (portaFront !== portaRaiz) {
    problemas.push({
      campo: 'VITE_SUPABASE_URL',
      raiz: `http://localhost:${portaRaiz}  (KONG_HTTP_PORT=${portaRaiz})`,
      frontend: urlFront || '(vazio)',
      efeito: 'o frontend chama uma porta onde a API não está',
    })
  }

  return { estado: problemas.length ? 'divergente' : 'ok', problemas, anonRaiz, portaRaiz }
}

export const SERVICOS = [
  'desafio-db',
  'desafio-auth',
  'desafio-rest',
  'desafio-meta',
  'desafio-kong',
  'desafio-studio',
]
/**
 * Serviços cujo healthcheck o smoke espera ficar `healthy`.
 *
 * `desafio-rest` está FORA de propósito: a imagem do PostgREST em amd64 é
 * scratch, sem shell e sem utilitário nenhum, então ela não pode ter
 * healthcheck (veja o comentário do serviço `rest` no docker-compose.yml).
 * Quem prova que o PostgREST está servindo é o passo 3.
 */
export const PRECISAM_HEALTHY = ['desafio-db', 'desafio-auth', 'desafio-kong']
export const SEEDER = 'desafio-auth-seed'
export const CONTAINER_DB = 'desafio-db'
