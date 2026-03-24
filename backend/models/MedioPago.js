const mongoose = require('mongoose');

const medioPagoSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    activo: { type: Boolean, default: true }
});

module.exports = mongoose.model('MedioPago', medioPagoSchema);
