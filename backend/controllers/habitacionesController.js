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

        const resultado = habitaciones.map(hab => {
            const idHab = hab._id.toString();
            
            // Buscar registro activo
            const registroActivo = registrosActivos.find(r => r.habitacion.toString() === idHab);
            
            // Buscar si tiene reserva para HOY
            const reservaHoy = reservasFuturas.find(r => {
                const entrada = new Date(r.fecha_entrada);
                const salida = new Date(r.fecha_salida);
                entrada.setHours(0,0,0,0);
                salida.setHours(23,59,59,999);
                return hab._id.equals(r.habitacion) && hoy >= entrada && hoy <= salida;
            });

            // Filtrar reservas futuras (excluyendo la de hoy si ya está ocupada o reservada)
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

            // Determinar estado visual prioritario
            let estadoVisual = 'disponible';
            let color = 'green';
            let detalleEstado = '';

            if (registroActivo) {
                estadoVisual = 'ocupada';
                color = 'red';
                const totalPagado = registroActivo.pagos.reduce((acc, p) => acc + p.monto, 0);
                detalleEstado = {
                    huesped: registroActivo.cliente ? registroActivo.cliente.nombre : 'N/A',
                    entrada: registroActivo.fechaEntrada,
                    salida: registroActivo.fechaSalida,
                    total: registroActivo.total,
                    pagado: totalPagado
                };
            } else if (reservaHoy) {
                estadoVisual = 'reservada';
                color = 'yellow';
                detalleEstado = `Reserva: ${reservaHoy.cliente ? reservaHoy.cliente.nombre : 'N/A'}`;
            } else if (hab.estadoLimpieza === 'Sucia') {
                estadoVisual = 'por_asear';
                color = 'blue';
            }

            return {
                id: idHab,
                numero: hab.numero,
                tipo: hab.tipo ? hab.tipo.nombre : 'N/A',
                estadoActual: hab.estado ? hab.estado.nombre : 'N/A',
                estadoLimpieza: hab.estadoLimpieza,
                estadoVisual,
                color,
                detalleEstado,
                reservasFuturas: proximasReservas
            };
        });

        res.json(resultado);
    } catch (err) {
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

