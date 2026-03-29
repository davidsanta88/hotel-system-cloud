const mongoose = require('mongoose');

const gastoSchema = new mongoose.Schema({
    descripcion: { type: String, required: true },
    monto: { type: Number, required: true },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoriaGasto' },
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    medioPago: String, // Nequi, Transferencia Bancolombia, Efectivo
    observaciones: String,
    periodo: String, // Por ejemplo "2024-03"
    comprobante_url: String
});

module.exports = mongoose.model('Gasto', gastoSchema);
