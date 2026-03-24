const Mantenimiento = require('../models/Mantenimiento');

const mantenimientoController = {
    getMantenimientos: async (req, res) => {
        try {
            const list = await Mantenimiento.find().populate('habitacion').populate('usuarioReporta').sort({ fechaReporte: -1 });
            res.json(list);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    createMantenimiento: async (req, res) => {
        try {
            const newM = new Mantenimiento({ ...req.body, usuarioReporta: req.userId });
            await newM.save();
            res.status(201).json(newM);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    updateMantenimiento: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await Mantenimiento.findByIdAndUpdate(id, req.body, { new: true });
            res.json(updated);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    deleteMantenimiento: async (req, res) => {
        try {
            const { id } = req.params;
            await Mantenimiento.findByIdAndDelete(id);
            res.json({ message: 'Mantenimiento eliminado' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = mantenimientoController;
