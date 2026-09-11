// ---------------------------------------------------------------------------
// Comandos do ambiente local: up, down, reset, logs, psql, status.
//
// Chamado pelos scripts do package.json da raiz. Tudo em JavaScript, sem shell,
// para funcionar igual em macOS, Linux e Windows (PowerShell e CMD).
// ---------------------------------------------------------------------------
import {
  ONDE_PROCUREI,
  acharCompose,
  acharDocker,
  argsCompose,
  dicaDockerAusente,
  garantirEnv,
  lerEnv,
  rodarHerdando,
} from './lib/toolchain.mjs'

const comando = process.argv[2]
const extras = process.argv.slice(3)

function erro(titulo, linhas) {
  console.error('')
  console.error(`  ${titulo}`)
  console.error('')
  for (const l of linhas) console.error(l ? `  ${l}` : '')
  console.error('')
  process.exit(1)
}

const docker = acharDocker()
if (!docker) {
  erro('Não encontrei o binário do docker.', [
    ...dicaDockerAusente(),
    '',
    `Procurei em: ${ONDE_PROCUREI}`,
  ])
}

const compose = acharCompose(docker)
if (!compose) {
  erro('Achei o docker mas não o Docker Compose.', [
    'Reinstale o Docker Desktop: https://www.docker.com/products/docker-desktop',
    'Para conferir: docker compose version',
  ])
}

if (garantirEnv()) console.log('criado .env a partir de .env.example')

function compor(args) {
  return rodarHerdando(compose.bin, argsCompose(compose, args))
}

function fim(ok) {
  process.exit(ok ? 0 : 1)
}

switch (comando) {
  case 'up': {
    const ok = compor(['up', '-d'])
    if (ok) {
      console.log('')
      console.log('Subindo. O PRIMEIRO boot demora alguns minutos, porque baixa as')
      console.log('imagens e roda as migrations com os 5.571 municípios.')
      console.log('')
      console.log('  Acompanhe com:  npm run logs -- db')
      console.log('  Valide com:     npm run smoke')
      console.log('')
    }
    fim(ok)
    break
  }

  case 'down':
    fim(compor(['down', '--remove-orphans']))
    break

  case 'reset': {
    // Dois passos, e é por isso que este script existe em vez de encadear
    // comandos no package.json: `&&` não é portável para o CMD do Windows.
    if (!compor(['down', '-v', '--remove-orphans'])) fim(false)
    const ok = compor(['up', '-d'])
    if (ok) {
      console.log('')
      console.log('Banco recriado do zero. Aguarde o boot e rode: npm run smoke')
      console.log('')
    }
    fim(ok)
    break
  }

  case 'logs':
    // npm run logs -- db
    fim(compor(['logs', '-f', '--tail=120', ...extras]))
    break

  case 'status':
    fim(compor(['ps']))
    break

  case 'psql': {
    const { valores } = lerEnv()
    const db = valores.POSTGRES_DB || 'postgres'
    const flags = process.stdin.isTTY ? ['-it'] : ['-i']
    fim(rodarHerdando(docker, ['exec', ...flags, 'desafio-db', 'psql', '-U', 'postgres', '-d', db]))
    break
  }

  default:
    console.log('Comandos: up, down, reset, logs, psql, status')
    console.log('Exemplo:  npm run logs -- db')
    process.exit(1)
}
