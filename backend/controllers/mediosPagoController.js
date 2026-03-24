const MedioPago = require('../models/MedioPago');

exports.getMediosPago = async (req, res) => {
    try {
        const list = await MedioPago.find().sort({ nombre: 1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createMedioPago = async (req, res) => {
    try {
        const newM = new MedioPago(req.body);
        await newM.save();
        res.status(201).json(newM);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateMedioPago = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await MedioPago.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteMedioPago = async (req, res) => {
    try {
        const { id } = req.params;
        await MedioPago.findByIdAndDelete(id);
        res.json({ message: 'Medio de pago eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
