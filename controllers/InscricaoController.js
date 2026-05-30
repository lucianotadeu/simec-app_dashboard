// controllers/InscricaoController.js — Camada Controller
// Responsabilidade: orquestrar requisições de inscrições.
// Chama os Models Inscricao e Evento. Decide qual View usar.

import { body, validationResult } from 'express-validator';
import Inscricao                   from '../models/Inscricao.js';
import Evento                      from '../models/Evento.js';
import { gerarCsrf }               from '../middlewares/csrf.js';

// ── Regras de validação ────────────────────────────────────────
export const validarInscricao = [
  body('evento_id')
    .isInt({ min: 1 })
    .withMessage('Evento inválido.'),
  body('camiseta')
    .isIn(['P', 'M', 'G', 'GG'])
    .withMessage('Tamanho de camiseta inválido.'),
  body('areas')
    .optional()
    .trim()
    .escape(),
];

// ── Controller ─────────────────────────────────────────────────
class InscricaoController {

  // GET /inscricoes — lista inscrições do usuário logado
  static async index(req, res) {
    // Gera CSRF token antes de renderizar (necessário para fetch() do cliente)
    gerarCsrf(req, res, () => {});

    // Controller chama DOIS Models em paralelo (Promise.all = mais eficiente)
    const [inscricoes, eventos] = await Promise.all([
      Inscricao.listarPorUsuario(req.session.usuarioId),
      Evento.listarTodos(),
    ]);

    // Controller decide qual View usar e quais dados passar
    res.render('inscricoes', { inscricoes, eventos });
  }

  // POST /inscricoes — cria nova inscrição
  static async create(req, res) {
    const erros = validationResult(req);
    if (!erros.isEmpty()) {
      return res.status(400).json({ erros: erros.array() });
    }

    const { evento_id, camiseta, areas } = req.body;

    try {
      // Controller chama o Model — sem SQL aqui
      const inscricao = await Inscricao.criar({
        usuario_id: req.session.usuarioId,
        evento_id : Number(evento_id),
        camiseta,
        areas: areas || null,
      });

      res.status(201).json({
        mensagem: 'Inscrição realizada!',
        id      : inscricao.id,
      });

    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Você já está inscrito neste evento.' });
      }
      throw err;
    }
  }

  // DELETE /inscricoes/:id — cancela inscrição
  static async destroy(req, res) {
    // Controller chama o Model passando id do usuário logado (segurança: só deleta o próprio)
    const ok = await Inscricao.deletar(
      Number(req.params.id),
      req.session.usuarioId
    );

    if (!ok) {
      return res.status(404).json({ erro: 'Inscrição não encontrada.' });
    }
    res.json({ mensagem: 'Inscrição cancelada.' });
  }

  // GET /inscricoes/evento/:id — lista inscritos de um evento (uso admin/API)
  static async listByEvento(req, res) {
    const rows = await Inscricao.listarPorEvento(Number(req.params.id));
    res.json({ total: rows.length, inscritos: rows });
  }
}

export default InscricaoController;
