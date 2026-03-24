const Auditoria = require('../models/Auditoria');

const auditoriaController = {
    getLogs: async (req, res) => {
        try {
            const logs = await Auditoria.find().sort({ fecha: -1 }).limit(100);
            res.json(logs);
        } catch (err) {
            res.status(500).json({ error: 'Error al obtener auditoría' });
        }
    }
};

module.exports = auditoriaController;
