const Habitacion = require('../models/Habitacion');
const Registro = require('../models/Registro');
const Reserva = require('../models/Reserva');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const Venta = require('../models/Venta');
const TipoHabitacion = require('../models/TipoHabitacion');
const EstadoHabitacion = require('../models/EstadoHabitacion');
const Cliente = require('../models/Cliente'); // Necesario para populate en mapa-visual
const moment = require('moment-timezone');
 
// Helper para subir buffer a Cloudinary
const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'habitaciones' },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

exports.getHabitaciones = async (req, res) => {
    try {
        const habitaciones = await Habitacion.find().sort({ numero: 1 })
            .populate('tipo', 'nombre')
            .populate('estado', 'nombre');
        
        // Formatear para mantener compatibilidad con el frontend si es necesario
        const formattedResult = habitaciones.map(h => ({
            ...h._doc,
            id: h._id.toString(),
            tipo_id: h.tipo ? h.tipo._id.toString() : null,
            estado_id: h.estado ? h.estado._id.toString() : null,
            tipo_nombre: h.tipo ? h.tipo.nombre : null,
            estado_nombre: h.estado ? h.estado.nombre : null,
            photos: h.fotos || []
        }));

        res.json(formattedResult);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMapaVisual = async (req, res) => {
    try {
        // Ajustar 'hoy' a la zona horaria de Colombia (UTC-5) para determinar el día actual del hotel
        const hoy = moment.tz("America/Bogota").startOf('day').toDate();

        // 1. Obtener datos base
        console.log('[DEBUG] Consultando base de datos...');
        const [habitaciones, registrosActivos, todasReservas] = await Promise.all([
            Habitacion.find().sort({ numero: 1 }).populate('tipo', 'nombre').populate('estado', 'nombre'),
            Registro.find({ estado: 'activo' }),
            Reserva.find({
                fecha_salida: { $gte: hoy },
                estado: { $in: ['Confirmada', 'Pendiente'] }
            })
        ]);

        // Población manual de clientes (desde sharedConn) para máxima estabilidad
        const allClienteIds = [
            ...registrosActivos.map(r => r.cliente),
            ...todasReservas.map(r => r.cliente)
        ].filter(id => id);
        
        const uniqueClienteIds = [...new Set(allClienteIds.map(id => id.toString()))];
        const clientesShared = await Cliente.find({ _id: { $in: uniqueClienteIds } });
        const clienteMap = new Map(clientesShared.map(c => [c._id.toString(), c]));

        // Inyectar clientes en registros y reservas
        registrosActivos.forEach(r => { if (r.cliente) r.cliente = clienteMap.get(r.cliente.toString()); });
        todasReservas.forEach(r => { if (r.cliente) r.cliente = clienteMap.get(r.cliente.toString()); });

        console.log(`[DEBUG] Datos cargados: ${habitaciones.length} habs, ${registrosActivos.length} registros, ${todasReservas.length} reservas`);

        // 2. Procesar cada habitación
        const resultadoPromesas = habitaciones.map(async (hab) => {
            try {
                const idHab = hab._id.toString();
                const habObj = hab.toObject();
                
                // Buscar registro activo (Check-in)
                const registroActivo = registrosActivos.find(r => 
                    r.habitacion && r.habitacion.toString() === idHab
                );
                
                // Buscar reserva para hoy
                const reservaHoy = todasReservas.find(r => {
                    try {
                        if (!r.fecha_entrada || !r.fecha_salida) return false;
                        const tieneHab = (r.habitacion && r.habitacion.toString() === idHab) || 
                                        (r.habitaciones && r.habitaciones.some(rh => rh.habitacion && rh.habitacion.toString() === idHab));
                        if (!tieneHab) return false;

                        const entrada = moment.tz(r.fecha_entrada, "America/Bogota").startOf('day').toDate();
                        const salida = moment.tz(r.fecha_salida, "America/Bogota").startOf('day').toDate();
                        return hoy.getTime() >= entrada.getTime() && hoy.getTime() < salida.getTime();
                    } catch (e) { return false; }
                });

                // Reservas futuras para esta habitación
                const proximasReservas = todasReservas
                    .filter(r => {
                        const tieneHab = (r.habitacion && r.habitacion.toString() === idHab) || 
                                        (r.habitaciones && r.habitaciones.some(rh => rh.habitacion && rh.habitacion.toString() === idHab));
                        return tieneHab && moment.tz(r.fecha_entrada, "America/Bogota").toDate() >= hoy;
                    })
                    .sort((a, b) => moment.tz(a.fecha_entrada, "America/Bogota").toDate() - moment.tz(b.fecha_entrada, "America/Bogota").toDate())
                    .slice(0, 5)
                    .map(r => ({
                        id: r._id,
                        cliente: r.cliente ? r.cliente.nombre : 'Desconocido',
                        entrada: r.fecha_entrada,
                        salida: r.fecha_salida,
                        estado: r.estado
                    }));

                let detalleEstado = null;
                if (registroActivo) {
                    try {
                        // Cargar consumos de la tienda con catch preventivo
                        const ventas = await Venta.find({ registro: registroActivo._id }).catch(() => []);
                        const consumosTotal = (ventas || []).reduce((acc, v) => acc + (v.total || 0), 0);
                        
                        // Asegurar que pagos sea un array
                        const pagos = registroActivo.pagos || [];
                        const totalPagado = pagos.reduce((acc, p) => acc + (p.monto || 0), 0);
                        
                        let totalEstancia = registroActivo.total || 0;
                        if (totalEstancia <= 0 && registroActivo.fechaEntrada && registroActivo.fechaSalida) {
                            const inDate = moment.tz(registroActivo.fechaEntrada, "America/Bogota").toDate();
                            const outDate = moment.tz(registroActivo.fechaSalida, "America/Bogota").toDate();
                            if (!isNaN(inDate) && !isNaN(outDate)) {
                                const diffDays = Math.max(Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)), 1);
                                const numHuespedes = Math.min(Math.max((registroActivo.huespedes || []).length, 1), 6);
                                const precioKey = `precio_${numHuespedes}`;
                                const precioBase = parseFloat(habObj[precioKey]) || parseFloat(habObj.precio_1) || 0;
                                totalEstancia = precioBase * diffDays;
                            }
                        }
                        
                        const totalGeneral = totalEstancia + consumosTotal;
                        detalleEstado = {
                            id_registro: registroActivo._id, // Necesario para el Check-out rápido
                            huesped: registroActivo.cliente ? registroActivo.cliente.nombre : 'Huésped',
                            entrada: registroActivo.fechaEntrada,
                            salida: registroActivo.fechaSalida,
                            totalEstancia,
                            totalConsumos: consumosTotal,
                            totalGeneral,
                            pagado: totalPagado,
                            saldo: totalGeneral - totalPagado
                        };
                    } catch (e) {
                        console.error(`Error procesando detalle para registro ${registroActivo._id}:`, e);
                        detalleEstado = {
                            huesped: 'Error en datos',
                            totalGeneral: 0,
                            pagado: 0,
                            saldo: 0
                        };
                    }
                } else if (reservaHoy) {
                    detalleEstado = {
                        id_reserva: reservaHoy._id,
                        huesped: reservaHoy.cliente ? reservaHoy.cliente.nombre : 'Reserva',
                        entrada: reservaHoy.fecha_entrada,
                        salida: reservaHoy.fecha_salida,
                        reserva: true
                    };
                }

                // 2. Determinar estado visual prioritario
                let estadoVisual = 'disponible';
                let color = 'green';

                const esSucia = hab.estadoLimpieza && 
                    (['SUCIA', 'PENDIENTE POR ASEAR'].includes(hab.estadoLimpieza.toUpperCase()));

                if (esSucia) {
                    estadoVisual = 'por_asear';
                    color = 'blue';
                } else if (registroActivo) {
                    estadoVisual = 'ocupada';
                    color = 'red';
                } else if (reservaHoy) {
                    estadoVisual = 'reservada';
                    color = 'yellow';
                }

                return {
                    id: idHab,
                    numero: hab.numero,
                    tipo: hab.tipo ? hab.tipo.nombre : 'N/A',
                    estadoActual: hab.estado ? hab.estado.nombre : 'N/A',
                    estado_nombre: hab.estado ? hab.estado.nombre : 'N/A',
                    estadoLimpieza: hab.estadoLimpieza || 'Limpia',
                    detalleEstado,
                    reservasFuturas: proximasReservas, 
                    estadoVisual,
                    color
                };
            } catch (error) {
                console.error(`Error en hab ${hab.numero}:`, error);
                return {
                    id: hab._id ? hab._id.toString() : 'err',
                    numero: hab.numero || '?',
                    estadoVisual: 'error',
                    error: true
                };
            }
        });

        const resultado = await Promise.all(resultadoPromesas);
        
        // Ordenar ESTRICTAMENTE por número como paso final absoluto
        resultado.sort((a, b) => {
            const numA = Number(a.numero) || 0;
            const numB = Number(b.numero) || 0;
            return numA - numB;
        });

        res.json(resultado);
    } catch (err) {
        console.error('[MAPA ERROR GLOBAL]', err);
        res.status(500).json({ message: 'Error interno al cargar el mapa visual', error: err.message });
    }
};

exports.createHabitacion = async (req, res) => {
    try {
        const { numero, tipo_id, estado_id, precio_1, precio_2, precio_3, precio_4, precio_5, precio_6, descripcion } = req.body;
        
        const newHab = new Habitacion({
            numero,
            tipo: tipo_id,
            estado: estado_id,
            precio_1, precio_2, precio_3, precio_4, precio_5, precio_6,
            descripcion,
            usuarioCreacion: req.userName
        });

        await newHab.save();
        res.status(201).json({ message: 'Habitación creada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero, tipo_id, estado_id, precio_1, precio_2, precio_3, precio_4, precio_5, precio_6, descripcion } = req.body;

        await Habitacion.findByIdAndUpdate(id, {
            numero,
            tipo: tipo_id,
            estado: estado_id,
            precio_1, precio_2, precio_3, precio_4, precio_5, precio_6,
            descripcion,
            usuarioModificacion: req.userName,
            fechaModificacion: Date.now()
        });
        
        res.json({ message: 'Habitación actualizada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// ... (uploadFotos y deleteFoto se actualizarían de forma similar usando Habitacion.findById)


exports.deleteHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        await Habitacion.findByIdAndDelete(id);
        res.json({ message: 'Habitación eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.uploadFotos = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No se subieron archivos' });
        }

        const hab = await Habitacion.findById(id);
        if (!hab) return res.status(404).json({ message: 'Habitación no encontrada' });
 
        // Subir cada archivo a Cloudinary
        const uploadPromises = req.files.map(file => streamUpload(file.buffer));
        const results = await Promise.all(uploadPromises);
        const urls = results.map(result => result.secure_url);

        hab.fotos = [...(hab.fotos || []), ...urls];
        await hab.save();
 
        res.status(201).json({ message: 'Fotos subidas con éxito', fotos: hab.fotos });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteFoto = async (req, res) => {
    try {
        const { id, index } = req.params; // ID de hab y el index de la foto o la URL
        const hab = await Habitacion.findById(id);
        if (!hab) return res.status(404).json({ message: 'Habitación no encontrada' });

        const photoUrl = hab.fotos[index];
        if (photoUrl) {
            // Si es una URL de Cloudinary, omitimos el borrado manual por ahora para simplificar, 
            // pero eliminamos el registro de la base de datos.
            hab.fotos.splice(index, 1);
            await hab.save();
        }

        res.json({ message: 'Foto eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateCleaningStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_limpieza, comentario_limpieza } = req.body;
        
        await Habitacion.findByIdAndUpdate(id, {
            estadoLimpieza: estado_limpieza,
            comentarioLimpieza: comentario_limpieza,
            usuarioModificacion: req.userName,
            fechaModificacion: Date.now()
        });
        
        res.json({ message: 'Estado de limpieza actualizado con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

