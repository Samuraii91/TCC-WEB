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
import siteRoutes from './routes/route.js';
import estoqueRoutes from './routes/estoqueRoutes.js';

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
app.use('/', siteRoutes);        // Rotas do site
app.use('/', estoqueRoutes);     // Estoque
// Página inicial redireciona para login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Porta do servidor (permite sobrescrever com VAR de ambiente)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

export default app;
