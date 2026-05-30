// routes/inscricoes.js — Camada de Roteamento
// Responsabilidade: APENAS mapear método HTTP + caminho → Controller.
// Sem lógica. Sem SQL. Sem HTML.

import { Router }          from 'express';
import { autenticado }     from '../middlewares/autenticado.js';
import { verificarCsrf }   from '../middlewares/csrf.js';
import InscricaoController, {
  validarInscricao,
}                          from '../controllers/InscricaoController.js';

const router = Router();

// GET  /inscricoes          → lista inscrições do usuário logado
router.get   ('/',          autenticado,                                   InscricaoController.index);

// POST /inscricoes          → nova inscrição (JSON API)
router.post  ('/',          autenticado, verificarCsrf, ...validarInscricao, InscricaoController.create);

// DELETE /inscricoes/:id    → cancelar inscrição (JSON API)
router.delete('/:id',       autenticado, verificarCsrf,                    InscricaoController.destroy);

// GET  /inscricoes/evento/:id → listar inscritos de um evento
router.get   ('/evento/:id', autenticado,                                  InscricaoController.listByEvento);

export default router;
