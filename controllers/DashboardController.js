// controllers/DashboardController.js — Controller do módulo de dados abertos
// Padrão MVC: orquestra chamadas ao Model e decide qual View renderizar.
// SEM SQL direto. SEM lógica de apresentação.

import DadosAbertos from '../models/DadosAbertos.js';

class DashboardController {

  // GET /dashboard — página principal com todos os gráficos
  static async index(req, res) {
    try {
      // Buscar todos os datasets em paralelo (Promise.all = máxima eficiência)
      const [
        matriculasPorRegiao,
        evolucaoTI,
        notasEnade,
        mercadoTI,
        vagasPorUF,
      ] = await Promise.all([
        DadosAbertos.matriculasPorRegiao(),
        DadosAbertos.evolucaoCursosTI(),
        DadosAbertos.notasEnadePorArea(),
        DadosAbertos.mercadoTrabalhoTI(),
        DadosAbertos.vagasPorUF(),
      ]);

      // KPIs derivados dos datasets — lógica no Controller, não na View
      const totalMatriculas  = matriculasPorRegiao.reduce((s, r) => s + r.matriculas, 0);
      const totalCursos      = matriculasPorRegiao.reduce((s, r) => s + r.cursos, 0);
      const saldoEmpregoAnual= mercadoTI.reduce((s, m) => s + m.saldo, 0);
      const maiorRegiao      = [...matriculasPorRegiao].sort((a, b) => b.matriculas - a.matriculas)[0];
      const menorNota        = [...notasEnade].sort((a, b) => a.media - b.media)[0];
      const maiorNota        = [...notasEnade].sort((a, b) => b.media - a.media)[0];

      res.render('dashboard', {
        // Datasets serializados para JS do cliente (Chart.js)
        json: {
          matriculasPorRegiao : JSON.stringify(matriculasPorRegiao),
          evolucaoTI          : JSON.stringify(evolucaoTI),
          notasEnade          : JSON.stringify(notasEnade),
          mercadoTI           : JSON.stringify(mercadoTI),
          vagasPorUF          : JSON.stringify(vagasPorUF),
        },
        // KPIs formatados para o template
        kpis: {
          totalMatriculas : totalMatriculas.toLocaleString('pt-BR'),
          totalCursos     : totalCursos.toLocaleString('pt-BR'),
          saldoEmprego    : saldoEmpregoAnual.toLocaleString('pt-BR'),
          maiorRegiao     : maiorRegiao.regiao,
          maiorNota       : `${maiorNota.area} (${maiorNota.media})`,
          menorNota       : `${menorNota.area} (${menorNota.media})`,
        },
        meta: {
          fonte       : 'INEP · Censo Educação Superior 2022 · CAGED/MTE 2023 · e-MEC',
          atualizacao : new Date().toLocaleDateString('pt-BR'),
          totalRegistros: (
            matriculasPorRegiao.length +
            evolucaoTI.length +
            notasEnade.length +
            mercadoTI.length +
            vagasPorUF.length
          ),
        },
      });

    } catch (err) {
      console.error('Erro no DashboardController.index:', err);
      res.status(500).render('erro', {
        codigo: 500,
        mensagem: 'Erro ao carregar dados do dashboard.',
      });
    }
  }

  // GET /dashboard/api/:dataset — endpoint JSON para atualização via fetch()
  static async apiDataset(req, res) {
    const { dataset } = req.params;

    const datasetsDisponiveis = {
      matriculas : DadosAbertos.matriculasPorRegiao,
      evolucao   : DadosAbertos.evolucaoCursosTI,
      enade      : DadosAbertos.notasEnadePorArea,
      mercado    : DadosAbertos.mercadoTrabalhoTI,
      vagas      : DadosAbertos.vagasPorUF,
    };

    const fn = datasetsDisponiveis[dataset];
    if (!fn) {
      return res.status(404).json({
        erro: 'Dataset não encontrado.',
        disponiveis: Object.keys(datasetsDisponiveis),
      });
    }

    try {
      const dados = await fn();
      res.json({
        dataset,
        total : dados.length,
        dados,
        fonte : 'INEP/CAGED/e-MEC — Dados Abertos do Governo Federal',
      });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  }

  // POST /dashboard/cache/limpar — força atualização dos dados
  static async limparCache(req, res) {
    try {
      const removidos = await DadosAbertos.limparCache();
      res.json({ mensagem: `Cache limpo. ${removidos} registros removidos.` });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  }
}

export default DashboardController;
