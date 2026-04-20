const mongoose = require('mongoose');

const CotizacionSchema = new mongoose.Schema({
    numeroCotizacion: {
        type: String,
        required: true,
        unique: true
    },
    cliente: {
        type: String,
        required: true
    },
    correo: {
        type: String,
        default: ''
    },
    telefono: {
        type: String,
        default: ''
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    numeroPersonal: {
        type: Number,
        required: true,
        default: 1
    },
    valorPersonalNormal: {
        type: Number,
        required: true,
        default: 0
    },
    valorDescuento: {
        type: Number,
        default: 0
    },
    detalles: {
        type: String,
        default: ''
    },
    subtotal: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'Enviada', 'Aceptada', 'Rechazada'],
        default: 'Pendiente'
    },
    hotelSnapshot: {
        nombre: String,
        nit: String,
        direccion: String,
        telefono: String,
        correo: String,
        lema: String,
        datosBancarios: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Cotizacion', CotizacionSchema);
