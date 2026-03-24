const Reserva = require('../models/Reserva');

exports.getReservas = async (req, res) => {
    try {
        const reservas = await Reserva.find().populate('habitacion').populate('cliente').sort({ fechaInicio: 1 });
        res.json(reservas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllReservas = exports.getReservas; // Alias for routes compatibility

exports.createReserva = async (req, res) => {
    try {
        const newReserva = new Reserva({ ...req.body, usuarioCreacion: req.userName });
        await newReserva.save();
        res.status(201).json(newReserva);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Reserva.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateReservaStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const updated = await Reserva.findByIdAndUpdate(id, { estado }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteReserva = async (req, res) => {
    try {
        const { id } = req.params;
        await Reserva.findByIdAndDelete(id);
        res.json({ message: 'Reserva eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
