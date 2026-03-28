const Habitacion = require('../models/Habitacion');
const Registro = require('../models/Registro');
const Reserva = require('../models/Reserva');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
 
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
        const habitaciones = await Habitacion.find()
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
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const mañana = new Date(hoy);
        mañana.setDate(hoy.getDate() + 1);

        // 1. Obtener todas las habitaciones
        const habitaciones = await Habitacion.find()
            .populate('tipo', 'nombre')
            .populate('estado', 'nombre');

        // 2. Obtener todos los registros activos (Check-ins)
        const registrosActivos = await Registro.find({ estado: 'activo' })
            .populate('cliente', 'nombre');

        // 3. Obtener reservas próximas (desde hoy en adelante)
        const reservasFuturas = await Reserva.find({
            fecha_salida: { $gte: hoy },
            estado: { $in: ['Confirmada', 'Pendiente'] }
        }).populate('cliente', 'nombre');

        // 4. Mapear cada habitación de forma asíncrona para cargar consumos y estados
        const resultadoPromesas = habitaciones.map(async hab => {
            try {
                const idHab = hab._id.toString();
                const habObj = hab.toObject();
                
                // Buscar registro activo
                const registroActivo = registrosActivos.find(r => r.habitacion && r.habitacion.toString() === idHab);
                
                // Buscar si tiene reserva ACTIVA para HOY (desde entrada hasta salida exclusiva)
                const reservaHoy = reservasFuturas.find(r => {
                    if (!r.habitacion || !r.fecha_entrada || !r.fecha_salida) return false;
                    const entrada = new Date(r.fecha_entrada);
                    const salida = new Date(r.fecha_salida);
                    entrada.setHours(0,0,0,0);
                    salida.setHours(0,0,0,0);
                    
                    const tEntrada = entrada.getTime();
                    const tSalida = salida.getTime();
                    const tHoy = hoy.getTime();
                    
                    return hab._id.equals(r.habitacion) && tHoy >= tEntrada && tHoy < tSalida;
                });

                // Filtrar próximas reservas
                const proximasReservas = reservasFuturas
                    .filter(r => r.habitacion && r.habitacion.toString() === idHab && new Date(r.fecha_entrada) >= hoy)
                    .sort((a, b) => new Date(a.fecha_entrada) - new Date(b.fecha_entrada))
                    .slice(0, 5)
                    .map(r => ({
                        id: r._id,
                        cliente: r.cliente ? r.cliente.nombre : 'Desconocido',
                        entrada: r.fecha_entrada,
                        salida: r.fecha_salida,
                        estado: r.estado
                    }));

                let detalleEstado = '';
                if (registroActivo) {
                    const Venta = require('../models/Venta');
                    const ventas = await Venta.find({ registro: registroActivo._id });
                    const consumosTotal = (ventas || []).reduce((acc, v) => acc + (v.total || 0), 0);
                    const totalPagado = (registroActivo.pagos || []).reduce((acc, p) => acc + (p.monto || 0), 0);
                    
                    let totalEstancia = registroActivo.total || 0;
                    let esEstimado = false;
                    
                    if (totalEstancia <= 0 && registroActivo.fechaEntrada && registroActivo.fechaSalida) {
                        const inDate = new Date(registroActivo.fechaEntrada);
                        const outDate = new Date(registroActivo.fechaSalida);
                        const diffDays = Math.max(Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)), 1);
                        const numHuespedes = Math.min(Math.max((registroActivo.huespedes || []).length, 1), 6);
                        
                        // Acceso seguro mediante habObj
                        const precioKey = `precio_${numHuespedes}`;
                        const precioBase = parseFloat(habObj[precioKey]) || parseFloat(habObj.precio_1) || 0;
                        totalEstancia = precioBase * diffDays;
                        esEstimado = true;
                    }
                    
                    const totalGeneral = totalEstancia + consumosTotal;
                    detalleEstado = {
                        huesped: registroActivo.cliente ? registroActivo.cliente.nombre : 'N/A',
                        entrada: registroActivo.fechaEntrada,
                        salida: registroActivo.fechaSalida,
                        totalEstancia,
                        totalConsumos: consumosTotal,
                        totalGeneral,
                        pagado: totalPagado,
                        saldo: totalGeneral - totalPagado,
                        esEstimado
                    };
                } else if (reservaHoy) {
                    detalleEstado = `Reserva: ${reservaHoy.cliente ? reservaHoy.cliente.nombre : 'N/A'}`;
                }

            // 2. Determinar estado visual prioritario (OPERATIVO)
            let estadoVisual = 'disponible';
            let color = 'green';

            const esSucia = hab.estadoLimpieza && (
                hab.estadoLimpieza.toUpperCase() === 'SUCIA' || 
                hab.estadoLimpieza.toUpperCase() === 'PENDIENTE POR ASEAR'
            );

            if (esSucia) {
                // PRIORIDAD 1: SI ESTÁ SUCIA, MOSTRAR AZUL (Independiente de si hay alguien)
                estadoVisual = 'por_asear';
                color = 'blue';
            } else if (registroActivo) {
                // PRIORIDAD 2: SI NO ESTÁ SUCIA PERO TIENE HUESPED, MOSTRAR ROJO
                estadoVisual = 'ocupada';
                color = 'red';
            } else if (reservaHoy) {
                // PRIORIDAD 3: SI NO ESTÁ SUCIA NI OCUPADA PERO RESERVADA PARA HOY, MOSTRAR AMARILLO
                estadoVisual = 'reservada';
                color = 'yellow';
            }

                return {
                    id: idHab,
                    numero: hab.numero,
                    tipo: hab.tipo ? hab.tipo.nombre : 'N/A',
                    estadoActual: hab.estado ? hab.estado.nombre : 'N/A',
                    estadoLimpieza: hab.estadoLimpieza || 'Limpia',
                    detalleEstado: detalleEstado,
                    proximasReservas: proximasReservas,
                    estadoVisual: estadoVisual,
                    color: color
                };
            } catch (error) {
                console.error(`Error procesando hab ${hab.numero}:`, error);
                return {
                    id: hab._id.toString(),
                    numero: hab.numero,
                    estadoVisual: 'error',
                    color: 'gray',
                    detalleEstado: 'Error de datos'
                };
            }
        });

        const resultado = await Promise.all(resultadoPromesas);
        res.json(resultado);
    } catch (err) {
        console.error('[MAPA ERROR]', err);
        res.status(500).json({ message: err.message });
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

