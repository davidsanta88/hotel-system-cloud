const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    descripcion: String,
    activo: { type: Boolean, default: true }
});

module.exports = mongoose.model('Categoria', categoriaSchema);
