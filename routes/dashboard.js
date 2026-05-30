// routes/dashboard.js — Rotas do módulo de Dados Abertos
// Padrão MVC: apenas mapeia método HTTP + caminho → Controller

import { Router }           from 'express';
import { autenticado }      from '../middlewares/autenticado.js';
import DashboardController  from '../controllers/DashboardController.js';

const router = Router();

// GET  /dashboard               → página principal com gráficos
router.get ('/',                  autenticado, DashboardController.index);

// GET  /dashboard/api/:dataset  → endpoint JSON para cada dataset
router.get ('/api/:dataset',      autenticado, DashboardController.apiDataset);

// POST /dashboard/cache/limpar  → força recarga dos dados externos
router.post('/cache/limpar',      autenticado, DashboardController.limparCache);

export default router;
