const mongoose = require('mongoose');

const movimientoInventarioSchema = new mongoose.Schema({
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    tipo: { type: String, enum: ['entrada', 'salida'], required: true },
    cantidad: { type: Number, required: true },
    motivo: String,
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MovimientoInventario', movimientoInventarioSchema);
