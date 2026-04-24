const Cliente = require('../models/Cliente');
const Habitacion = require('../models/Habitacion');
const Reserva = require('../models/Reserva');
const Registro = require('../models/Registro');

exports.globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json({ results: [] });

        const searchRegex = new RegExp(q, 'i');

        // 1. Search Clients
        const clientes = await Cliente.find({
            $or: [
                { nombre: searchRegex },
                { documento: searchRegex },
                { telefono: searchRegex }
            ]
        }).limit(5).lean();

        // 2. Search Rooms
        const habitaciones = await Habitacion.find({
            numero: searchRegex
        }).populate('estado', 'nombre').limit(5).lean();

        // 3. Search Active Registrations
        const registros = await Registro.find({
            $or: [
                { nombre_cliente: searchRegex },
                { documento_cliente: searchRegex },
                { numero_habitacion: searchRegex }
            ],
            estado: 'Activo'
        }).limit(5).lean();

        // Format results
        const results = [
            ...clientes.map(c => ({ id: c._id, type: 'cliente', title: c.nombre, subtitle: `Doc: ${c.documento}`, link: `/clientes` })),
            ...habitaciones.map(h => ({ id: h._id, type: 'habitacion', title: `Habitación ${h.numero}`, subtitle: `Estado: ${h.estado?.nombre || 'N/A'}`, link: `/mapa-habitaciones` })),
            ...registros.map(r => ({ id: r._id, type: 'registro', title: `Check-in: ${r.nombre_cliente}`, subtitle: `Hab: ${r.numero_habitacion}`, link: `/mapa-habitaciones` }))
        ];

        res.json(results);
    } catch (error) {
        console.error('Error in global search:', error);
        res.status(500).json({ message: 'Error en la búsqueda global' });
    }
};
