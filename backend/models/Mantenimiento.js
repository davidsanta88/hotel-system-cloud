const mongoose = require('mongoose');

const mantenimientoSchema = new mongoose.Schema({
    habitacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Habitacion' },
    descripcion: { type: String, required: true },
    prioridad: { type: String, enum: ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'], default: 'MEDIA' },
    estado: { type: String, enum: ['PENDIENTE', 'EN_PROCESO', 'SOLUCIONADO'], default: 'PENDIENTE' },
    costo: { type: Number, default: 0 },
    usuarioReporta: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fechaReporte: { type: Date, default: Date.now },
    fechaSolucion: Date,
    solucionNotas: String
});

module.exports = mongoose.model('Mantenimiento', mantenimientoSchema);
