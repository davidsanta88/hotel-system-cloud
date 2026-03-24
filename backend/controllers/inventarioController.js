const MovimientoInventario = require('../models/MovimientoInventario');
const Producto = require('../models/Producto');

exports.getMovimientos = async (req, res) => {
    try {
        const movimientos = await MovimientoInventario.find().populate('producto').populate('usuario').sort({ fecha: -1 });
        res.json(movimientos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createMovimiento = async (req, res) => {
    try {
        const { producto_id, tipo, cantidad, motivo } = req.body;
        const newMov = new MovimientoInventario({
            producto: producto_id,
            tipo,
            cantidad,
            motivo,
            usuario: req.userId
        });
        await newMov.save();
        
        const change = tipo === 'entrada' ? cantidad : -cantidad;
        await Producto.findByIdAndUpdate(producto_id, { $inc: { stock: change } });
        
        res.status(201).json(newMov);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStockAlerts = async (req, res) => {
    try {
        const alerts = await Producto.find({ $expr: { $lte: ["$stock", "$stockMinimo"] } });
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
