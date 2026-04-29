const Mesa = require('../models/Mesa');
const Comanda = require('../models/Comanda');
const Registro = require('../models/Registro');
const Producto = require('../models/Producto');
const moment = require('moment-timezone');

// Obtener todas las mesas
exports.getMesas = async (req, res) => {
    try {
        const mesas = await Mesa.find().sort({ numero: 1 });
        res.json(mesas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Crear mesas iniciales (Setup)
exports.seedMesas = async (req, res) => {
    try {
        const count = await Mesa.countDocuments();
        if (count > 0) return res.status(400).json({ message: 'Las mesas ya existen' });

        const mesasArr = [];
        for (let i = 1; i <= 20; i++) {
            mesasArr.push({
                numero: i,
                capacidad: i <= 5 ? 2 : (i <= 15 ? 4 : 8),
                ubicacion: i <= 10 ? 'Interior' : 'Terraza'
            });
        }
        await Mesa.insertMany(mesasArr);
        res.status(201).json({ message: 'Mesas creadas exitosamente' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Abrir una comanda en una mesa
exports.abrirComanda = async (req, res) => {
    try {
        const { mesaId, registroId, huespedNombre, meseroId } = req.body;

        const mesa = await Mesa.findById(mesaId);
        if (!mesa) return res.status(404).json({ message: 'Mesa no encontrada' });
        if (mesa.estado === 'Ocupada') return res.status(400).json({ message: 'La mesa ya está ocupada' });

        const newComanda = new Comanda({
            mesa: mesaId,
            mesaNumero: mesa.numero,
            registro: registroId || undefined,
            huespedNombre: huespedNombre || 'Particular',
            mesero: meseroId,
            estado: 'Abierta'
        });

        await newComanda.save();

        mesa.estado = 'Ocupada';
        mesa.comandaActiva = newComanda._id;
        await mesa.save();

        res.status(201).json(newComanda);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Agregar items a una comanda
exports.agregarItems = async (req, res) => {
    try {
        const { comandaId, items } = req.body;
        const comanda = await Comanda.findById(comandaId);
        if (!comanda) return res.status(404).json({ message: 'Comanda no encontrada' });
        if (comanda.estado !== 'Abierta') return res.status(400).json({ message: 'La comanda ya está cerrada' });

        // items: [{ productoId, nombre, cantidad, precio, notas }]
        const newItems = items.map(item => ({
            producto: item.productoId,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio,
            subtotal: item.cantidad * item.precio,
            notas: item.notas,
            estado: 'Pendiente'
        }));

        comanda.items.push(...newItems);
        comanda.total = comanda.items.reduce((acc, curr) => acc + curr.subtotal, 0);
        
        await comanda.save();
        res.json(comanda);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Obtener comanda activa por mesa
exports.getComandaActiva = async (req, res) => {
    try {
        const { mesaId } = req.params;
        const comanda = await Comanda.findOne({ mesa: mesaId, estado: 'Abierta' }).populate('items.producto');
        if (!comanda) return res.status(404).json({ message: 'No hay comanda activa para esta mesa' });
        res.json(comanda);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Cerrar comanda y procesar pago o cargo a habitación
exports.cerrarComanda = async (req, res) => {
    try {
        const { comandaId, metodoPago, cargoAHabitacion } = req.body;
        const comanda = await Comanda.findById(comandaId);
        if (!comanda) return res.status(404).json({ message: 'Comanda no encontrada' });

        if (cargoAHabitacion && comanda.registro) {
            // Lógica para agregar el total al registro del hotel
            const registro = await Registro.findById(comanda.registro);
            if (registro) {
                registro.total += comanda.total;
                // Opcional: Podríamos agregar una nota detallando el consumo de restaurante
                registro.observaciones = (registro.observaciones || '') + `\n[Consumo Restaurante Mesa ${comanda.mesaNumero}]: $${comanda.total}`;
                await registro.save();
            }
        }

        comanda.estado = cargoAHabitacion ? 'Cerrada' : 'Pagada';
        comanda.fechaCierre = Date.now();
        await comanda.save();

        // Liberar mesa
        await Mesa.findByIdAndUpdate(comanda.mesa, { 
            estado: 'Disponible', 
            comandaActiva: null 
        });

        res.json({ message: 'Comanda cerrada con éxito', comanda });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Obtener historial de comandas
exports.getHistorial = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        let query = { estado: { $in: ['Cerrada', 'Pagada'] } };
        
        if (inicio && fin) {
            query.fechaCierre = { 
                $gte: moment.tz(inicio, "America/Bogota").startOf('day').toDate(), 
                $lte: moment.tz(fin, "America/Bogota").endOf('day').toDate() 
            };
        }

        const historial = await Comanda.find(query)
            .populate('mesa')
            .populate('mesero', 'nombre')
            .sort({ fechaCierre: -1 });
        res.json(historial);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
