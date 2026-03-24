const mongoose = require('mongoose');

const notaSchema = new mongoose.Schema({
    titulo: String,
    contenido: String,
    color: String,
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Nota', notaSchema);
