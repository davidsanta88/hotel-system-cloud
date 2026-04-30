const mongoose = require('mongoose');

const AliadoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['RESTAURANTE', 'CAFE_BAR', 'AGENCIA_TURISMO', 'CAJA_COMPENSACION', 'TRANSPORTE', 'OTRO'],
        default: 'OTRO'
    },
    descripcion: {
        type: String,
        trim: true
    },
    logoUrl: {
        type: String
    },
    public_id: {
        type: String
    },
    sitioWeb: {
        type: String,
        trim: true
    },
    telefono: {
        type: String,
        trim: true
    },
    ubicacion: {
        type: String,
        trim: true
    },
    orden: {
        type: Number,
        default: 0
    },
    activo: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Aliado', AliadoSchema);
