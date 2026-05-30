// controllers/EventoController.js — Camada Controller
// Responsabilidade: orquestrar requisições da página inicial e eventos.

import Evento    from '../models/Evento.js';
import { gerarCsrf } from '../middlewares/csrf.js';

class EventoController {

  // GET / — página inicial com lista de eventos
  static async index(req, res) {
    gerarCsrf(req, res, () => {});

    // Controller chama o Model
    const eventos = await Evento.listarTodos();

    // Controller passa dados para a View
    res.render('index', { eventos });
  }
}

export default EventoController;
