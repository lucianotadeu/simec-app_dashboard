// models/Inscricao.js — Camada Model (DAO)
// Responsabilidade: APENAS acesso a dados de inscrições.

import { pool } from '../db/connection.js';

class Inscricao {

  // ── CREATE ───────────────────────────────────────────────────
  static async criar({ usuario_id, evento_id, camiseta, areas }) {
    const [result] = await pool.execute(
      `INSERT INTO inscricoes (usuario_id, evento_id, camiseta, areas)
       VALUES (?, ?, ?, ?)`,
      [usuario_id, evento_id, camiseta, areas || null]
    );
    return { id: result.insertId, usuario_id, evento_id };
  }

  // ── READ — inscrições de um usuário (com JOIN) ───────────────
  static async listarPorUsuario(usuarioId) {
    const [rows] = await pool.execute(
      `SELECT
         i.id,
         e.titulo,
         e.data_inicio,
         e.local_nome,
         i.camiseta,
         i.areas,
         i.inscrito_em
       FROM inscricoes i
       JOIN eventos e ON i.evento_id = e.id
       WHERE i.usuario_id = ?
       ORDER BY i.inscrito_em DESC`,
      [usuarioId]
    );
    return rows;
  }

  // ── READ — inscritos de um evento (admin) ────────────────────
  static async listarPorEvento(eventoId) {
    const [rows] = await pool.execute(
      `SELECT
         u.nome,
         u.email,
         i.camiseta,
         i.areas,
         i.inscrito_em
       FROM inscricoes i
       JOIN usuarios u ON i.usuario_id = u.id
       WHERE i.evento_id = ?
       ORDER BY u.nome`,
      [eventoId]
    );
    return rows;
  }

  // ── READ — verificar se usuário já está inscrito ─────────────
  static async existeInscricao(usuarioId, eventoId) {
    const [rows] = await pool.execute(
      'SELECT id FROM inscricoes WHERE usuario_id = ? AND evento_id = ?',
      [usuarioId, eventoId]
    );
    return rows.length > 0;
  }

  // ── UPDATE ───────────────────────────────────────────────────
  static async atualizarCamiseta(id, usuarioId, camiseta) {
    const [result] = await pool.execute(
      'UPDATE inscricoes SET camiseta = ? WHERE id = ? AND usuario_id = ?',
      [camiseta, id, usuarioId]
    );
    return result.affectedRows > 0;
  }

  // ── DELETE ───────────────────────────────────────────────────
  static async deletar(id, usuarioId) {
    const [result] = await pool.execute(
      'DELETE FROM inscricoes WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return result.affectedRows > 0;
  }
}

export default Inscricao;
