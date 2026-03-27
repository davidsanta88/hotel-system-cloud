const Registro = require('../models/Registro');
const Habitacion = require('../models/Habitacion');
const Cliente = require('../models/Cliente');

exports.getRegistros = async (req, res) => {
    try {
        const registros = await Registro.find()
            .populate('habitacion', 'numero')
            .populate('cliente', 'nombre documento')
            .sort({ fechaCreacion: -1 });
        
        // Mapeo para compatibilidad total con el frontend
        const mapped = registros.map(r => {
            const raw = r.toObject ? r.toObject() : r;
            return {
                ...raw,
                id: raw._id,
                fecha_ingreso: raw.fecha_ingreso || raw.fechaEntrada || raw.fechaCreacion,
                fecha_salida: raw.fecha_salida || raw.fechaSalida || raw.fechaEntrada || raw.fechaCreacion,
                nombre_cliente: raw.nombre_cliente || (raw.cliente ? raw.cliente.nombre : 'Sín Nombre'),
                documento_cliente: raw.documento_cliente || (raw.cliente ? raw.cliente.documento : '-'),
                numero_habitacion: raw.numero_habitacion || (raw.habitacion ? raw.habitacion.numero : '?'),
                tipo_registro_nombre: raw.tipo_registro_nombre || 'Formal'
            };
        });
        
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getActiveRegistros = async (req, res) => {
    try {
        const registros = await Registro.find({ estado: 'activo' })
            .populate('habitacion', 'numero')
            .populate('cliente', 'nombre documento')
            .sort({ fechaCreacion: -1 });
            
        const mapped = registros.map(r => {
            const raw = r.toObject ? r.toObject() : r;
            return {
                ...raw,
                id: raw._id,
                fecha_ingreso: raw.fecha_ingreso || raw.fechaEntrada || raw.fechaCreacion,
                fecha_salida: raw.fecha_salida || raw.fechaSalida || raw.fechaEntrada || raw.fechaCreacion,
                nombre_cliente: raw.nombre_cliente || (raw.cliente ? raw.cliente.nombre : 'Sín Nombre'),
                documento_cliente: raw.documento_cliente || (raw.cliente ? raw.cliente.documento : '-'),
                numero_habitacion: raw.numero_habitacion || (raw.habitacion ? raw.habitacion.numero : '?')
            };
        });
        
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRegistroById = async (req, res) => {
    try {
        const { id } = req.params;
        const registro = await Registro.findById(id)
            .populate('habitacion')
            .populate('cliente')
            .populate('huespedes');
        
        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });
        
        const raw = registro.toObject();
        const mapped = {
            ...raw,
            id: raw._id,
            fecha_ingreso: raw.fecha_ingreso || raw.fechaEntrada || raw.fechaCreacion,
            fecha_salida: raw.fecha_salida || raw.fechaSalida || raw.fechaEntrada || raw.fechaCreacion,
            nombre_cliente: raw.nombre_cliente || (raw.cliente ? raw.cliente.nombre : 'Sín Nombre'),
            numero_habitacion: raw.numero_habitacion || (raw.habitacion ? raw.habitacion.numero : '?'),
            notas: raw.notas || raw.observaciones || ''
        };
        
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createRegistro = async (req, res) => {
    try {
        const { habitacion_id, fecha_ingreso, fecha_salida, huespedes, total, observaciones, notas, medio_pago_id, valor_cobrado, tipo_registro_id } = req.body;

        if (!huespedes || huespedes.length === 0) {
            return res.status(400).json({ message: 'Se requiere al menos un huésped' });
        }

        const huesped_ids = [];
        for (const h of huespedes) {
            // Handle if h is already an ID (string) or an object with an ID
            const guestId = (typeof h === 'string') ? h : (h.id || h._id);
            
            if (guestId) {
                huesped_ids.push(guestId);
            } else if (typeof h === 'object' && h.documento) {
                // ...existing logic for new client creation...
                let existingCliente = await Cliente.findOne({ documento: h.documento });

                if (existingCliente) {
                    huesped_ids.push(existingCliente._id);
                } else {
                    const newCliente = new Cliente({
                        nombre: h.nombre,
                        documento: h.documento,
                        tipo_documento: h.tipo_documento || 'CC',
                        telefono: h.telefono,
                        email: h.email,
                        municipio_origen_id: h.municipio_origen_id || null,
                        usuarioCreacion: req.userName,
                        fechaCreacion: Date.now()
                    });
                    await newCliente.save();
                    huesped_ids.push(newCliente._id);
                }
            }
        }

        const titular_id = huesped_ids[0];

        const newReg = new Registro({
            habitacion: habitacion_id,
            cliente: titular_id,
            huespedes: huesped_ids,
            fechaEntrada: fecha_ingreso,
            fechaSalida: fecha_salida,
            total: valor_cobrado !== undefined ? valor_cobrado : total, // Map valor_cobrado if available from the frontend
            observaciones: notas || observaciones, // frontend uses 'notas'
            usuarioCreacion: req.userName,
            fechaCreacion: Date.now(),
            estado: 'activo' // Make sure it's created as activo by default initially if checking in. Wait, frontend uses "estado" mostly in put, but let's keep model default. 
        });

        // Add initial payment if medio_pago is provided
        if (medio_pago_id) {
            newReg.pagos = [{
                monto: parseFloat(valor_cobrado || total || 0),
                medio: 'DefinirPorMedio', // Need medio name?
                fecha: Date.now()
            }];
        }

        await newReg.save();
        
        // 2. Marcar habitación como ocupada (USANDO ObjectId)
        const EstadoHabitacion = require('../models/EstadoHabitacion');
        const estadoOcupada = await EstadoHabitacion.findOne({ nombre: /ocupada/i });
        if (estadoOcupada) {
            await Habitacion.findByIdAndUpdate(habitacion_id, { 
                estado: estadoOcupada._id,
                estadoLimpieza: 'En Uso'
            });
        }

        res.status(201).json({ message: 'Registro creado con éxito', registro: newReg });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.checkout = async (req, res) => {
    try {
        const { id } = req.params;
        const registro = await Registro.findById(id);
        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });

        // 1. Finalizar registro
        registro.estado = 'finalizado';
        registro.fechaSalida = Date.now();
        await registro.save();

        // 2. Liberar habitación (Marcar como disponible pero SUCIA)
        const EstadoHabitacion = require('../models/EstadoHabitacion');
        const estadoDisponible = await EstadoHabitacion.findOne({ nombre: /disponible/i });
        
        await Habitacion.findByIdAndUpdate(registro.habitacion, { 
            estado: estadoDisponible ? estadoDisponible._id : undefined,
            estadoLimpieza: 'Sucia'
        });

        res.json({ message: 'Check-out realizado con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.anular = async (req, res) => {
    try {
        const { id } = req.params;
        const registro = await Registro.findById(id);
        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });

        // 1. Anular registro
        registro.estado = 'cancelado';
        await registro.save();

        // 2. Liberar habitación (Volver a disponible y LIMPIA si fue error)
        const EstadoHabitacion = require('../models/EstadoHabitacion');
        const estadoDisponible = await EstadoHabitacion.findOne({ nombre: /disponible/i });
        
        await Habitacion.findByIdAndUpdate(registro.habitacion, { 
            estado: estadoDisponible ? estadoDisponible._id : undefined,
            estadoLimpieza: 'Limpia'
        });

        res.json({ message: 'Registro anulado con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateRegistro = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Registro.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ message: 'Registro actualizado', registro: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteRegistro = async (req, res) => {
    try {
        const { id } = req.params;
        const registro = await Registro.findById(id);
        
        if (!registro) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        // Si el registro estaba activo, liberar la habitación
        if (registro.estado === 'activo') {
            const EstadoHabitacion = require('../models/EstadoHabitacion');
            const estadoDisponible = await EstadoHabitacion.findOne({ nombre: /disponible/i });
            
            await Habitacion.findByIdAndUpdate(registro.habitacion, { 
                estado: estadoDisponible ? estadoDisponible._id : undefined,
                estadoLimpieza: 'Limpia' // Al ser eliminación, asumimos que se libera
            });
        }

        await Registro.findByIdAndDelete(id);
        res.json({ message: 'Registro eliminado con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
