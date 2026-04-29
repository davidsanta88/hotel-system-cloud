const mongoose = require('mongoose');

const ProveedorSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    nit: {
        type: String,
        trim: true
    },
    telefono: {
        type: String,
        trim: true
    },
    celular: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    observacion: {
        type: String,
        trim: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Proveedor', ProveedorSchema);
