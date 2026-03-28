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
        notas: String,
        usuario_nombre: String,
        fecha: { type: Date, default: Date.now }
    }],
    huespedes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' }],
    vendedores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
    observaciones: String,
    notasSalida: String,
    usuarioCreacion: String,
    fechaCreacion: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Registro', registroSchema);
