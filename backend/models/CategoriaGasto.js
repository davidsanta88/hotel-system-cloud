const mongoose = require('mongoose');

const categoriaGastoSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    descripcion: String
});

module.exports = mongoose.model('CategoriaGasto', categoriaGastoSchema);
