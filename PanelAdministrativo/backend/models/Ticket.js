const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    compradorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comprador', 
        required: true 
    },
    rifaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Rifa', 
        required: true 
    },
    numero: { 
        type: Number, 
        required: true,
        unique: true
    },
    estado: { 
        type: String, 
        enum: ['pendiente', 'asignado', 'gastado', 'anulado'], 
        default: 'pendiente' 
    },
    fechaAsignacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);