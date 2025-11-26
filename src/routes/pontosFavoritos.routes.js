const express = require('express');
const { pool } = require('../db');
const { autenticarUsuario } = require('../middlewares/autenticacao');

const router = express.Router();

/**
 * GET /pontos-favoritos
 *
 * Lista os pontos favoritos do usuário logado.
 */
router.get('/', autenticarUsuario, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;

    const resultado = await pool.query(
      `SELECT fs.id,
              s.id AS stop_id,
              s.name,
              s.latitude,
              s.longitude,
              s.description,
              fs.created_at
       FROM favorite_stops fs
       JOIN stops s ON s.id = fs.stop_id
       WHERE fs.user_id = $1
       ORDER BY fs.created_at DESC`,
      [usuarioId]
    );

    return res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao buscar pontos favoritos do usuário.' });
  }
});

/**
 * POST /pontos-favoritos
 *
 * Body: { stopId }
 * Salva um ponto de ônibus como favorito do usuário logado.
 */
router.post('/', autenticarUsuario, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { stopId } = req.body;

    if (!stopId) {
      return res.status(400).json({ error: 'stopId é obrigatório.' });
    }

    const pontoExiste = await pool.query(
      'SELECT id FROM stops WHERE id = $1',
      [stopId]
    );

    if (pontoExiste.rows.length === 0) {
      return res.status(404).json({ error: 'Ponto de ônibus não encontrado.' });
    }

    const resultado = await pool.query(
      `INSERT INTO favorite_stops (user_id, stop_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, stop_id) DO NOTHING
       RETURNING id, user_id, stop_id, created_at`,
      [usuarioId, stopId]
    );

    if (resultado.rows.length === 0) {
      return res
        .status(200)
        .json({ message: 'Ponto já estava salvo como favorito.' });
    }

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao salvar ponto favorito.' });
  }
});

/**
 * DELETE /pontos-favoritos/:stopId
 *
 * Remove um ponto de ônibus dos favoritos do usuário.
 */
router.delete('/:stopId', autenticarUsuario, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { stopId } = req.params;

    const resultado = await pool.query(
      `DELETE FROM favorite_stops
       WHERE user_id = $1 AND stop_id = $2`,
      [usuarioId, stopId]
    );

    if (resultado.rowCount === 0) {
      return res
        .status(404)
        .json({ error: 'Ponto favorito não encontrado para este usuário.' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao remover ponto favorito.' });
  }
});

module.exports = router;
