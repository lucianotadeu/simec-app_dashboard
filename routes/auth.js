// routes/auth.js — Camada de Roteamento
// Responsabilidade: APENAS mapear método HTTP + caminho → Controller.
// Sem lógica. Sem SQL. Sem HTML.

import { Router }        from 'express';
import { verificarCsrf } from '../middlewares/csrf.js';
import rateLimit         from 'express-rate-limit';
import AuthController, {
  validarCadastro,
  validarLogin,
}                        from '../controllers/AuthController.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max     : 10,
  message : { erro: 'Muitas tentativas. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders  : false,
});

// GET  /cadastro → exibe formulário
router.get ('/cadastro', AuthController.showCadastro);

// POST /cadastro → processa cadastro
router.post('/cadastro',
  verificarCsrf,
  ...validarCadastro,
  AuthController.cadastrar
);

// GET  /login → exibe formulário
router.get ('/login', AuthController.showLogin);

// POST /login → autentica
router.post('/login',
  loginLimiter,
  verificarCsrf,
  ...validarLogin,
  AuthController.login
);

// POST /logout → encerra sessão
router.post('/logout', AuthController.logout);

export default router;
