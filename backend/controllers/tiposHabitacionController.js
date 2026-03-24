const TipoHabitacion = require('../models/TipoHabitacion');

exports.getTipos = async (req, res) => {
    try {
        const tipos = await TipoHabitacion.find();
        res.json(tipos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTipo = async (req, res) => {
    try {
        const { nombre, descripcion, precioBase } = req.body;
        const newTipo = new TipoHabitacion({ nombre, descripcion, precioBase });
        await newTipo.save();
        res.status(201).json(newTipo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTipo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precioBase } = req.body;
        const updated = await TipoHabitacion.findByIdAndUpdate(id, { nombre, descripcion, precioBase }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTipo = async (req, res) => {
    try {
        const { id } = req.params;
        await TipoHabitacion.findByIdAndDelete(id);
        res.json({ message: 'Tipo eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
