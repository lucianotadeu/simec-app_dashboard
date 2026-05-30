# MVC no SIMEC — Guia de Aula

## O que mudou em relação à versão anterior?

### Versão antiga (sem MVC explícito)
```
routes/auth.js       ← continha: validação + SQL + lógica de sessão
routes/inscricoes.js ← continha: validação + SQL + controle de fluxo
```

### Versão MVC
```
routes/auth.js       ← APENAS: mapeia rota → AuthController
controllers/AuthController.js    ← orquestra, valida, decide View
models/Usuario.js                ← TODO o SQL de usuários

routes/inscricoes.js ← APENAS: mapeia rota → InscricaoController
controllers/InscricaoController.js ← orquestra, valida, decide View
models/Inscricao.js              ← TODO o SQL de inscrições
models/Evento.js                 ← TODO o SQL de eventos
```

---

## Fluxo de uma requisição GET /inscricoes

```
Browser
  │
  │  GET /inscricoes
  ▼
routes/inscricoes.js
  router.get('/', autenticado, InscricaoController.index)
  │
  │  chama InscricaoController.index(req, res)
  ▼
controllers/InscricaoController.js  ← CONTROLLER
  1. gerarCsrf(req, res, () => {})
  2. inscricoes = await Inscricao.listarPorUsuario(req.session.usuarioId)
  3. eventos    = await Evento.listarTodos()
  4. res.render('inscricoes', { inscricoes, eventos })
  │
  ├─── chama Inscricao.listarPorUsuario(userId)
  │    models/Inscricao.js  ← MODEL
  │    SELECT i.*, e.titulo FROM inscricoes i
  │    JOIN eventos e ON i.evento_id = e.id
  │    WHERE i.usuario_id = ?
  │    → retorna array de objetos
  │
  ├─── chama Evento.listarTodos()
  │    models/Evento.js  ← MODEL
  │    SELECT id, titulo... FROM eventos ORDER BY data_inicio
  │    → retorna array de objetos
  │
  └─── res.render('inscricoes', { inscricoes, eventos })
       views/inscricoes.ejs  ← VIEW
       Recebe { inscricoes, eventos } e gera HTML
       NÃO faz SQL. NÃO valida. Só apresenta.
  │
  ▼
Browser recebe HTML renderizado
```

---

## Fluxo de uma requisição POST /inscricoes

```
Browser
  │  POST /inscricoes  { evento_id: 1, camiseta: 'M' }
  ▼
routes/inscricoes.js
  router.post('/', autenticado, verificarCsrf, ...validarInscricao,
              InscricaoController.create)
  │
  │  Middlewares na ordem:
  │  1. autenticado    → verifica sessão
  │  2. verificarCsrf  → valida token CSRF
  │  3. validarInscricao → valida campos (express-validator)
  │  4. InscricaoController.create(req, res)
  ▼
controllers/InscricaoController.js  ← CONTROLLER
  1. validationResult(req) → se erros, retorna 400 JSON
  2. await Inscricao.criar({ usuario_id, evento_id, camiseta, areas })
  3. res.status(201).json({ mensagem: 'Inscrição realizada!', id })
  │
  └─── chama Inscricao.criar({ ... })
       models/Inscricao.js  ← MODEL
       INSERT INTO inscricoes (usuario_id, evento_id, camiseta, areas)
       VALUES (?, ?, ?, ?)
       → retorna { id: insertId, ... }
  │
  ▼
Browser recebe JSON { mensagem: 'Inscrição realizada!', id: 3 }
public/js/app.js (cliente) atualiza a UI sem recarregar
```

---

## Por que isso é melhor?

| Cenário | Sem MVC | Com MVC |
|---------|---------|---------|
| Mudar tabela SQL | Alterar routes/ (misturado) | Alterar apenas models/ |
| Mudar layout da página | Alterar routes/ (misturado) | Alterar apenas views/ |
| Testar só o banco | Impossível sem HTTP | Chamar Model direto: `Usuario.criar(...)` |
| Adicionar nova rota | Copia bloco gigante | 1 linha em routes/ + método no Controller |
| Trabalho em equipe | Conflito de merge constante | Front cuida de views/, back cuida de controllers/ e models/ |
