const express = require('express');
const { pool } = require('../db');
const { autenticarUsuario } = require('../middlewares/autenticacao');

const router = express.Router();

/**
 * Função auxiliar para calcular distância entre dois pontos (em metros)
 * usando a fórmula de Haversine.
 */
function calcularDistanciaEmMetros(lat1, lon1, lat2, lon2) {
  function toRad(valor) {
    return (valor * Math.PI) / 180;
  }

  const R = 6371000; // raio da Terra em metros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;

  return distancia;
}

/**
 * GET /pontos/proximos?lat=...&lng=...&raio=...
 *
 * Retorna os pontos de ônibus próximos à localização informada.
 * raio em metros (padrão: 1000m).
 */
router.get('/proximos', autenticarUsuario, async (req, res) => {
  try {
    const { lat, lng, raio } = req.query;

    const latitudeUsuario = parseFloat(lat);
    const longitudeUsuario = parseFloat(lng);
    const raioMetros = raio ? parseFloat(raio) : 1000;

    if (
      Number.isNaN(latitudeUsuario) ||
      Number.isNaN(longitudeUsuario) ||
      Number.isNaN(raioMetros)
    ) {
      return res.status(400).json({
        error: 'Parâmetros lat, lng e raio devem ser números válidos.',
      });
    }

    const resultado = await pool.query(
      `SELECT id, name, latitude, longitude, description
       FROM stops`
    );

    const pontos = resultado.rows.map((ponto) => {
      const distancia = calcularDistanciaEmMetros(
        latitudeUsuario,
        longitudeUsuario,
        ponto.latitude,
        ponto.longitude
      );

      return {
        ...ponto,
        distancia_metros: Math.round(distancia),
      };
    });

    const pontosDentroDoRaio = pontos
      .filter((p) => p.distancia_metros <= raioMetros)
      .sort((a, b) => a.distancia_metros - b.distancia_metros);

    return res.json(pontosDentroDoRaio);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao buscar pontos de ônibus próximos.' });
  }
});

/**
 * GET /pontos/:id/horarios
 *
 * Retorna os horários de saída para um ponto específico.
 */
router.get('/:id/horarios', autenticarUsuario, async (req, res) => {
  try {
    const { id } = req.params; // id do ponto

    const resultado = await pool.query(
      `
      SELECT 
        o.id          AS onibus_id,
        o.nome        AS onibus_nome,
        o.codigo      AS onibus_codigo,
        t.departure_time AS horario
      FROM stop_times t
      JOIN onibus o ON o.id = t.onibus_id
      WHERE t.stop_id = $1
      ORDER BY o.codigo, t.departure_time
      `,
      [id]
    );

    // Se quiser, pode mandar "cru" e deixar o app agrupar por ônibus
    return res.json(resultado.rows);

    // Se mais pra frente você quiser já agrupar por ônibus aqui,
    // a gente pode transformar em:
    // [
    //   { onibus_id, onibus_nome, onibus_codigo, horarios: [...] },
    //   ...
    // ]
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Erro ao buscar horários do ponto informado.' });
  }
});

module.exports = router;
