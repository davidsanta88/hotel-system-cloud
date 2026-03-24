const mongoose = require('mongoose');

const gastoSchema = new mongoose.Schema({
    descripcion: { type: String, required: true },
    monto: { type: Number, required: true },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoriaGasto' },
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    periodo: String // Por ejemplo "2024-03"
});

module.exports = mongoose.model('Gasto', gastoSchema);
