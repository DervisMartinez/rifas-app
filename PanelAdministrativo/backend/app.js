const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const rifaRoutes = require('./routes/rifaRoutes');
const compradorRoutes = require('./routes/compradorRoutes');
const authRoutes = require('./routes/authRoutes');
const { generateTickets } = require('./controllers/compradorController');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
mongoose.connect('mongodb://localhost/rifas', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error de conexión a MongoDB', err));

// Rutas
app.use('/api/rifas', rifaRoutes);
app.use('/api/compradores', compradorRoutes);
app.use('/api/auth', authRoutes);

// Ruta para generar tickets
app.post('/api/rifas/:id/generar-tickets', generateTickets);

// Ruta principal del panel admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});