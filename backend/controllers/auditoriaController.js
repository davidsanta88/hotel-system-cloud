const Auditoria = require('../models/Auditoria');

const auditoriaController = {
    getLogs: async (req, res) => {
        try {
            const logs = await Auditoria.find().sort({ fecha: -1 }).limit(100);
            
            // Map to frontend schema
            const mapped = logs.map(l => ({
                id: l._id,
                usuario_nombre: l.usuario,
                accion: l.accion,
                modulo: l.tabla,
                ip_address: l.ip_address || '0.0.0.0',
                created_at: l.fecha,
                detalle: JSON.stringify(l.detalles || {})
            }));
            
            res.json(mapped);
        } catch (err) {
            res.status(500).json({ error: 'Error al obtener auditoría' });
        }
    }
};

module.exports = auditoriaController;
