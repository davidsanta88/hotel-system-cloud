const CheckinDigital = require('../models/CheckinDigital');

const checkinController = {
    createPublicCheckin: async (req, res) => {
        try {
            const newC = new CheckinDigital(req.body);
            await newC.save();
            res.status(201).json({ message: 'Bienvenido al hotel. Registro enviado.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getPendingCheckins: async (req, res) => {
        try {
            const list = await CheckinDigital.find({ estado: 'PENDIENTE' }).sort({ createdAt: -1 });
            res.json(list);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    updateCheckinStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await CheckinDigital.findByIdAndUpdate(id, { estado: req.body.estado }, { new: true });
            res.json(updated);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = checkinController;
