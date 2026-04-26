const Nota = require('../models/Nota');

exports.getAll = async (req, res) => {
    try {
        // Buscar notas enviadas POR el usuario O dirigidas AL usuario (o a todos)
        const query = {
            $or: [
                { usuario: req.userId },
                { usuariosDestino: req.userId },
                { usuariosDestino: { $size: 0 } }
            ]
        };

        const list = await Nota.find(query)
            .populate('usuario', 'nombre')
            .populate('usuariosDestino', 'nombre')
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
                usuarios_destino: doc.usuariosDestino?.map(u => ({ id: u._id, nombre: u.nombre })) || [],
                leida: doc.leidasPor?.some(uid => uid.toString() === req.userId) || false,
                leidas_por: doc.leidasPor || []
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
            usuariosDestino: req.body.usuarios_destino_ids || (req.body.usuario_destino_id ? [req.body.usuario_destino_id] : []),
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
        if (update.usuarios_destino_ids) update.usuariosDestino = update.usuarios_destino_ids;

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
            $and: [
                {
                    $or: [
                        { usuariosDestino: req.userId }, 
                        { usuariosDestino: { $size: 0 } }, // For everyone
                        { usuariosDestino: null }
                    ]
                },
                { leidasPor: { $ne: req.userId } } // Not read by this user
            ]
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
                leida: false
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
        await Nota.findByIdAndUpdate(id, { 
            $addToSet: { leidasPor: req.userId } 
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
