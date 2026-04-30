const mongoose = require('mongoose');

const DocumentoHotelSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['CEDULA', 'RUT', 'CAMARA_COMERCIO', 'RNT', 'OTRO'],
        default: 'OTRO'
    },
    url: {
        type: String,
        required: true
    },
    public_id: {
        type: String
    },
    resource_type: {
        type: String
    },
    version: {
        type: String
    },
    fechaSubida: {
        type: Date,
        default: Date.now
    },
    observacion: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('DocumentoHotel', DocumentoHotelSchema);
