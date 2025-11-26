const express = require('express');
const { pool } = require('../db');
const { autenticarUsuario } = require('../middlewares/autenticacao');

const router = express.Router();

// GET /onibus/:onibusId/rota
router.get('/:onibusId/rota', autenticarUsuario, async (req, res) => {
  try {
    const { onibusId } = req.params;

    const resultado = await pool.query(
      `
      WITH ordered AS (
        SELECT
          -- menor sequência daquele ponto para esse ônibus
          MIN(stop_sequence) AS stop_sequence,
          stop_id
        FROM stop_times
        WHERE onibus_id = $1
        GROUP BY stop_id
      )
      SELECT
        o.stop_sequence,
        s.id          AS stop_id,
        s.name        AS stop_name,
        s.description AS stop_description,
        s.latitude,
        s.longitude
      FROM ordered o
      JOIN stops s ON s.id = o.stop_id
      ORDER BY o.stop_sequence;
      `,
      [onibusId]
    );

    return res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar rota do ônibus.' });
  }
});

module.exports = router;
