const Proveedor = require('../models/Proveedor');

exports.getProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.find().sort({ nombre: 1 });
        res.json(proveedores);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener proveedores', error: error.message });
    }
};

exports.getProveedorById = async (req, res) => {
    try {
        const proveedor = await Proveedor.findById(req.params.id);
        if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.json(proveedor);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el proveedor', error: error.message });
    }
};

exports.createProveedor = async (req, res) => {
    try {
        const nuevoProveedor = new Proveedor(req.body);
        await nuevoProveedor.save();
        res.status(201).json(nuevoProveedor);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el proveedor', error: error.message });
    }
};

exports.updateProveedor = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.json(proveedor);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el proveedor', error: error.message });
    }
};

exports.deleteProveedor = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByIdAndDelete(req.params.id);
        if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.json({ message: 'Proveedor eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el proveedor', error: error.message });
    }
};
