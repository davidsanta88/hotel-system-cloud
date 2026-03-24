const EstadoHabitacion = require('../models/EstadoHabitacion');
const Habitacion = require('../models/Habitacion');

exports.getEstadosHabitacion = async (req, res) => {
    try {
        const estados = await EstadoHabitacion.find();
        res.json(estados);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createEstadoHabitacion = async (req, res) => {
    try {
        const { nombre, color, descripcion } = req.body;
        const newEstado = new EstadoHabitacion({ nombre, color, descripcion });
        await newEstado.save();
        res.status(201).json(newEstado);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.updateEstadoHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await EstadoHabitacion.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ message: 'Estado de habitación actualizado', estado: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteEstadoHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar si está en uso por alguna habitación
        const count = await Habitacion.countDocuments({ estado: id });
        if (count > 0) {
            return res.status(400).json({ message: 'No se puede eliminar el estado porque existen habitaciones asociadas a él.' });
        }
        await EstadoHabitacion.findByIdAndDelete(id);
        res.json({ message: 'Estado de habitación eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
