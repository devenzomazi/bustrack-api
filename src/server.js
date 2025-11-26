require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const pontosRoutes = require('./routes/pontos.routes');
const pontosFavoritosRoutes = require('./routes/pontosFavoritos.routes');
const onibusFavoritosRoutes = require('./routes/onibusFavoritos.routes');
const lembretesRoutes = require('./routes/lembretes.routes');
const onibusRoutes = require('./routes/onibus.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'BusTrack API ok 🚍' });
});

// rotas de autenticação
app.use('/auth', authRoutes);

// rotas de pontos de ônibus
app.use('/pontos', pontosRoutes);

// rotas de pontos favoritos
app.use('/pontos-favoritos', pontosFavoritosRoutes);

// rotas de ônibus favoritos
app.use('/onibus-favoritos', onibusFavoritosRoutes);

// rotas de lembretes
app.use('/lembretes', lembretesRoutes);

// rotas de ônibus
app.use('/onibus', onibusRoutes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server on port ${PORT}`);
});