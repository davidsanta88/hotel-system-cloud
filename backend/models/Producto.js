const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    categoria: { type: String, default: 'bebidas' },
    precio: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    stockMinimo: { type: Number, default: 0 },
    descripcion: String,
    tipoInventario: { type: String, enum: ['venta', 'insumo'], default: 'venta' },
    imagenUrl: String,
    activo: { type: Boolean, default: true },
    usuarioCreacion: String,
    usuarioModificacion: String,
    fechaCreacion: { type: Date, default: Date.now },
    fechaModificacion: Date
});

module.exports = mongoose.model('Producto', productoSchema);
