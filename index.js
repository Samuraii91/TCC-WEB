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
  secret: 'chavesecreta', // pode ser qualquer string
  resave: false,
  saveUninitialized: false
}));

// Middleware para passar usuário logado para views
app.use((req, res, next) => {
  res.locals.usuarioId = req.session.usuarioId || null;
  res.locals.usuarioNome = req.session.usuarioNome || null;
  next();
});

// Uso das rotas
app.use('/', usuarioRoutes);     // Login e logout
app.use('/', categoriaRoutes);   // Categorias
app.use('/', produtoRoutes);     // Produtos
app.use('/', entregaRoutes);     // Entregas
app.use('/', servicoRoutes);     // Serviços
app.use('/', authRoutes);        // Autenticação
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

// Porta do servidor (permite sobrescrever com VAR de ambiente)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
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

export default app;
