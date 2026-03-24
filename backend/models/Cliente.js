const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    documentoTipo: String,
    documentoNumero: { type: String, required: true, unique: true },
    email: String,
    telefono: String,
    direccion: String,
    ciudad: String,
    fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cliente', clienteSchema);
