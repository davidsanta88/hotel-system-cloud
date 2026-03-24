const mongoose = require('mongoose');

const tipoRegistroSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    descripcion: String,
    visualizar: { type: Boolean, default: true }
});

module.exports = mongoose.model('TipoRegistro', tipoRegistroSchema);
