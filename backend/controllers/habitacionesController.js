const Habitacion = require('../models/Habitacion');
const fs = require('fs');
const path = require('path');

exports.getHabitaciones = async (req, res) => {
    try {
        const habitaciones = await Habitacion.find()
            .populate('tipo', 'nombre')
            .populate('estado', 'nombre');
        
        // Formatear para mantener compatibilidad con el frontend si es necesario
        const formattedResult = habitaciones.map(h => ({
            ...h._doc,
            id: h._id,
            tipo_nombre: h.tipo ? h.tipo.nombre : null,
            estado_nombre: h.estado ? h.estado.nombre : null,
            photos: h.fotos || []
        }));

        res.json(formattedResult);
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

        const urls = req.files.map(file => `/uploads/habitaciones/${file.filename}`);
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
            const filePath = path.join(__dirname, '..', photoUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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

