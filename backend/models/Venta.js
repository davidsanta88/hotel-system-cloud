const mongoose = require('mongoose');

const detalleVentaSchema = new mongoose.Schema({
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    productoNombre: String,
    cantidad: Number,
    precioUnitario: Number,
    subtotal: Number
}, { _id: false });

const ventaSchema = new mongoose.Schema({
    empleado: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    registro: { type: mongoose.Schema.Types.ObjectId, ref: 'Registro' },
    items: [detalleVentaSchema],
    total: { type: Number, required: true },
    medioPago: String,
    fecha: { type: Date, default: Date.now },
    usuarioCreacion: String,
    usuarioModificacion: String
});

module.exports = mongoose.model('Venta', ventaSchema);
