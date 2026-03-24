const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
    habitacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Habitacion' },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    fechaInicio: Date,
    fechaFin: Date,
    estado: { type: String, enum: ['pendiente', 'confirmada', 'cancelada'], default: 'pendiente' },
    abono: { type: Number, default: 0 },
    abonos: [{
        monto: Number,
        medio_pago: String,
        notas: String,
        usuario_nombre: String,
        fecha: { type: Date, default: Date.now }
    }],
    observaciones: String,
    usuarioCreacion: String,
    fechaCreacion: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Reserva', reservaSchema);
