// server.js — SIMEC v2 MVC + Módulo Dados Abertos
import 'dotenv/config';
import express       from 'express';
import session       from 'express-session';
import helmet        from 'helmet';
import cors          from 'cors';
import rateLimit     from 'express-rate-limit';
import path          from 'path';
import { fileURLToPath } from 'url';

import { pool, testConnection } from './db/connection.js';
import authRoutes               from './routes/auth.js';
import inscricoesRoutes         from './routes/inscricoes.js';
import dashboardRoutes          from './routes/dashboard.js';
import { autenticado }          from './middlewares/autenticado.js';
import EventoController         from './controllers/EventoController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

['SESSION_SECRET'].forEach(key => {
  if (!process.env[key]) { console.error(`❌ Variável ausente: ${key}`); process.exit(1); }
});

const app    = express();
const PORT   = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc : ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc  : ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc   : ["'self'", 'https://fonts.gstatic.com'],
      imgSrc    : ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: isProd ? [process.env.APP_URL || 'https://simec-app.onrender.com'] : ['http://localhost:3000'],
  credentials: true,
}));

app.use(rateLimit({ windowMs: 60_000, max: 150 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, saveUninitialized: false,
  cookie: { secure: isProd, httpOnly: true, maxAge: 24*60*60*1000, sameSite: 'lax' },
}));

app.use((req, res, next) => {
  res.locals.usuarioNome = req.session?.usuarioNome || null;
  res.locals.usuarioId   = req.session?.usuarioId   || null;
  res.locals.csrfToken   = req.session?.csrfToken   || '';
  next();
});

// ── ROTAS ─────────────────────────────────────────────────
app.use('/',           authRoutes);
app.use('/inscricoes', inscricoesRoutes);
app.use('/dashboard',  dashboardRoutes);   // ← módulo dados abertos
app.get('/', EventoController.index);

app.use((req, res) => res.status(404).render('erro', { codigo: 404, mensagem: 'Página não encontrada.' }));
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status||500).render('erro', {
    codigo: err.status||500,
    mensagem: isProd ? 'Erro interno.' : err.message,
  });
});

async function start() {
  await testConnection();

  // Criar tabela de cache se não existir
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS cache_dados (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      chave     VARCHAR(100) NOT NULL UNIQUE,
      valor     LONGTEXT     NOT NULL,
      expira_em TIMESTAMP    NOT NULL,
      criado_em TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_chave (chave)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      COMMENT='Cache de dados públicos externos'
  `);

  app.listen(PORT, () => {
    console.log(`🚀 SIMEC MVC em http://localhost:${PORT}`);
    console.log(`   📊 Dashboard: http://localhost:${PORT}/dashboard`);
  });
}

start();
