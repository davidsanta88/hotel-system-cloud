const CheckinDigital = require('../models/CheckinDigital');
const Cliente = require('../models/Cliente');

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
            // Retornar los últimos 10 independientemente del estado (Historial)
            const list = await CheckinDigital.find().sort({ createdAt: -1 }).limit(10);
            res.json(list);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    deleteCheckin: async (req, res) => {
        try {
            const { id } = req.params;
            await CheckinDigital.findByIdAndDelete(id);
            res.json({ message: 'Registro eliminado correctamente' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    updateCheckinStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            
            // 1. Actualizar el estado del registro digital
            const updated = await CheckinDigital.findByIdAndUpdate(id, { estado }, { new: true });

            // 2. Si se procesa, migrar datos a Clientes
            if (estado === 'PROCESADO') {
                await Cliente.findOneAndUpdate(
                    { documento: updated.documento },
                    { 
                        nombre: updated.nombre,
                        telefono: updated.celular,
                        documento: updated.documento
                    },
                    { upsert: true, new: true }
                );
            }

            res.json(updated);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = checkinController;
