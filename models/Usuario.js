// models/Usuario.js — Camada Model (DAO)
// Responsabilidade: APENAS acesso a dados de usuários.
// Não importa express. Não usa req/res. Totalmente testável isoladamente.

import { pool }  from '../db/connection.js';
import bcrypt    from 'bcryptjs';

class Usuario {

  // ── CREATE ──────────────────────────────────────────────────
  static async criar({ nome, email, senha }) {
    const senhaHash = await bcrypt.hash(senha, 12);
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );
    return { id: result.insertId, nome, email };
  }

  // ── READ — por email (login) ─────────────────────────────────
  static async buscarPorEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  // ── READ — por id (perfil / sessão) ─────────────────────────
  static async buscarPorId(id) {
    const [rows] = await pool.execute(
      'SELECT id, nome, email, criado_em FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // ── READ — listar todos (painel admin) ──────────────────────
  static async listarTodos() {
    const [rows] = await pool.execute(
      'SELECT id, nome, email, criado_em FROM usuarios ORDER BY nome'
    );
    return rows;
  }

  // ── UPDATE ───────────────────────────────────────────────────
  static async atualizar(id, { nome, email }) {
    const [result] = await pool.execute(
      'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?',
      [nome, email, id]
    );
    return result.affectedRows > 0;
  }

  // ── DELETE ───────────────────────────────────────────────────
  static async deletar(id) {
    const [result] = await pool.execute(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // ── Verificar senha (login) ──────────────────────────────────
  static async verificarSenha(senhaTexto, senhaHash) {
    return bcrypt.compare(senhaTexto, senhaHash);
  }
}

export default Usuario;
