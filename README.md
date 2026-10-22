# Novo Belém — Argamassa e Ferragem

Sistema web completo (MERN sem React) para uma loja de materiais de construção:
**site público vitrine** + **captação de orçamentos** + **painel administrativo**
com controle de estoque, produtos, categorias, serviços, entregas e orçamentos.

Projeto de conclusão (TCC) — repositório público: <https://github.com/Samuraii91/TCC-WEB>

---

## 1. Stack

| Camada | Tecnologia | Versão | Por quê |
|---|---|---|---|
| Runtime | Node.js | 20.x | — |
| Servidor | Express | ^4.21.2 | roteamento e middlewares |
| Template | EJS | ^3.1.10 | HTML no servidor, sem build step |
| Banco | MongoDB + Mongoose | ^8.3.4 | esquemas flexíveis, `populate` para relaciones |
| Sessão | express-session | ^1.18.2 | login por cookie |
| Senhas | bcrypt | ^6.0.0 | hash com salt |
| Upload | multer | ^2.0.2 | `memoryStorage` → Base64 no banco |
| Gráficos | Chart.js | 4.4.1 (CDN) | dashboard |
| Libras | VLibras | gov.br (CDN) | widget de Libras |
| Fontes | Poppins | Google Fonts | tipografia |

**Não há build step** (sem Vite/Webpack). Todo o JavaScript é `<script>` inline dentro
dos `.ejs` e o CSS é escrito à mão. Isso torna o deploy simples, mas impede
tree-shaking e separação de camadas.

### Bibliotecas externas via CDN
- `chart.js@4.4.1` — gráficos do dashboard
- `vlibras.gov.br/app` — tradutor de Libras
- `fonts.googleapis.com` — Poppins
- `formspree.io/f/xrbwqlzb` — envio de e-mail dos orçamentos
- Google Maps (`maps/embed`) — iframe da localização
- `wa.me` — botão flutuante de WhatsApp

---

## 2. Como rodar

```bash
npm install
node index.js
# http://localhost:3001
```

Porta via `process.env.PORT` (padrão `3001`).

**A conexão com o banco é feita por efeito colateral:** `config/conexao.js` usa
`await mongoose.connect(...)` no topo do módulo e é importado por `Produto.js`,
`Categoria.js` e `Contato.js`. O `index.js` chama `app.listen()` de forma
síncrona, sem esperar o banco conectar.

Não há variáveis de ambiente para o banco — a URI está no código (ver
[Segurança](#11-segurança--problemas-conhecidos)).

---

## 3. Estrutura

```
├── index.js            entrada (Render/local) — rotas + healthcheck + autoping
├── api/index.js        entrada (Vercel) — quase duplica do index.js
├── vercel.json         configuração da Vercel
├── config/conexao.js   conexão MongoDB
├── models/             6 esquemas Mongoose
├── controllers/        lógica de negócio
├── routes/             definição de endpoints
├── middlewares/auth.js  guarda verificarLogin
├── views/              templates EJS
│   ├── site/           site público (index, admin)
│   ├── usuario/        login
│   ├── cadastro/       registro
│   ├── produto/        CRUD + relatorio (impressão)
│   ├── categoria/      CRUD
│   ├── servico/        CRUD
│   ├── entrega/        CRUD com múltiplos itens
│   ├── contato/        lista + detalhe de orçamentos
│   ├── cabecalho.ejs   partial (sidebar + topbar do painel)
│   ├── rodape.ejs      partial
│   └── dashboard.ejs   KPIs + gráficos
└── public/
    ├── css/style.css       painel administrativo (tema escuro)
    ├── css/styleSite.css   site público (tema claro + escuro)
    └── img/               logo e fotos de categorias
```

---

## 4. Funcionalidades

### 4.1 Site público (`/site`) — `views/site/index.ejs`

Página única com navegação por âncoras.

- **Busca inteligente** — a mais elaborada do projeto. Normaliza acentos
  (`removerAcentos`), gera variantes singular/plural, expande um mapa de ~120
  **sinônimos** do setor (`SINONIMOS`, ex.: "cimento" → "argamassa", "concreto")
  e calcula **distância de Levenshtein** + similaridade para sugerir
  "Você quis dizer?". Os candidatos saem do DOM já renderizado, então a busca
  reflete o que está visível.
- **Filtros e paginação** — por categoria (pílulas) e por escopo
  (todas / categorias / produtos), com paginação incremental no JS.
- **Ficha de produto** em modal, com avaliação por estrelas (1–5). A nota é
  enviada por `POST /site/avaliar` e **uma avaliação por navegador**
  (guardada em `localStorage`).
- **Orçamento** — carrinho de itens com quantidade **limitada ao estoque
  disponível**, subtotal por linha e total calculado no cliente. Ao enviar:
  1. `POST /site/contato` grava no MongoDB com o `total` calculado;
  2. o form é submetido ao **Formspree** para envio por e-mail.
- **Só aparece o que tem estoque** — `Controller.siteIndex` filtra
  `quantidade > 0`.
- **Tema claro/escuro** com persistência em `localStorage` e respeito inicial a
  `prefers-color-scheme`.
- **Acessibilidade** — ver [seção 8](#8-acessibilidade).
- Card de categoria, mapa (Google Maps), horários, contato e WhatsApp flutuante.

### 4.2 Painel administrativo

Layout com **sidebar fixa** que vira menu off-canvas abaixo de 900px.

- **Dashboard** (`/dashboard`) — 8 KPIs (produtos, categorias, serviços,
  entregas, entregas pendentes, produtos em baixo estoque, orçamentos,
  orçamentos aguardando) e **3 gráficos Chart.js** montados no servidor:
  produtos por categoria, entregas por status, orçamentos por status.
  Mais listas das últimas 5 entregas e dos últimos 5 orçamentos.
- **Produtos** — CRUD completo, filtro ao vivo na tabela, upload de imagem.
  Ao abrir a lista, um `alert` destaca produtos em falta/baixo estoque.
- **Relatório de estoque** (`/produto/relatorio`) — página otimizada para
  impressão, filtrável por categoria e por situação
  (`EM FALTA` / `BAIXO ESTOQUE` / `NORMAL`). **Gera PDF pelo botão
  "Imprimir" do próprio navegador** — não há biblioteca de PDF no projeto.
- **Categorias** — CRUD com imagem (Base64).
- **Serviços** — CRUD com busca por filtro.
- **Entregas** — CRUD com **múltiplos produtos por entrega** (linhas dinâmicas
  no cliente; o produto já escolhido é desabilitado nas outras linhas).
  Status: `Pendente` → `Em rota` → `Entregue`.
- **Orçamentos** — listagem com filtro, detalhe e **atualização de status**
  (`Aguardando` / `Respondido via WhatsApp` / `Respondido via Email` /
  `Não respondido`).

### 4.3 Autenticação

- `GET /admin` → tela com senha fixa → redireciona para `/login`.
- `GET /login` + `POST /login` → compara a senha com **bcrypt**, grava
  `req.session.usuario = { id, nome, email }` → `/dashboard`.
- `GET /logout` → destrói a sessão.
- `GET/POST /register` → cadastro com hash (`bcrypt.genSalt(10)`).

O guarda `middlewares/auth.js` (`verificarLogin`) é aplicado em
`/produto`, `/categoria`, `/servico`, `/entrega`, `/contato` e em `/dashboard`.

**Não existe controle de perfil/papel:** qualquer usuário criado em
`/register` tem acesso total ao painel.

---

## 5. Banco de dados

Seis coleções (`models/`).

| Modelo | Campos principais | Observações |
|---|---|---|
| **Usuario** | `nome`, `email` (único), `senha` | hash bcrypt; sem `role` |
| **Categoria** | `nome`, `imagemBase64`, `mimetype` | `timestamps` |
| **Produto** | `nome`, `descricao`, `preco`, `quantidade` (default 0), `categoria` (ref Categoria), `imagemBase64`, `mimetype`, `avaliacoes[]` | `timestamps`; `avaliacoes` é array de notas 1–5 (validado só no controller) |
| **Servico** | `nome`, `descricao`, `preco` | sem `timestamps` |
| **Entrega** | `itens[]` (`produto` ref + `quantidade`), `cliente`, `endereco`, `status` (enum), `data` | subdocumento com `_id: false` |
| **Contato** | `nome`, `email`, `telefone`, `produto`, `quantidade`, `itens[]`, `total`, `mensagem`, `status` (enum) | representa o **orçamento** |

**Imagens** — não há pasta de uploads. O `multer` roda em `memoryStorage` e o
buffer vira string Base64 dentro do documento, renderizado como
`data:<mimetype>;base64,<imagem>`. Na edição, a imagem só é substituída se um
novo arquivo for enviado.

**Estoque** — criar uma entrega **não** baixa `Produto.quantidade`. O número de
estoque só muda por edição manual no formulário de produto, e é essa a base do
relatório e do badge "em estoque" do site.

---

## 6. Rotas

### Públicas
| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Vai para `/dashboard` se logado, senão `/login` |
| GET | `/site` | Site público |
| POST | `/site/contato` | Grava o orçamento |
| POST | `/site/avaliar` | Nota de 1 a 5 no produto |
| GET | `/healthcheck` | Retorna `OK` (usado pelo Render) |
| GET/POST | `/register` | Cadastro |

### Autenticadas
| Prefixo | Endpoints |
|---|---|
| `/login`, `/logout` | Login e saída |
| `/dashboard` | Painel |
| `/produto` | `add`, `lst`, `edt/:id`, `del/:id`, `relatorio` |
| `/categoria` | `add`, `lst`, `edt/:id`, `del/:id` |
| `/servico` | `add`, `lst`, `find`, `edt/:id`, `del/:id` |
| `/entrega` | `add`, `lst`, `find`, `edt/:id`, `del/:id` |
| `/contato` | `lst`, `find`, `edt/:id`, `del/:id` |

**Remoção por `GET /del/:id`** — não há `POST` de exclusão nem confirmação no
servidor; a proteção depende do link na tela.

---

## 7. Busca: como funciona

A busca é 100% no cliente e vale detalhar porque é a parte mais elaborado:

1. `removerAcentos()` normaliza "Cimento" → "cimento";
2. `variantesTermo()` gera singular/plural;
3. `SINONIMOS` expande o termo para o vocabulário do setor;
4. `levenshtein(a, b)` + `similaridade(a, b)` medem a distância;
5. `melhorSugestao()` devolve a melhor candidata acima de `0.55` de similaridade;
6. `aplicarFiltro()` filtra os cards comparando com o atributo `data-match`.

---

## 8. Acessibilidade

Recurso no site público (`views/site/index.ejs` + `public/css/styleSite.css`),
abrindo pelo botão flutuante ♿.

- **Ouvir página** — `speechSynthesis` lê o conteúdo da página em voz alta, em
  `pt-BR`. O texto é **dividido em frases de até 220 caracteres** e falado em
  sequência, porque o Chrome corta falas longas em ~15s. O painel, os botões
  flutuantes e o widget do VLibras são removidos antes de ler.
- **Ouvir seleção** — lê **apenas o trecho selecionado** com o mouse. Como
  clicar no painel derrubaria a seleção, o `mousedown` do botão é cancelado e a
  última seleção fica em cache. O botão só habilita quando há texto marcado.
- **Parar leitura** — botão que aparece durante a leitura; `Esc` também interrompe.
- **Tamanho da fonte (A- / A / A+)** — escala de **80% a 150%** em passos de 10%,
  persistida em `localStorage["acess-fonte"]`.

> **Por que uma variável CSS e não `font-size` no `<html>`:** o `styleSite.css`
> escreve todos os tamanhos em `px` (não há nenhum `rem`). Mudar o
> `font-size` do `<html>` não afetaria nada. Por isso os 72 tamanhos do conteúdo
> usam `calc(Npx * var(--fonte-escala))` e o JS altera a variável
> `--fonte-escala` no `document.documentElement`. Os controles do próprio painel
> não escalam, para não estourar a largura fixa dele.

- **VLibras** — widget oficial (`vlibras.gov.br`), que cria seu próprio botão
> flutuante. A versão atual (7.x) **ignora** o markup antigo `vw`/`vw-access-button`,
  então o projeto não mantém nenhum botão duplicado no painel de acessibilidade.
- **Marcas ARIA** — `role="dialog"` + `aria-modal` nos modais, `aria-expanded` /
  `aria-controls` no botão de acessibilidade, `aria-hidden` nos overlays,
  `role="button"` + `tabindex="0"` nos cards de categoria, teclado em Enter/Espaço.
- **Responsivo** — 3 breakpoints no site (992/820/600px) e 2 no painel
  (900/560px). Medido em viewport de celular: **0px de overflow horizontal**;
  os grids usam `repeat(auto-fill, minmax(...))` e se adaptam sozinhos.

---

## 9. Deploy

- **Render** (entrada `index.js`) — usa `PORT` do ambiente, expõe
  `/healthcheck` e faz **autoping** a cada 12 minutos (abaixo do timeout de
  15 min de inatividade do plano gratuito), lendo
  `RENDER_EXTERNAL_URL`.
- **Vercel** (entrada `api/index.js`, definida em `vercel.json`) — duplicata do
  `index.js` sem healthcheck e sem autoping.

Variáveis de ambiente reconhecidas: apenas `PORT` e `RENDER_EXTERNAL_URL`.

---

## 10. Testes

**Não há testes automatizados.** `npm test` é o stub padrão do npm que sempre
falha. Não existe suíte, cobertura ou CI (`.github/` não existe).

A verificação foi feita manualmente: renderização do EJS com dados fictícios e
execução em navegador headless para conferir a escala de fonte, a leitura da
seleção, o cancelamento da leitura e o overflow em telas pequenas.

---

## 11. Segurança — problemas conhecidos

> ⚠️ **Estes pontos precisam de atenção antes de qualquer uso real.**

1. **Credenciais do MongoDB Atlas committed no repositório.**
   `config/conexao.js:3` contém usuário e senha em texto puro, e o repositório
   é público. **A credencial deve ser trocada no Atlas e movida para
   `process.env.MONGODB_URI`.** Mesmo depois de remover do código, o histórico
   do Git continua expondo a senha antiga.

2. **Senha do `/admin` fixa no código.**
   `controllers/controller.js` compara a senha com a literal `'admin1502'`,
   em texto puro, sem hash, sem rate limit e sem efeito na sessão — é apenas
   uma tela intermediária antes do `/login`.

3. **Segredo de sessão fixo.**
   `'chavesecreta'` em `index.js:34` e `api/index.js:34`. Com esse segredo,
   qualquer um consegue forjar um cookie de sessão. Deveria vir do ambiente
   (`process.env.SESSION_SECRET`).

4. **Sem proteção CSRF** em nenhum formulário POST, e o cookie de sessão
   fica no padrão do `express-session` (sem `sameSite`/`secure` explícitos).

5. **Sem controle de perfil.** Qualquer usuário cadastrado em `/register` tem
   acesso total ao painel administrativo.

6. **Upload sem validação.** O `multer` não tem `limits` (tamanho) nem
   `fileFilter` (tipo) — a única restrição é o `accept="image/*"` do HTML,
   que o cliente ignora. Como as imagens viram Base64 no documento, um
   arquivo grande infla o banco.

7. **Sem rate limit** em `/site/avaliar` nem no login.

8. **`RegExp` montado com entrada do usuário** em `EntregaController.find`,
   `ContatoController.find` e `ServicoController.find` — permite ReDoS.

9. **Exclusão por `GET`** (`/produto/del/:id` e afins): qualquer imagem,
   link ou preload na página pode disparar a remoção.

10. **Tratamento de erro inconsistente.** `ServicoController` responde erro de
    banco com **HTTP 200**; `CategoriaController`, `EntregaController` e
    `ContatoController` não têm `try/catch` nenhum. Não há middleware de
    404/500 e nem `next(err)`.

11. **Validação de entrada quase inexistente.** Não há biblioteca de
    validação no projeto; só atributos HTML5 no cliente. Os `findByIdAndUpdate`
    rodam **sem `runValidators: true`**, então as regras do schema não são
    aplicadas na edição.

---

## 12. Dívida técnica

Arquivos e código sem referência, que podem ser removidos com segurança:

- `indexvercell.js` — terceira variante de entrada, não referenciada por nada e
  com caminhos quebrados.
- `routes/estoqueRoutes.js` e `controllers/EstoqueController.js` — o modelo
  `models/Estoque.js` foi apagado, então **importá-los quebra a aplicação**.
  O arquivo de rotas, aliás, é o único sem `verificarLogin`.
- `views/index.ejs` e `views/index2.ejs` — nunca renderizados.
- `authController.loginPage` / `login` / `logout` — o `login` renderiza uma
  view `"login"` que não existe; está ofuscado por `usuarioRoutes`.
- `UsuarioController.verificarLogin` — duplicata do middleware que é realmente usado.
- `aulasgit/` — arquivos de exercício, fora do escopo do projeto (e já
  versionados apesar de listados no `.gitignore`).
- 13 fotos em `public/img/*.jpg` que nenhuma página referencia.
- `body-parser` declarado no `package.json` mas nunca importado;
  `package.json` ainda se chama `vercellbase` e lista ~50 dependências
  transitivas como diretas.
- `views/site/index.ejs` renderiza `cat.descricao`, mas o modelo `Categoria`
  não tem esse campo — sempre vazio.
