const Mantenimiento = require('../models/Mantenimiento');

const mantenimientoController = {
    getMantenimientos: async (req, res) => {
        try {
            const list = await Mantenimiento.find()
                .populate('habitacion')
                .populate('usuarioReporta')
                .sort({ fechaReporte: -1 });

            // Mapeo para el frontend (Snake_case y compatibilidad)
            const mapped = list.map(m => {
                const doc = m.toObject();
                return {
                    id: doc._id,
                    habitacion_id: doc.habitacion?._id || '',
                    habitacion_numero: doc.habitacion?.numero || 'N/A',
                    descripcion: doc.descripcion,
                    prioridad: doc.prioridad,
                    estado: doc.estado === 'EN_PROCESO' ? 'EN PROCESO' : doc.estado, // Compatibilidad con espacio
                    costo: doc.costo || 0,
                    usuario_reporta: doc.usuarioReporta?._id || '',
                    usuario_nombre: doc.usuarioReporta?.nombre || 'Sistema',
                    fecha_reporte: doc.fechaReporte,
                    fecha_solucion: doc.fechaSolucion,
                    solucion_notas: doc.solucionNotas
                };
            });

            res.json(mapped);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    createMantenimiento: async (req, res) => {
        try {
            // Soporte para snake_case del frontend
            const data = {
                habitacion: req.body.habitacion_id || req.body.habitacion,
                descripcion: req.body.descripcion,
                prioridad: req.body.prioridad || 'MEDIA',
                estado: req.body.estado === 'EN PROCESO' ? 'EN_PROCESO' : (req.body.estado || 'PENDIENTE'),
                usuarioReporta: req.userId
            };

            const newM = new Mantenimiento(data);
            await newM.save();
            res.status(201).json(newM);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    updateMantenimiento: async (req, res) => {
        try {
            const { id } = req.params;
            const update = { ...req.body };
            
            // Aliasing para campos entrantes
            if (update.solucion_notas) update.solucionNotas = update.solucion_notas;
            if (update.fecha_solucion) update.fechaSolucion = update.fecha_solucion;
            if (update.estado === 'EN PROCESO') update.estado = 'EN_PROCESO';

            const updated = await Mantenimiento.findByIdAndUpdate(id, update, { new: true });
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
