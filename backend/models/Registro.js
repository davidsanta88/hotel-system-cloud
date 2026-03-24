const mongoose = require('mongoose');

const registroSchema = new mongoose.Schema({
    habitacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Habitacion', required: true },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    fechaEntrada: { type: Date, required: true },
    fechaSalida: Date,
    estado: { type: String, enum: ['activo', 'finalizado', 'cancelado'], default: 'activo' },
    total: Number,
    pagos: [{
        monto: Number,
        medio: String,
        fecha: { type: Date, default: Date.now }
    }],
    observaciones: String,
    usuarioCreacion: String,
    fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Registro', registroSchema);
