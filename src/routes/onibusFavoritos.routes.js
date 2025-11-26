const express = require('express');
const router = express.Router();

// IMPORTAÇÕES CORRETAS:
const { pool } = require('../db');
const { autenticarUsuario } = require('../middlewares/autenticacao');

/**
 * GET /onibus-favoritos
 * Lista os ônibus favoritos do usuário logado
 */
router.get('/', autenticarUsuario, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;

    const resultado = await pool.query(
      `
      SELECT
        fo.onibus_id,
        o.nome,
        o.codigo,
        fo.created_at
      FROM favorite_onibus fo
      JOIN onibus o ON o.id = fo.onibus_id
      WHERE fo.user_id = $1
      ORDER BY o.codigo
      `,
      [usuarioId]
    );

    return res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao buscar ônibus favoritos.' });
  }
});

/**
 * POST /onibus-favoritos
 * Corpo: { onibusId: string }
 * Adiciona um ônibus aos favoritos do usuário
 */
router.post('/', autenticarUsuario, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { onibusId } = req.body;

    if (!onibusId) {
      return res
        .status(400)
        .json({ error: 'Informe o onibusId no corpo da requisição.' });
    }

    await pool.query(
      `
      INSERT INTO favorite_onibus (user_id, onibus_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, onibus_id) DO NOTHING
      `,
      [usuarioId, onibusId]
    );

    return res.status(201).json({
      message: 'Ônibus favorito salvo com sucesso.',
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao salvar ônibus favorito.' });
  }
});

/**
 * DELETE /onibus-favoritos/:onibusId
 * Remove um ônibus dos favoritos do usuário
 */
router.delete('/:onibusId', autenticarUsuario, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { onibusId } = req.params;

    await pool.query(
      `
      DELETE FROM favorite_onibus
      WHERE user_id = $1
        AND onibus_id = $2
      `,
      [usuarioId, onibusId]
    );

    return res.json({
      message: 'Ônibus removido dos favoritos.',
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao remover ônibus favorito.' });
  }
});

module.exports = router;
