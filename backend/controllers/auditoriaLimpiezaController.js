const AuditoriaLimpieza = require('../models/AuditoriaLimpieza');

const auditoriaLimpiezaController = {
    getAuditorias: async (req, res) => {
        try {
            const list = await AuditoriaLimpieza.find()
                .populate('habitacion')
                .populate('realizadoPor', 'nombre')
                .sort({ fechaAuditoria: -1 });

            const mapped = list.map(a => {
                const doc = a.toObject();
                return {
                    id: doc._id,
                    tipo: doc.tipo,
                    habitacion_id: doc.habitacion?._id,
                    habitacion_numero: doc.habitacion?.numero,
                    area_general: doc.areaGeneral,
                    fecha_auditoria: doc.fechaAuditoria,
                    realizado_por_id: doc.realizadoPor?._id,
                    realizado_por_nombre: doc.realizadoPor?.nombre || 'N/A',
                    items: doc.items,
                    puntuacion: doc.puntuacion,
                    notas_generales: doc.notasGenerales
                };
            });

            res.json(mapped);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    createAuditoria: async (req, res) => {
        try {
            const { 
                tipo, 
                habitacion_id, 
                area_general, 
                items, 
                puntuacion, 
                notas_generales 
            } = req.body;

            const data = {
                tipo,
                habitacion: habitacion_id,
                areaGeneral: area_general,
                items,
                puntuacion,
                notasGenerales: notas_generales,
                realizadoPor: req.userId // Del middleware de auth
            };

            const newA = new AuditoriaLimpieza(data);
            await newA.save();
            res.status(201).json(newA);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    deleteAuditoria: async (req, res) => {
        try {
            const { id } = req.params;
            await AuditoriaLimpieza.findByIdAndDelete(id);
            res.json({ message: 'Auditoría eliminada' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = auditoriaLimpiezaController;
