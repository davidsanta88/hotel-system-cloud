const mongoose = require('mongoose');

const estadoHabitacionSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    color: String,
    descripcion: String
});

module.exports = mongoose.model('EstadoHabitacion', estadoHabitacionSchema);
