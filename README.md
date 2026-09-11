# Desafio Técnico: Dev Fullstack Vue.js / PostgreSQL

Olá! Se você chegou aqui, é porque avançou no processo da vaga de **Desenvolvedor Fullstack Vue.js / PostgreSQL** da Keeptor. Obrigado pelo seu tempo, sabemos que ele é caro.

Este repositório já é um ponto de partida pronto. Ambiente, banco e login funcionam. O que falta é o seu trabalho.

---

## 📌 Antes de começar

**Tempo estimado: 6 horas com folga.** Dependendo do seu nível de experiência, pode chegar a 10 horas. Não é cronometrado e não vamos olhar o horário dos seus commits.

**O prazo de entrega vai na mensagem do avaliador, junto com o link deste repositório.**

Uma coisa que vale mais que o tempo:

> **Preferimos um escopo menor, bem feito e documentado, do que um escopo completo e atropelado.**

Se você perceber que não vai dar conta de tudo, **pare e escreva no seu README o que ficou de fora e por quê**. Saber cortar escopo e explicar o corte é parte do que estamos avaliando, e talvez a parte mais importante.

**Use AI à vontade.** Claude, Cursor, Copilot, o que você usa no dia a dia. Não só é permitido, é esperado: a vaga pede experiência real com desenvolvimento assistido por AI. Só lembre que, se o seu código for aprovado, a etapa seguinte é uma conversa técnica sobre ele (veja *Entrega*). Então entregue algo que você consiga explicar.

---

## 🚀 Como rodar

Você precisa de **Docker** e **Node 20 ou superior**. Os comandos abaixo são os mesmos no Windows, no Mac e no Linux.

```bash
# 1. Suba o backend (Postgres + Supabase)
npm run setup       # cria os arquivos .env
npm run up
npm run smoke       # confere se subiu tudo certo

# 2. Suba o frontend
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173` e entre com:

```
email: desafio@keeptor.com
senha: desafio123
```

**Rode o `npm run smoke` antes de começar a codar.** Ele faz 10 verificações e diz se o ambiente está mesmo de pé: containers, API, dados do IBGE, login funcionando de verdade. Se der `10/10 OK`, pode seguir tranquilo, porque o que quebrar dali em diante é código seu e não o ambiente.

Se alguma verificação falhar, a mensagem já diz a causa provável e o comando para investigar. O primeiro boot é demorado, porque baixa as imagens e popula 5.571 municípios. Na maioria dos problemas, `npm run reset` resolve: ele apaga tudo e recria o banco do zero. Para ver os outros comandos, abra o `package.json` da raiz.

E se não resolver, **fale com a gente**. Problema de ambiente é nosso, não seu, não conta contra você, e não faz sentido gastar suas horas nisso. Se travar por mais de 30 minutos no setup, chama.

---

## 📦 O que já vem pronto

Para você não gastar tempo com preparação de ambiente:

| Já entregue | Onde fica |
|---|---|
| Supabase no Docker (Postgres, Auth, PostgREST e Studio) | `backend/` |
| Login funcionando, proteção de rota e logout | `frontend/src/pages/LoginPage.vue` |
| Tabelas `uf` e `municipio` **já populadas** com os dados oficiais do IBGE (27 UFs e 5.571 municípios) | `backend/migrations/` |
| Vue 3.5, Vite, TypeScript, PrimeVue 4 e Tailwind 4 instalados e configurados | `frontend/` |

**Sobre as tabelas `uf` e `municipio`:** elas vêm prontas, mas não são intocáveis. Se você achar que a modelagem deveria ser outra, pode mudar. Só explique a decisão nos seus documentos.

---

## 🧰 Stack

### Obrigatório

É o que usamos aqui no dia a dia, e já vem instalado e configurado no repositório.

| Tecnologia | Versão | Onde entra |
|---|---|---|
| **Vue 3** (Composition API, `<script setup>`) | 3.5 | Toda a interface |
| **TypeScript** | 5.8 | Todo o código do frontend |
| **PrimeVue** | 4.5 | Base dos seus componentes, sempre por trás de um wrapper seu |
| **Tailwind CSS** | 4.3 | Estilo e layout |
| **PostgreSQL** | 15 | Banco, com as regras modeladas em migrations SQL |
| **Docker** | qualquer versão atual | Sobe todo o ambiente |
| Vite | 7.3 | Build e dev server, já configurado |
| vue-router | 4 | Rotas, já configurado com a proteção de login |
| supabase-js | 2 | Cliente da API, já configurado |

Uma observação sobre o banco: as regras de negócio devem ficar **no PostgreSQL**, em constraints, índices e o que mais fizer sentido, e não só validadas no frontend. Isso é parte da vaga.

### Você escolhe, e a escolha é avaliada

Não instalamos nada disso de propósito. Escolher (ou decidir não usar) faz parte do que estamos olhando.

| Precisa de | Exemplos | Obrigatório? |
|---|---|---|
| Gerenciamento de estado | Pinia, composables próprios | Não, talvez nem precise |
| Validação de formulário | Zod, Valibot, `@primevue/forms`, validação na mão | Não |
| Camada de dados e cache | TanStack Query, composable próprio, chamada direta | Não |
| Máscara de campo | PrimeVue InputMask, Maska, a sua própria | Não |
| Documentação de componente | **Storybook** | Não, mas conta a favor |
| Testes | Vitest, Playwright | Não, mas conta a favor |

Se você achar que uma dessas camadas não se justifica num CRUD desse tamanho, **não use e escreva o porquê**. Decidir não adotar é uma decisão tão avaliável quanto adotar.

### Não use

jQuery, Bootstrap, Vuetify, Element Plus, Quasar ou qualquer outra biblioteca de componentes além do PrimeVue. Vue 2 e Options API também não.

---

## 🎯 O que você vai fazer

### 1. Tela de cadastro de parceiros

Uma tela que permita **cadastrar, listar e editar parceiros**. Parceiro é uma empresa com quem a Keeptor faz negócio: cliente, fornecedor ou representante.

Campos que o formulário precisa ter:

- Razão social e nome fantasia
- **CNPJ** e inscrição estadual (a inscrição é opcional)
- **Telefone** e e-mail
- **Data de início do relacionamento**
- **Limite de crédito** (valor em reais)
- **Ativo** (sim ou não)
- **Endereço:** CEP, UF, município, bairro, logradouro, número e complemento

A listagem pode ser simples, uma tabela sem filtros e sem paginação no servidor. Não gaste tempo nela, porque o valor está no formulário e no banco.

### 2. As migrations

Crie o banco de parceiros em migrations SQL, dentro de `backend/migrations/`, seguindo a numeração que já existe. As duas primeiras já estão lá, então as suas começam em `0003_`.

Queremos ver suas **decisões de modelagem**: chaves, relacionamentos, constraints, campos únicos, índices, tipos de dado e normalização. O que você separaria em outra tabela e o que deixaria junto, e por quê.

### 3. A documentação

Coloque em `docs/` os documentos que você produziu enquanto trabalhava: PRD, ADR, PLAN, specs, o nome e o formato que você usa no seu dia a dia. Não existe formato certo e não vamos dar modelo.

Três coisas nos interessam aqui:

1. **Como você organiza esses arquivos.** A estrutura que você escolhe já diz muito.
2. **Como você divide o trabalho por feature.** O que virou uma feature, o que ficou fora dela, e em que ordem você atacou.
3. **Como você conduz o trabalho com AI.** Como entende o pedido, como registra as decisões e como planeja antes de gerar código.

E um pedido importante: **vá commitando ao longo do projeto**, não deixe tudo para um commit no final. O histórico mostra como você trabalhou, e um commit único apaga essa informação.

### 4. Como você montou seu ambiente de AI

A vaga pede experiência real com desenvolvimento assistido por AI, e isso é difícil de avaliar só olhando o código pronto. Então queremos ver o seu setup.

**Commite a configuração da ferramenta que você usou.** Se foi Claude Code, suba a pasta `.claude/` e o `CLAUDE.md`. Se foi Cursor, suba `.cursor/`. Se foi Copilot, Windsurf, Aider ou outra, suba os arquivos equivalentes. Nada disso está no `.gitignore`, então basta commitar.

> ⚠️ **Antes de commitar, tire as chaves.** Arquivos como `.mcp.json` costumam guardar token de API. Este repositório é público e o seu fork também será. Troque o valor por `""` ou por um texto explicando qual chave ia ali.

**E escreva um arquivo em `docs/` contando:**

- **Quais ferramentas de AI você usou** e em que parte do trabalho cada uma entrou.
- **Quais MCPs você usou, se usou.** Diga o nome de cada um e para que serviu. Se não usou nenhum, diga isso também, não é demérito.
- **Skills, agentes, rules ou comandos** que você criou ou configurou, se achou necessário. Se achou que não era necessário, o motivo também interessa.
- **Que documentos você deu de contexto para a AI.** Links da documentação oficial, trechos de spec, prints, exemplos de código, o que for. Queremos entender como você alimenta o contexto, porque é isso que separa quem dirige a ferramenta de quem só pede coisa pra ela.
- **Como o desenvolvimento andou.** Em que ordem você atacou, onde mudou de rumo e por quê, o que a AI acertou de primeira e onde você teve que corrigir o caminho.

Não precisa ser longo e não queremos propaganda de ferramenta. Precisa ser honesto. **"Não usei MCP nenhum e resolvi no chat mesmo"** é uma resposta perfeitamente boa, desde que o resto mostre critério.

---

## ⭐ Padronização, o item que mais pesa

Esta é a parte de maior peso na avaliação. Leia com atenção.

### A regra

**Suas telas não podem importar nada de `primevue/*` diretamente.** Todo componente do PrimeVue precisa ser usado através de um componente seu, que embrulha o do PrimeVue, criado dentro de `frontend/src/design-system/`.

O ESLint já está configurado para isso: se um import direto escapar, o `npm run lint` aponta o arquivo e a linha. Deixamos assim para você perceber na hora, e não descobrir no fim que uma tela ficou fora do padrão.

### O que queremos ver

**Você decide** quantos componentes criar, como agrupá-los, e quais props e eventos cada um vai expor. Não vamos dar a lista, porque a lista é exatamente o que estamos avaliando.

Repare no formulário da missão: ele tem texto simples, texto com máscara, valor em dinheiro, data, sim/não, e seleção que depende de outra seleção. O conjunto de componentes que você tirar disso é a sua resposta.

Você vai notar que **a tela de login não usa PrimeVue**. Isso é de propósito: não queríamos deixar nenhum exemplo pronto que influenciasse as suas escolhas. A pasta `design-system/` está vazia pelo mesmo motivo.

### O que entregar junto

**Escreva o contrato dos seus componentes**, em uma tabela no README ou no Storybook. Liste as props e os eventos que todos eles têm em comum (nome, tipo e valor padrão) e explique por que cada um existe. Se algum componente fugir do padrão, diga o motivo.

E responda no seu ADR:

> **Se trocássemos o PrimeVue por outra biblioteca, quantos arquivos mudariam?**

### Consistência em dois níveis

Vamos olhar a padronização no componente e na tela:

- **No componente:** as mesmas props e os mesmos eventos entre eles, o mesmo jeito de usar `v-model`, o mesmo tratamento de erro, label e acessibilidade em todos.
- **Na tela:** espaçamento, grid, alinhamento dos labels, posição dos botões, e comportamento igual para erro, carregamento e lista vazia.

---

## 🤔 Perguntas que não vamos responder

O enunciado é ambíguo em alguns pontos, **de propósito**.

- Um parceiro pode ter mais de um endereço?
- CNPJ é único no sistema inteiro? E um parceiro estrangeiro, que não tem CNPJ?
- Bairro deve ser uma tabela ligada por chave estrangeira, ou texto livre? (não demos bairros populados, e isso é uma pista, não um esquecimento)
- Um parceiro desativado pode ser reativado, ou vira um registro novo?
- Limite de crédito zerado e limite de crédito em branco significam a mesma coisa?

Não pergunte para a gente. **Decida, escreva a decisão e siga em frente.** A forma como você resolve uma dúvida sozinho diz mais sobre você do que a tela pronta. Aqui processo vem antes de tecnologia, e não é só uma frase bonita.

---

## 📊 Como avaliamos

| Critério | Peso |
|---|---|
| **Padronização:** seus componentes e a consistência da tela | **35%** |
| **Modelagem de banco:** relacionamentos, constraints, índices e normalização | **25%** |
| **Processo:** documentos, divisão por feature, histórico de commits e seu setup de AI | **25%** |
| **Entrega funcional:** sobe, funciona, é responsiva e acessível | **15%** |

O login não entra na nota, porque já veio pronto.

**Opcional, mas conta a favor:** uma story de Storybook do seu componente mais complexo. Uma só. Se for gastar mais de 30 minutos, pule.

---

## 📬 Entrega

1. **Faça um fork** deste repositório (público, ou privado com acesso para a gente)
2. Trabalhe na sua branch e **vá commitando ao longo do caminho**, com mensagens que dê para entender
3. Escreva no seu README o que você fez, o que ficou de fora e o que faria diferente com mais tempo
4. Mande o link

O prazo você recebe na mensagem do avaliador, junto com o link deste repositório.

Depois da entrega, o seu código passa pela nossa avaliação. **Se ele for aprovado nessa etapa, marcamos 30 minutos de conversa técnica.** Sem pegadinha e sem quadro branco: você abre o que fez e explica as decisões. Vamos perguntar coisas como *"por que campo único composto aqui e não simples?"* ou *"o que acontece se duas pessoas cadastrarem o mesmo CNPJ ao mesmo tempo?"*.

Essa conversa pesa tanto quanto o código. Entregue algo que seja seu.

---

## ❓ Dúvidas comuns

**Posso trocar alguma coisa da stack?**
A lista completa está na seção **Stack**, com o que é obrigatório, o que é escolha sua e o que não usamos. Resumindo: Vue 3, TypeScript, PrimeVue 4, Tailwind 4 e PostgreSQL são obrigatórios; as bibliotecas de estado, validação, cache e máscara são escolha sua.

**Preciso escrever testes?**
Não é obrigatório. Se escrever, conta a favor, mas não no lugar dos itens que pesam mais.

**Posso criar as tabelas pela tela do Supabase Studio?**
Pode usar para explorar, o `npm run up` sobe o Studio. Mas a entrega precisa ser **migration em SQL**. Banco que só existe na máquina de alguém não é entrega.

**Quanto capricho visual vocês esperam?**
Limpo e consistente vale mais que bonito e irregular. Não estamos avaliando gosto, estamos avaliando padronização.

**E se eu não terminar tudo?**
Entregue o que fez e escreva o que ficou de fora. Falamos sério sobre isso.

**Preciso mesmo commitar a pasta da minha ferramenta de AI?**
Sim, é parte da entrega. Queremos ver como você configura o seu ambiente de trabalho, não só o resultado. Só lembre de tirar as chaves de API antes, porque o repositório é público.

**E se eu quase não usei AI neste desafio?**
Escreva isso e explique o porquê. Não avaliamos volume de uso, avaliamos critério. Quem sabe quando não usar também está respondendo à pergunta.

---

Boa sorte! Dúvida sobre **o enunciado ou o ambiente**, é só chamar. Dúvida sobre **modelagem ou arquitetura**, essa é sua. 🙂
