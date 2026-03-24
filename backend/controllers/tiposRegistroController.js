const TipoRegistro = require('../models/TipoRegistro');

const tiposRegistroController = {
    getAll: async (req, res) => {
        try {
            const list = await TipoRegistro.find().sort({ nombre: 1 });
            res.json(list);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    create: async (req, res) => {
        try {
            const newT = new TipoRegistro(req.body);
            await newT.save();
            res.status(201).json(newT);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await TipoRegistro.findByIdAndUpdate(id, req.body, { new: true });
            res.json(updated);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await TipoRegistro.findByIdAndDelete(id);
            res.json({ message: 'Tipo de registro eliminado' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
};

module.exports = tiposRegistroController;
