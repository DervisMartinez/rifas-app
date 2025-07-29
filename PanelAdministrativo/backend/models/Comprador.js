const mongoose = require('mongoose');

const CompradorSchema = new mongoose.Schema({
    rifaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rifa', required: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    cedula: { type: String, required: true },
    telefono: { type: String, required: true },
    email: { type: String, required: true },
    metodoPago: { type: String, required: true },
    comprobante: { type: String, required: true },
    aprobado: { type: Boolean, default: false },
    ticket: { type: Number },
    fechaCompra: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comprador', CompradorSchema);