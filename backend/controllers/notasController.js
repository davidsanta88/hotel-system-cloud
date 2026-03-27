const Nota = require('../models/Nota');

exports.getAll = async (req, res) => {
    try {
        // Buscar notas enviadas POR el usuario O dirigidas AL usuario (o a todos)
        const query = {
            $or: [
                { usuario: req.userId },
                { usuarioDestino: req.userId },
                { usuarioDestino: null }
            ]
        };

        const list = await Nota.find(query)
            .populate('usuario', 'nombre')
            .populate('usuarioDestino', 'nombre')
            .sort({ fechaAlerta: -1, fecha: -1 });

        // Mapeo para el frontend (Snake_case)
        const mapped = list.map(n => {
            const doc = n.toObject();
            return {
                id: doc._id,
                titulo: doc.titulo,
                descripcion: doc.descripcion || doc.contenido || '',
                prioridad: doc.prioridad || 'Normal',
                fecha_alerta: doc.fechaAlerta || doc.fecha,
                usuario_creacion_id: doc.usuario?._id || '',
                usuario_creacion_nombre: doc.usuario?.nombre || 'Personal',
                usuario_destino_id: doc.usuarioDestino?._id || null,
                usuario_destino_nombre: doc.usuarioDestino?.nombre || 'Todos',
                leida: doc.leida || false
            };
        });

        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = {
            titulo: req.body.titulo,
            descripcion: req.body.descripcion,
            prioridad: req.body.prioridad || 'Normal',
            fechaAlerta: req.body.fecha_alerta || new Date(),
            usuarioDestino: req.body.usuario_destino_id || null,
            usuario: req.userId
        };

        const newNota = new Nota(data);
        await newNota.save();
        res.status(201).json(newNota);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const update = { ...req.body };
        
        // Aliasing
        if (update.fecha_alerta) update.fechaAlerta = update.fecha_alerta;
        if (update.usuario_destino_id) update.usuarioDestino = update.usuario_destino_id;

        const updated = await Nota.findByIdAndUpdate(id, update, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await Nota.findByIdAndDelete(id);
        res.json({ message: 'Nota eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.getMyAlerts = async (req, res) => {
    try {
        const query = {
            $or: [
                { usuarioDestino: req.userId },
                { usuarioDestino: null }
            ],
            leida: { $ne: true }
        };

        const list = await Nota.find(query)
            .populate('usuario', 'nombre')
            .sort({ fechaAlerta: -1, fecha: -1 });

        const mapped = list.map(n => {
            const doc = n.toObject();
            return {
                id: doc._id,
                titulo: doc.titulo,
                descripcion: doc.descripcion || doc.contenido || '',
                prioridad: doc.prioridad || 'Normal',
                fecha_alerta: doc.fechaAlerta || doc.fecha,
                usuario_creacion_nombre: doc.usuario?.nombre || 'Personal',
                leida: doc.leida || false
            };
        });

        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Nota.findByIdAndUpdate(id, { leida: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
