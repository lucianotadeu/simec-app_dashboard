// models/Evento.js — Camada Model (DAO)
// Responsabilidade: APENAS acesso a dados de eventos.

import { pool } from '../db/connection.js';

class Evento {

  // ── READ — listar todos ──────────────────────────────────────
  static async listarTodos() {
    const [rows] = await pool.execute(
      `SELECT id, titulo, descricao, data_inicio, local_nome, vagas
       FROM eventos
       ORDER BY data_inicio`
    );
    return rows;
  }

  // ── READ — buscar por id ─────────────────────────────────────
  static async buscarPorId(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM eventos WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // ── CREATE ───────────────────────────────────────────────────
  static async criar({ titulo, descricao, data_inicio, local_nome, vagas }) {
    const [result] = await pool.execute(
      `INSERT INTO eventos (titulo, descricao, data_inicio, local_nome, vagas)
       VALUES (?, ?, ?, ?, ?)`,
      [titulo, descricao || null, data_inicio, local_nome || null, vagas || 100]
    );
    return { id: result.insertId, titulo };
  }

  // ── Contar inscrições de um evento ───────────────────────────
  static async contarInscritos(eventoId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM inscricoes WHERE evento_id = ?',
      [eventoId]
    );
    return rows[0].total;
  }
}

export default Evento;
