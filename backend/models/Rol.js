const mongoose = require('mongoose');

const permisoSchema = new mongoose.Schema({
    p: { type: String, required: true }, // pantalla_codigo
    v: { type: Boolean, default: false }, // can_view
    e: { type: Boolean, default: false }, // can_edit
    d: { type: Boolean, default: false }  // can_delete
}, { _id: false });

const rolSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    descripcion: String,
    permisos: [permisoSchema]
});

module.exports = mongoose.model('Rol', rolSchema);
