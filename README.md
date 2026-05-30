# SIMEC — Sistema de Inscrição em Evento Acadêmico

> Aplicação web full-stack desenvolvida na disciplina de **Desenvolvimento de Software para Web** — Engenharia da Computação.  
> Refatorada para o padrão arquitetural **MVC (Model-View-Controller)**.

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![Express](https://img.shields.io/badge/Express-4-blue)
![MySQL](https://img.shields.io/badge/MySQL-8-orange)
![Padrão](https://img.shields.io/badge/Padrão-MVC-purple)
![Deploy](https://img.shields.io/badge/Deploy-Render-success)

---

## 🏗️ Arquitetura MVC

```
Requisição HTTP
      │
      ▼
┌─────────────────────────────────────────────┐
│               ROUTES (routes/)              │  ← só mapeia HTTP → Controller
│  router.get('/', InscricaoController.index) │
└──────────────────┬──────────────────────────┘
                   │ chama
                   ▼
┌─────────────────────────────────────────────┐
│           CONTROLLER (controllers/)          │  ← orquestra, sem SQL
│  - Recebe req/res                           │
│  - Valida entrada                           │
│  - Chama Model                              │
│  - Decide qual View renderizar              │
└─────────┬──────────────────────┬────────────┘
          │ chama                │ res.render()
          ▼                      ▼
┌──────────────────┐   ┌──────────────────────┐
│   MODEL (models/) │   │    VIEW (views/)      │
│  - SQL puro       │   │  - Templates EJS      │
│  - Sem req/res    │   │  - Só apresenta dados │
│  - Testável       │   │  - Sem lógica         │
└──────────────────┘   └──────────────────────┘
```

## 📁 Estrutura do Projeto

```
simec-app/
│
├── server.js                    # Entrada: Express + middlewares globais
├── package.json
├── .env.example
├── .gitignore
│
├── controllers/                 # ── CONTROLLER ──
│   ├── AuthController.js        # Cadastro, login, logout
│   ├── InscricaoController.js   # CRUD de inscrições
│   └── EventoController.js      # Página inicial / eventos
│
├── models/                      # ── MODEL (DAO) ──
│   ├── Usuario.js               # criar, buscarPorEmail, verificarSenha...
│   ├── Inscricao.js             # criar, listarPorUsuario, deletar...
│   └── Evento.js                # listarTodos, buscarPorId...
│
├── routes/                      # ── ROTEAMENTO ──
│   ├── auth.js                  # GET/POST /login /cadastro /logout
│   └── inscricoes.js            # GET/POST/DELETE /inscricoes
│
├── views/                       # ── VIEW ──
│   ├── index.ejs                # Página inicial
│   ├── login.ejs
│   ├── cadastro.ejs
│   ├── inscricoes.ejs
│   ├── erro.ejs
│   └── partials/
│       ├── header.ejs
│       └── footer.ejs
│
├── middlewares/
│   ├── autenticado.js           # Guard de autenticação
│   └── csrf.js                  # Proteção CSRF
│
├── db/
│   ├── connection.js            # Pool mysql2
│   └── migrate.js               # Cria tabelas automaticamente
│
└── public/
    ├── css/style.css
    └── js/app.js
```

## 🔄 Responsabilidade de cada camada

| Camada | Pasta | Responsabilidade | NÃO deve ter |
|--------|-------|-----------------|--------------|
| **View** | `views/` | Exibir dados recebidos do Controller | SQL, lógica de negócio |
| **Controller** | `controllers/` | Receber req, chamar Model, escolher View | SQL direto, HTML |
| **Model (DAO)** | `models/` | Acessar banco, encapsular SQL | req, res, HTML |
| **Route** | `routes/` | Mapear HTTP + path → Controller | Qualquer lógica |

## ✨ Funcionalidades

- Cadastro e autenticação de usuários (bcrypt + sessão)
- Listagem de eventos acadêmicos
- Inscrição em eventos com escolha de camiseta e áreas de interesse
- Cancelamento de inscrição
- Interface responsiva (mobile e desktop)
- Proteção CSRF, rate limiting e headers de segurança (helmet)

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| Banco de dados | MySQL 8 |
| Driver BD | mysql2 (Promise-based) |
| Template engine | EJS |
| Segurança | bcryptjs, helmet, express-rate-limit, CSRF |
| Validação | express-validator |
| Deploy | Render + Railway |

## 🚀 Executar Localmente

### Pré-requisitos
- Node.js 20+
- MySQL 8 rodando (XAMPP, Docker ou nativo)

### Instalação

```bash
# 1. Clonar
git clone https://github.com/seu-usuario/simec-app.git
cd simec-app

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais locais

# 4. Criar banco e tabelas
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS simec_db CHARACTER SET utf8mb4;"
npm run db:migrate

# 5. Iniciar em modo desenvolvimento
npm run dev
# Acesse: http://localhost:3000
```

### Arquivo `.env`

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=simec_db
DB_USER=root
DB_PASS=
SESSION_SECRET=gere_com_node_crypto_randomBytes_64
```

**Gerar SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🌐 Deploy (Render + Railway)

1. **Railway** → New Project → Deploy MySQL → copiar variáveis de conexão
2. **Render** → New Web Service → conectar GitHub
   - Build: `npm install`
   - Start: `npm start`
3. Configurar variáveis de ambiente no painel do Render
4. Shell do Render: `npm run db:migrate`

## 🔐 Segurança implementada

| Vulnerabilidade | Proteção |
|----------------|---------|
| SQL Injection | Placeholders `?` em todas as queries (mysql2) |
| XSS | EJS escapa automaticamente; `textContent` no cliente |
| CSRF | Token por sessão com `crypto.timingSafeEqual` |
| Força bruta login | `express-rate-limit` (10 tentativas / 15 min / IP) |
| Senhas | Hash bcrypt (custo 12) — nunca texto puro |
| Session Fixation | `session.regenerate()` após login |
| Headers HTTP | `helmet()` — CSP, X-Frame-Options, HSTS... |
| Dados sensíveis | Variáveis de ambiente (.env) |

## 📋 Rotas da aplicação

| Método | Rota | Controller.método | Auth? |
|--------|------|-------------------|-------|
| GET | `/` | EventoController.index | Não |
| GET | `/cadastro` | AuthController.showCadastro | Não |
| POST | `/cadastro` | AuthController.cadastrar | Não |
| GET | `/login` | AuthController.showLogin | Não |
| POST | `/login` | AuthController.login | Não |
| POST | `/logout` | AuthController.logout | Sim |
| GET | `/inscricoes` | InscricaoController.index | Sim |
| POST | `/inscricoes` | InscricaoController.create | Sim |
| DELETE | `/inscricoes/:id` | InscricaoController.destroy | Sim |
| GET | `/inscricoes/evento/:id` | InscricaoController.listByEvento | Sim |

## 👥 Equipe

| Nome | GitHub | Responsabilidade |
|------|--------|-----------------|
| Nome 1 | @usuario | Front-end / CSS |
| Nome 2 | @usuario | Controllers / Rotas |
| Nome 3 | @usuario | Models / Banco de dados |
| Nome 4 | @usuario | Segurança / Deploy |
| Nome 5 | @usuario | Documentação / Testes |

## 📄 Licença

MIT © 2026 — Engenharia da Computação · Disciplina de Desenvolvimento Web
