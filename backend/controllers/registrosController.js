const Registro = require('../models/Registro');
const Habitacion = require('../models/Habitacion');
const Cliente = require('../models/Cliente');
const Reserva = require('../models/Reserva');
const MedioPago = require('../models/MedioPago');
const EstadoHabitacion = require('../models/EstadoHabitacion');

exports.getRegistros = async (req, res) => {
    try {
        const registros = await Registro.find()
            .populate('habitacion', 'numero')
            .populate('cliente', 'nombre documento telefono')
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
                telefono_cliente: raw.telefono_cliente || (raw.cliente ? raw.cliente.telefono : ''),
                numero_habitacion: raw.numero_habitacion || (raw.habitacion ? raw.habitacion.numero : '?'),
                tipo_registro_nombre: raw.tipo_registro_nombre || 'Formal',
                valor_pagado: (raw.pagos || []).reduce((acc, p) => acc + (p.monto || 0), 0)
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
            .populate('cliente', 'nombre documento telefono')
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
                telefono_cliente: raw.telefono_cliente || (raw.cliente ? raw.cliente.telefono : ''),
                numero_habitacion: raw.numero_habitacion || (raw.habitacion ? raw.habitacion.numero : '?'),
                valor_pagado: (raw.pagos || []).reduce((acc, p) => acc + (p.monto || 0), 0)
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
            notas: raw.notas || raw.observaciones || '',
            valor_pagado: (raw.pagos || []).reduce((acc, p) => acc + (p.monto || 0), 0)
        };
        
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Auxiliar para limpiar strings con formato (puntos de miles) antes de convertir a número
const cleanNumber = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    // Eliminar puntos de miles y cambiar coma por punto decimal si existe
    const cleaned = val.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
};

exports.createRegistro = async (req, res) => {
    try {
        const { 
            habitacion_id, fecha_ingreso, fecha_salida, huespedes, total, 
            observaciones, notas, medio_pago_id, valor_cobrado, tipo_registro_id, 
            reserva_id, reservaId, id_reserva 
        } = req.body;

        // 1. Extraer reserva_id robustamente (body o alias)
        const finalReservaId = reserva_id || reservaId || id_reserva;
        
        console.log(`[CREATE REGISTRO] Raw Total: ${total} | Raw Abono: ${valor_cobrado} | ReservaID: ${finalReservaId}`);

        if (!huespedes || huespedes.length === 0) {
            return res.status(400).json({ message: 'Se requiere al menos un huésped' });
        }

        const huesped_ids = [];
        for (const h of huespedes) {
            const guestId = (typeof h === 'string') ? h : (h.id || h._id);
            if (guestId) {
                huesped_ids.push(guestId);
            } else if (typeof h === 'object' && h.documento) {
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
        const totalNum = cleanNumber(total);
        const abonoInicial = cleanNumber(valor_cobrado);

        const newReg = new Registro({
            habitacion: habitacion_id,
            cliente: titular_id,
            huespedes: huesped_ids,
            fechaEntrada: fecha_ingreso,
            fechaSalida: fecha_salida,
            total: totalNum,
            observaciones: observaciones || notas,
            tipo_registro: tipo_registro_id || undefined,
            estado: 'activo',
            medio_pago: medio_pago_id || undefined,
            valor_cobrado: abonoInicial
        });

        // 5. Registrar el primer pago (Abono inicial) si existe
        if (abonoInicial > 0) {
            const medio = await MedioPago.findById(medio_pago_id);
            newReg.pagos = [{
                monto: abonoInicial,
                medio: medio ? medio.nombre : 'Efectivo',
                usuario_nombre: req.userName || 'Sistema',
                notas: finalReservaId ? 'Traslado de abono de reserva' : 'Abono inicial en check-in',
                fecha: Date.now()
            }];
        }

        await newReg.save();
        
        // 2. Marcar habitación como ocupada
        const estadoOcupada = await EstadoHabitacion.findOne({ nombre: /ocupada/i });
        if (estadoOcupada) {
            await Habitacion.findByIdAndUpdate(habitacion_id, { 
                estado: estadoOcupada._id,
                estadoLimpieza: 'En Uso'
            });
        }

        // 3. Marcar reserva como concluida (REGISTRADA)
        if (finalReservaId) {
            try {
                const resUpdate = await Reserva.findByIdAndUpdate(finalReservaId, { estado: 'Concluida' }, { new: true });
                if (resUpdate) {
                    console.log(`[CHECKIN SUCCESS] Reserva ${finalReservaId} marcada como CONCLUIDA.`);
                } else {
                    console.warn(`[CHECKIN WARNING] No se encontró reserva para actualizar con ID: ${finalReservaId}`);
                }
            } catch (errRes) {
                console.error(`[CHECKIN ERROR] Error actualizando reserva ${finalReservaId}:`, errRes);
            }
        }

        res.status(201).json({ message: 'Registro creado', registro: newReg });
    } catch (err) {
        console.error('[CREATE ERROR]', err);
        res.status(500).json({ message: err.message });
    }
};

exports.checkout = async (req, res) => {
    try {
        const { id } = req.params;
        const { notasSalida } = req.body;
        const registro = await Registro.findById(id);
        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });

        // 1. Finalizar registro
        registro.estado = 'finalizado';
        registro.fechaSalida = Date.now();
        if (notasSalida) {
            registro.notasSalida = notasSalida;
        }
        await registro.save();

        // 2. Liberar habitación (Marcar como disponible pero SUCIA para que pase a azul)
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

exports.checkinFromReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const reserva = await Reserva.findById(id).populate('habitaciones.habitacion');
        
        if (!reserva) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        if (reserva.estado === 'Concluida') {
            return res.status(400).json({ message: 'Esta reserva ya ha sido procesada (Check-in ya realizado)' });
        }

        // 1. Obtener estados de habitación
        const EstadoHabitacion = require('../models/EstadoHabitacion');
        const estadoOcupada = await EstadoHabitacion.findOne({ nombre: /ocupada/i });

        const creados = [];
        
        // 2. Determinar habitaciones a procesar
        let habsParaProcesar = [];
        if (reserva.habitaciones && reserva.habitaciones.length > 0) {
            habsParaProcesar = reserva.habitaciones;
        } else if (reserva.habitacion) {
            habsParaProcesar = [{
                habitacion: reserva.habitacion,
                precio_acordado: reserva.valor_total
            }];
        }

        if (habsParaProcesar.length === 0) {
            return res.status(400).json({ message: 'La reserva no tiene habitaciones asignadas' });
        }

        // 3. Crear Registros
        for (let i = 0; i < habsParaProcesar.length; i++) {
            const h = habsParaProcesar[i];
            const habId = h.habitacion._id || h.habitacion;
            
            const newReg = new Registro({
                habitacion: habId,
                cliente: reserva.cliente,
                fechaEntrada: reserva.fecha_entrada || new Date(),
                fechaSalida: reserva.fecha_salida,
                total: h.precio_acordado || (reserva.valor_total / habsParaProcesar.length),
                observaciones: `[CHECK-IN AUTOMÁTICO] Reserva #${reserva._id}. ${reserva.observaciones || ''}`,
                estado: 'activo',
                usuarioCreacion: req.userName || 'Sistema'
            });

            // Transferir abonos si es el primer registro
            if (i === 0 && reserva.abonos && reserva.abonos.length > 0) {
                newReg.pagos = reserva.abonos.map(a => ({
                    monto: a.monto,
                    medio: a.medio_pago || 'Reserva',
                    notas: `Abono de Reserva: ${a.notas || ''}`,
                    usuario_nombre: a.usuario_nombre || 'Sistema',
                    fecha: a.fecha || Date.now()
                }));
            } else if (i === 0 && reserva.valor_abonado > 0 && (!reserva.abonos || reserva.abonos.length === 0)) {
                // Fallback si hay valor_abonado pero no array de abonos
                newReg.pagos = [{
                    monto: reserva.valor_abonado,
                    medio: 'Reserva (Saldo)',
                    notas: 'Traslado de abono de reserva',
                    usuario_nombre: 'Sistema',
                    fecha: Date.now()
                }];
            }

            await newReg.save();
            creados.push(newReg);

            // 4. Actualizar estado de habitación a OCUPADA y EN USO
            if (estadoOcupada) {
                await Habitacion.findByIdAndUpdate(habId, { 
                    estado: estadoOcupada._id,
                    estadoLimpieza: 'En Uso'
                });
            }
        }

        // 5. Finalizar Reserva
        reserva.estado = 'Concluida';
        await reserva.save();

        res.status(201).json({ 
            message: 'Check-in realizado con éxito', 
            registros: creados 
        });

    } catch (err) {
        console.error('[CHECKIN FROM RESERVA ERROR]', err);
        res.status(500).json({ message: err.message });
    }
};
