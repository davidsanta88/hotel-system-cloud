const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    tipo_documento: String,
    documento: { type: String, required: true, unique: true },
    email: String,
    telefono: String,
    direccion: String,
    municipio_origen_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Municipio' },
    fechaCreacion: { type: Date, default: Date.now },
    usuarioCreacion: String,
    usuarioModificacion: String,
    fechaModificacion: Date
});

module.exports = mongoose.model('Cliente', clienteSchema);
