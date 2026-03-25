const mongoose = require('mongoose');

const habitacionSchema = new mongoose.Schema({
    numero: { type: Number, required: true, unique: true },
    tipo: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoHabitacion' },
    estado: { type: mongoose.Schema.Types.ObjectId, ref: 'EstadoHabitacion' },
    descripcion: String,
    precio_1: Number,
    precio_2: Number,
    precio_3: Number,
    precio_4: Number,
    precio_5: Number,
    precio_6: Number,
    fotos: [String],
    estadoLimpieza: { type: String, default: 'Limpia' },
    comentarioLimpieza: String,
    usuarioCreacion: String,
    fechaCreacion: { type: Date, default: Date.now },
    fechaModificacion: Date
});

module.exports = mongoose.model('Habitacion', habitacionSchema);
