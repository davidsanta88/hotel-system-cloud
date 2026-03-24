const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema({
    usuario: String,
    accion: String,
    tabla: String,
    registroId: String,
    detalles: mongoose.Schema.Types.Mixed,
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Auditoria', auditoriaSchema);
