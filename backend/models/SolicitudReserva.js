const mongoose = require('mongoose');

const solicitudReservaSchema = new mongoose.Schema({
    nombre: String,
    celular: { type: String, required: true },
    correo: String,
    numHuespedes: { type: Number, default: 1 },
    fechaLlegada: Date,
    notas: String,
    estado: { type: String, enum: ['pendiente', 'contactado', 'convertida', 'cancelada'], default: 'pendiente' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SolicitudReserva', solicitudReservaSchema);
