const Reserva = require('../models/Reserva');
const Habitacion = require('../models/Habitacion');

// Helper to check for overlapping reservations
const verificarDisponibilidad = async (habitacionesIds, fechaEntrada, fechaSalida, excludeReservaId = null) => {
    const entrada = new Date(fechaEntrada);
    const salida = new Date(fechaSalida);
    
    // Normalizar a fechas simples si no vienen con hora específica (opcional, pero ayuda)
    // if (!fechaEntrada.includes('T')) entrada.setHours(14,0,0,0);
    // if (!fechaSalida.includes('T')) salida.setHours(11,0,0,0);

    const match = {
        estado: { $in: ['Pendiente', 'Confirmada'] },
        'habitaciones.habitacion': { $in: habitacionesIds },
        $and: [
            { fecha_entrada: { $lt: salida } },
            { fecha_salida: { $gt: entrada } }
        ]
    };

    if (excludeReservaId) {
        match._id = { $ne: excludeReservaId };
    }

    return await Reserva.findOne(match).populate('habitaciones.habitacion');
};

exports.getReservas = async (req, res) => {
    try {
        const reservas = await Reserva.find()
            .populate('cliente')
            .populate('habitacion') // legacy
            .populate('habitaciones.habitacion') // new
            .sort({ fechaCreacion: -1 });
        
        // Ensure every reservation has expected fields even if not migrated
        const formatted = reservas.map(r => {
            const obj = r.toObject({ virtuals: true });
            
            // Fallback for rooms (legacy support)
            if ((!obj.habitaciones || obj.habitaciones.length === 0) && obj.habitacion) {
                obj.habitaciones = [{
                    habitacion: obj.habitacion,
                    numero: obj.habitacion?.numero || 'N/A',
                    precio_acordado: obj.habitacion?.precio_1 || 0
                }];
            }

            // Ensure nested room numbers are present
            if (obj.habitaciones && Array.isArray(obj.habitaciones)) {
                obj.habitaciones = obj.habitaciones.map(h => ({
                    ...h,
                    numero: h.numero || h.habitacion?.numero || 'N/A'
                }));
            }
            
            // Fallback for dates
            if (!obj.fecha_entrada && obj.fechaInicio) obj.fecha_entrada = obj.fechaInicio;
            if (!obj.fecha_salida && obj.fechaFin) obj.fecha_salida = obj.fechaFin;

            // Ensure client_nombre is present
            if (!obj.cliente_nombre || obj.cliente_nombre === 'Desconocido') {
                obj.cliente_nombre = obj.cliente?.nombre || 'Desconocido';
            }

            return obj;
        });

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllReservas = exports.getReservas;

exports.createReserva = async (req, res) => {
    try {
        const { cliente_id, habitaciones, fecha_entrada, fecha_salida, ...rest } = req.body;
        
        // --- VALIDACIÓN DE DISPONIBILIDAD ---
        const habIds = habitaciones.map(h => h.id || h.habitacion_id);
        const conflicto = await verificarDisponibilidad(habIds, fecha_entrada, fecha_salida);
        
        if (conflicto) {
            // Encontrar qué habitación de las enviadas es la que choca
            const habConflicto = conflicto.habitaciones.find(h => habIds.includes(h.habitacion.toString()));
            return res.status(400).json({ 
                message: `La habitación ${habConflicto?.numero || ''} ya está reservada en esas fechas.`,
                conflicto: conflicto
            });
        }
        // ------------------------------------

        const payload = {
            ...rest,
            cliente: cliente_id,
            fecha_entrada,
            fecha_salida,
            // Fallback for old apps sending singular date names
            fechaInicio: fecha_entrada || rest.fechaInicio,
            fechaFin: fecha_salida || rest.fechaFin,
            usuarioCreacion: req.userName,
            habitaciones: [],
            abonos: []
        };

        // Automatically register initial deposit in history if present
        const montoInicial = parseFloat(payload.valor_abonado) || 0;
        if (montoInicial > 0) {
            payload.abonos = [{
                monto: montoInicial,
                medio_pago: 'Efectivo', // Default or from rest if present
                notas: 'Abono inicial al registrar la reserva',
                usuario_nombre: req.userName,
                fecha: new Date()
            }];
        }

        if (habitaciones && Array.isArray(habitaciones)) {
            for (const h of habitaciones) {
                const habDoc = await Habitacion.findById(h.id || h.habitacion_id);
                payload.habitaciones.push({
                    habitacion: h.id || h.habitacion_id,
                    numero: habDoc ? habDoc.numero : '',
                    precio_acordado: h.precio || h.precio_acordado || 0
                });
            }
            // For backward compatibility, set the first room in the singular field
            if (payload.habitaciones.length > 0) {
                payload.habitacion = payload.habitaciones[0].habitacion;
            }
        }

        const newReserva = new Reserva(payload);
        await newReserva.save();
        res.status(201).json(newReserva);
    } catch (err) {
        console.error('Error creating reserva:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.updateReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const { cliente_id, habitaciones, fecha_entrada, fecha_salida, ...rest } = req.body;

        // --- VALIDACIÓN DE DISPONIBILIDAD ---
        if (fecha_entrada && fecha_salida && habitaciones) {
            const habIds = habitaciones.map(h => h.id || h.habitacion_id || h.value);
            const conflicto = await verificarDisponibilidad(habIds, fecha_entrada, fecha_salida, id);
            
            if (conflicto) {
                const habConflicto = conflicto.habitaciones.find(h => habIds.includes(h.habitacion.toString()));
                return res.status(400).json({ 
                    message: `Conflicto detectado: La habitación ${habConflicto?.numero || ''} ya tiene una reserva activa.`,
                    conflicto: conflicto
                });
            }
        }
        // ------------------------------------

        const updateData = {
            ...rest,
            cliente: cliente_id || rest.cliente,
            fecha_entrada,
            fecha_salida
        };

        if (fecha_entrada) updateData.fechaInicio = fecha_entrada;
        if (fecha_salida) updateData.fechaFin = fecha_salida;

        if (habitaciones && Array.isArray(habitaciones)) {
            updateData.habitaciones = [];
            for (const h of habitaciones) {
                const habDoc = await Habitacion.findById(h.id || h.habitacion_id || h.value);
                updateData.habitaciones.push({
                    habitacion: h.id || h.habitacion_id || h.value,
                    numero: habDoc ? habDoc.numero : '',
                    precio_acordado: h.precio || h.precio_acordado || 0
                });
            }
            if (updateData.habitaciones.length > 0) {
                updateData.habitacion = updateData.habitaciones[0].habitacion;
            }
        }

        const updated = await Reserva.findByIdAndUpdate(id, updateData, { new: true })
            .populate('cliente')
            .populate('habitaciones.habitacion');
            
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateReservaStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const updated = await Reserva.findByIdAndUpdate(id, { estado }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteReserva = async (req, res) => {
    try {
        const { id } = req.params;
        await Reserva.findByIdAndDelete(id);
        res.json({ message: 'Reserva eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getReservaById = async (req, res) => {
    try {
        const { id } = req.params;
        const r = await Reserva.findById(id)
            .populate('cliente')
            .populate('habitacion')
            .populate('habitaciones.habitacion');
        
        if (!r) return res.status(404).json({ message: 'Reserva no encontrada' });

        const obj = r.toObject({ virtuals: true });
        
        // Formateo idéntico al de getReservas para consistencia
        if ((!obj.habitaciones || obj.habitaciones.length === 0) && obj.habitacion) {
            obj.habitaciones = [{
                habitacion: obj.habitacion,
                numero: obj.habitacion?.numero || 'N/A',
                precio_acordado: obj.habitacion?.precio_1 || 0
            }];
        }
        if (obj.habitaciones && Array.isArray(obj.habitaciones)) {
            obj.habitaciones = obj.habitaciones.map(h => ({
                ...h,
                numero: h.numero || h.habitacion?.numero || 'N/A'
            }));
        }
        if (!obj.fecha_entrada && obj.fechaInicio) obj.fecha_entrada = obj.fechaInicio;
        if (!obj.fecha_salida && obj.fechaFin) obj.fecha_salida = obj.fechaFin;
        if (!obj.cliente_nombre || obj.cliente_nombre === 'Desconocido') {
            obj.cliente_nombre = obj.cliente?.nombre || 'Desconocido';
        }

        res.json(obj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
