// controllers/AuthController.js — Camada Controller
// Responsabilidade: receber req HTTP, chamar o Model adequado,
// decidir qual View renderizar ou para onde redirecionar.
// NUNCA contém SQL. NUNCA gera HTML diretamente.

import { body, validationResult } from 'express-validator';
import Usuario                    from '../models/Usuario.js';
import { gerarCsrf }              from '../middlewares/csrf.js';

// ── Regras de validação reutilizáveis ──────────────────────────
export const validarCadastro = [
  body('nome')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome deve ter entre 3 e 100 caracteres.'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Informe um e-mail válido.'),
  body('senha')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter no mínimo 8 caracteres.'),
];

export const validarLogin = [
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
  body('senha').notEmpty().withMessage('Senha obrigatória.'),
];

// ── Controller ─────────────────────────────────────────────────
class AuthController {

  // GET /cadastro — exibe formulário
  static showCadastro(req, res) {
    gerarCsrf(req, res, () => {});
    res.render('cadastro', { erros: [], valores: {} });
  }

  // POST /cadastro — processa cadastro
  static async cadastrar(req, res) {
    const erros = validationResult(req);
    if (!erros.isEmpty()) {
      return res.status(400).render('cadastro', {
        erros  : erros.array(),
        valores: req.body,
      });
    }

    const { nome, email, senha } = req.body;

    try {
      // Controller chama o Model — sem SQL aqui
      await Usuario.criar({ nome, email, senha });
      res.redirect('/login?cadastro=ok');

    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).render('cadastro', {
          erros  : [{ msg: 'Este e-mail já está cadastrado.' }],
          valores: req.body,
        });
      }
      throw err; // propaga para middleware de erro global
    }
  }

  // GET /login — exibe formulário
  static showLogin(req, res) {
    gerarCsrf(req, res, () => {});
    res.render('login', {
      sucesso: req.query.cadastro === 'ok' ? 'Conta criada! Faça login.' : null,
      erro   : null,
    });
  }

  // POST /login — autentica usuário
  static async login(req, res) {
    const erros = validationResult(req);
    if (!erros.isEmpty()) {
      return res.status(400).render('login', {
        erro   : erros.array()[0].msg,
        sucesso: null,
      });
    }

    const { email, senha } = req.body;

    // Controller chama o Model — sem SQL aqui
    const usuario = await Usuario.buscarPorEmail(email);
    const senhaOk = usuario && await Usuario.verificarSenha(senha, usuario.senha_hash);

    if (!senhaOk) {
      return res.status(401).render('login', {
        erro   : 'E-mail ou senha incorretos.',
        sucesso: null,
      });
    }

    // Regenerar sessão após login — previne session fixation
    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.usuarioId   = usuario.id;
      req.session.usuarioNome = usuario.nome;
      const destino = req.session.returnTo || '/';
      delete req.session.returnTo;
      res.redirect(destino);
    });
  }

  // POST /logout
  static logout(req, res) {
    req.session.destroy(() => res.redirect('/login'));
  }
}

export default AuthController;
