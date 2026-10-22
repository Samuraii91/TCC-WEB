import express from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Rotas específicas
import produtoRoutes from './routes/produtoRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import entregaRoutes from './routes/entregaRoutes.js';
import servicoRoutes from './routes/servicoRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contatoRoutes from './routes/contatoRoutes.js';
import siteRoutes from './routes/route.js';

const app = express();

// Necessário para cookies "secure" funcionarem atrás do proxy do Render/Vercel
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Configuração de parser
app.use(express.urlencoded({ extended: true }));

// Configuração do EJS
app.set('view engine', 'ejs');

// Caminhos absolutos
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Servir arquivos estáticos e definir pasta de views
app.use(express.static(join(__dirname, '/public')));
app.set('views', join(__dirname, '/views'));

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'chavesecreta',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: 'auto'
  }
}));

// Middleware para passar usuário logado para views
app.use((req, res, next) => {
  const usuario = req.session.usuario || null;
  res.locals.usuarioId = usuario ? usuario.id : null;
  res.locals.usuarioNome = usuario ? usuario.nome : null;
  next();
});

// Uso das rotas
app.use('/', usuarioRoutes);     // Login e logout
app.use('/', categoriaRoutes);   // Categorias
app.use('/', produtoRoutes);     // Produtos
app.use('/', entregaRoutes);     // Entregas
app.use('/', servicoRoutes);     // Serviços
app.use('/', authRoutes);        // Cadastro de usuários
app.use('/', contatoRoutes);     // Orçamentos
app.use('/', siteRoutes);        // Rotas do site

// Healthcheck simples (usado pelo autoping e por monitoramentos)
app.get('/healthcheck', (req, res) => {
  res.status(200).send('OK');
});

// Página inicial: se já estiver logado, vai para o painel; senão, para o login
app.get('/', (req, res) => {
  if (req.session.usuario) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// 404
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

// Tratamento centralizado de erros (inclusive erros de upload do multer)
app.use((erro, req, res, next) => {
  console.error('Erro não tratado:', erro);

  if (res.headersSent) {
    return next(erro);
  }

  if (erro && erro.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).send('A imagem enviada é muito grande (limite de 5 MB).');
  }

  if (erro && erro.status && erro.status >= 400 && erro.status < 500) {
    return res.status(erro.status).send(erro.message);
  }

  res.status(500).send('Erro interno do servidor.');
});

// Porta do servidor (permite sobrescrever com VAR de ambiente)
const PORT = process.env.PORT || 3001;

// Na Vercel não devemos abrir uma porta: o handler é exportado.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });

  // Autoping para evitar o spin-down do Render (plano gratuito)
  // O Render define RENDER_EXTERNAL_URL automaticamente; localmente usamos o próprio host.
  const URL_SELF = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const INTERVALO_PING = 12 * 60 * 1000; // 12 minutos (menor que os 15 min de inatividade)

  setInterval(async () => {
    try {
      const resposta = await fetch(`${URL_SELF}/healthcheck`);
      console.log(`[autoping] ${new Date().toLocaleString('pt-BR')} - status ${resposta.status}`);
    } catch (erro) {
      console.error(`[autoping] ${new Date().toLocaleString('pt-BR')} - falha: ${erro.message}`);
    }
  }, INTERVALO_PING);
}

export default app;
