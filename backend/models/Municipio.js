const mongoose = require('mongoose');

const municipioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    departamento: String
});

module.exports = mongoose.model('Municipio', municipioSchema);
