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
    lema: {
        type: String,
        default: '¡Gracias por su preferencia!'
    },
    // Datos del Administrador para documentos
    adminNombre: {
        type: String,
        default: 'David Fernando Santa Ospina'
    },
    adminCelular: {
        type: String,
        default: '316 279 9224'
    },
    adminDocumento: {
        type: String,
        default: '12.345.678'
    },
    adminCorreo: {
        type: String,
        default: 'administracion@hotelbalconplaza.com'
    },
    firmaUrl: {
        type: String,
        default: null
    },
    logoUrl: {
        type: String,
        default: '/logo.jpg'
    },
    backgroundUrl: {
        type: String,
        default: '/hotel_noche.jpg'
    },
    checklistAuditoria: {
        type: [String],
        default: ['Baños', 'Paredes', 'Vidrios', 'Balcones', 'Camas', 'Pisos', 'Iluminación']
    },
    montoAlertaCaja: {
        type: Number,
        default: 0
    },
    toleranciaPrecio: {
        type: Number,
        default: 10 // 10% de tolerancia por defecto
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('HotelConfig', HotelConfigSchema);
