const mongoose = require('mongoose');

const checkinDigitalSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    documento: String,
    celular: String,
    correo: String,
    procedencia: String,
    fechaLlegada: { type: Date, default: Date.now },
    habitacionNumero: String,
    estado: { type: String, enum: ['PENDIENTE', 'PROCESADO', 'CANCELADO'], default: 'PENDIENTE' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CheckinDigital', checkinDigitalSchema);
