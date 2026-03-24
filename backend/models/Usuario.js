const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { type: mongoose.Schema.Types.ObjectId, ref: 'Rol' },
    activo: { type: Boolean, default: true },
    fechaCreacion: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Usuario', usuarioSchema);
