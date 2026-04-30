const Aliado = require('../models/Aliado');
const cloudinary = require('../config/cloudinary');
const path = require('path');

// Helper para subir a cloudinary
const streamUpload = (buffer, folder = 'aliados') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: folder },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

exports.getAliados = async (req, res) => {
    try {
        const query = req.query.public === 'true' ? { activo: true } : {};
        const aliados = await Aliado.find(query).sort({ orden: 1, nombre: 1 });
        res.json(aliados);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener aliados', error: error.message });
    }
};

exports.createAliado = async (req, res) => {
    try {
        const { nombre, tipo, descripcion, sitioWeb, telefono, ubicacion, orden } = req.body;
        
        let logoData = {};
        if (req.file) {
            const result = await streamUpload(req.file.buffer);
            logoData = {
                logoUrl: result.secure_url,
                public_id: result.public_id
            };
        }

        const nuevoAliado = new Aliado({
            nombre,
            tipo,
            descripcion,
            sitioWeb,
            telefono,
            ubicacion,
            orden,
            ...logoData
        });

        await nuevoAliado.save();
        res.status(201).json(nuevoAliado);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear aliado', error: error.message });
    }
};

exports.updateAliado = async (req, res) => {
    try {
        const { nombre, tipo, descripcion, sitioWeb, telefono, ubicacion, orden, activo } = req.body;
        const aliado = await Aliado.findById(req.params.id);
        
        if (!aliado) return res.status(404).json({ message: 'Aliado no encontrado' });

        let logoData = {};
        if (req.file) {
            // Eliminar logo anterior si existe
            if (aliado.public_id) {
                try {
                    await cloudinary.uploader.destroy(aliado.public_id);
                } catch (e) {
                    console.error('Error eliminando logo anterior:', e.message);
                }
            }
            const result = await streamUpload(req.file.buffer);
            logoData = {
                logoUrl: result.secure_url,
                public_id: result.public_id
            };
        }

        const updatedData = {
            nombre: nombre !== undefined ? nombre : aliado.nombre,
            tipo: tipo !== undefined ? tipo : aliado.tipo,
            descripcion: descripcion !== undefined ? descripcion : aliado.descripcion,
            sitioWeb: sitioWeb !== undefined ? sitioWeb : aliado.sitioWeb,
            telefono: telefono !== undefined ? telefono : aliado.telefono,
            ubicacion: ubicacion !== undefined ? ubicacion : aliado.ubicacion,
            orden: orden !== undefined ? orden : aliado.orden,
            activo: activo !== undefined ? (activo === 'true' || activo === true) : aliado.activo,
            ...logoData
        };

        const updatedAliado = await Aliado.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.json(updatedAliado);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar aliado', error: error.message });
    }
};

exports.deleteAliado = async (req, res) => {
    try {
        const aliado = await Aliado.findById(req.params.id);
        if (!aliado) return res.status(404).json({ message: 'Aliado no encontrado' });

        if (aliado.public_id) {
            try {
                await cloudinary.uploader.destroy(aliado.public_id);
            } catch (e) {
                console.error('Error eliminando logo de aliado en Cloudinary:', e.message);
            }
        }

        await Aliado.findByIdAndDelete(req.params.id);
        res.json({ message: 'Aliado eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar aliado', error: error.message });
    }
};
