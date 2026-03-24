const mongoose = require('mongoose');

const tipoHabitacionSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    descripcion: String,
    precioBase: Number
});

module.exports = mongoose.model('TipoHabitacion', tipoHabitacionSchema);
