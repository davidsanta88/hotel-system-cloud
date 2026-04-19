const mongoose = require('mongoose');

const auditoriaLimpiezaSchema = new mongoose.Schema({
    tipo: { 
        type: String, 
        enum: ['HABITACION', 'GENERAL'], 
        required: true 
    },
    habitacion: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Habitacion',
        required: function() { return this.tipo === 'HABITACION'; }
    },
    areaGeneral: { 
        type: String,
        required: function() { return this.tipo === 'GENERAL'; }
    },
    fechaAuditoria: { 
        type: Date, 
        default: Date.now 
    },
    realizadoPor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario' 
    },
    items: [
        {
            nombre: { type: String, required: true },
            estado: { 
                type: String, 
                enum: ['CUMPLE', 'NO_CUMPLE', 'N/A'], 
                default: 'CUMPLE' 
            },
            observaciones: String
        }
    ],
    puntuacion: { 
        type: Number, 
        default: 0 
    },
    notasGenerales: String
}, { timestamps: true });

module.exports = mongoose.model('AuditoriaLimpieza', auditoriaLimpiezaSchema);
