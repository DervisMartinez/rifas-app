const mongoose = require('mongoose');

const RifaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    imagen: { type: String, required: true },
    precioDolar: { type: Number, required: true },
    precioBolivar: { type: Number, required: true },
    minBoletos: { type: Number, default: 1 },
    maxBoletos: { type: Number, default: 10 },
    totalBoletos: { type: Number, required: true },
    boletosVendidos: [{ type: Number }],
    estado: { type: String, enum: ['activa', 'finalizada'], default: 'activa' },
    fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rifa', RifaSchema);