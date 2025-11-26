const jwt = require('jsonwebtoken');

function autenticarUsuario(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não informado.' });
  }

  const [, token] = authHeader.split(' '); // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');

    req.usuarioId = decoded.sub;
    req.usuarioRole = decoded.role;

    return next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

module.exports = { autenticarUsuario };
