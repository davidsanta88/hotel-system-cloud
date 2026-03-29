const mongoose = require('mongoose');

const HotelConfigSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        default: 'HOTEL BALCÓN PLAZA'
    },
    nit: {
        type: String,
        required: true,
        default: '900.000.000-1'
    },
    direccion: {
        type: String,
        required: true,
        default: 'Calle Real # 12-34, Santa Fe de Antioquia'
    },
    telefono: {
        type: String,
        required: true,
        default: '(604) 000-0000'
    },
    correo: {
        type: String,
        required: true,
        default: 'reservas@hotelbalconplaza.com'
    },
    sitioWeb: {
        type: String,
        default: 'www.hotelbalconplaza.com'
    },
    politica: {
        type: String,
        required: true,
        default: 'Este documento es un comprobante informativo. Los consumos adicionales se cobrarán al check-out.'
    },
    datosBancarios: {
        type: String,
        default: 'Banco: XXXXXX | Cuenta: Ahorros # XXXXXXXXX | Nequi: XXXXXXXXXX'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('HotelConfig', HotelConfigSchema);
