const Nota = require('../models/Nota');

exports.getNotas = async (req, res) => {
    try {
        const notas = await Nota.find({ usuario: req.userId }).sort({ fecha: -1 });
        res.json(notas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createNota = async (req, res) => {
    try {
        const newNota = new Nota({ ...req.body, usuario: req.userId });
        await newNota.save();
        res.status(201).json(newNota);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateNota = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Nota.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteNota = async (req, res) => {
    try {
        const { id } = req.params;
        await Nota.findByIdAndDelete(id);
        res.json({ message: 'Nota eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
