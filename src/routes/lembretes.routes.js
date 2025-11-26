const express = require('express');
const { pool } = require('../db');
const { autenticarUsuario } = require('../middlewares/autenticacao');

const router = express.Router();

/**
 * GET /lembretes
 * Lista lembretes do usuário logado
 */
router.get('/', autenticarUsuario, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;

    const resultado = await pool.query(
      `
      SELECT
        id,
        ponto_id,
        ponto_nome,
        onibus_id,
        onibus_nome,
        onibus_codigo,
        horario,
        reminder_datetime,
        created_at
      FROM lembretes
      WHERE user_id = $1
      ORDER BY reminder_datetime
      `,
      [usuarioId]
    );

    return res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao buscar lembretes.' });
  }
});

/**
 * POST /lembretes
 * Body: { pontoId, pontoNome, onibusId, onibusNome, onibusCodigo, horario }
 * Cria um lembrete para o dia seguinte no horário informado
 */
router.post('/', autenticarUsuario, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const {
      pontoId,
      pontoNome,
      onibusId,
      onibusNome,
      onibusCodigo,
      horario,
    } = req.body;

    if (!pontoId || !pontoNome || !onibusId || !onibusNome || !onibusCodigo || !horario) {
      return res.status(400).json({
        error: 'Informe pontoId, pontoNome, onibusId, onibusNome, onibusCodigo e horario.',
      });
    }

    // calcula o horário de lembrete: amanhã no mesmo horário
    const resultado = await pool.query(
      `
      INSERT INTO lembretes (
        user_id,
        onibus_id,
        ponto_id,
        ponto_nome,
        onibus_nome,
        onibus_codigo,
        horario,
        reminder_datetime
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7::time,
        (date_trunc('day', NOW() + INTERVAL '1 day') + $7::time)
      )
      RETURNING *
      `,
      [
        usuarioId,
        onibusId,
        pontoId,
        pontoNome,
        onibusNome,
        onibusCodigo,
        horario,
      ]
    );

    return res.status(201).json({
      message: 'Lembrete criado com sucesso.',
      lembrete: resultado.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao criar lembrete.' });
  }
});

/**
 * DELETE /lembretes/:id
 * Remove um lembrete
 */
router.delete('/:id', autenticarUsuario, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { id } = req.params;

    await pool.query(
      `
      DELETE FROM lembretes
      WHERE id = $1 AND user_id = $2
      `,
      [id, usuarioId]
    );

    return res.json({ message: 'Lembrete removido com sucesso.' });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao remover lembrete.' });
  }
});

module.exports = router;
