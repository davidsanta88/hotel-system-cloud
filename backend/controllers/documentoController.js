const DocumentoHotel = require('../models/DocumentoHotel');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const streamUpload = (buffer, isRaw = false, originalName = '') => {
    return new Promise((resolve, reject) => {
        const fileExt = path.extname(originalName);
        const fileName = path.basename(originalName, fileExt);
        
        const options = { 
            folder: 'documentos_hotel', 
            resource_type: isRaw ? 'raw' : 'auto'
        };

        // Si es raw, necesitamos la extensión en el public_id para que se descargue correctamente
        if (isRaw && originalName) {
            options.public_id = `${fileName}_${Date.now()}${fileExt}`;
        }
        
        const stream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

exports.getDocumentos = async (req, res) => {
    try {
        const documentos = await DocumentoHotel.find().sort({ createdAt: -1 });
        res.json(documentos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener documentos', error: error.message });
    }
};

exports.uploadDocumento = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const { nombre, tipo, observacion } = req.body;
        const isRaw = !req.file.mimetype.startsWith('image/');
        const result = await streamUpload(req.file.buffer, isRaw, req.file.originalname);

        const nuevoDoc = new DocumentoHotel({
            nombre: nombre || req.file.originalname,
            tipo: tipo || 'OTRO',
            url: result.secure_url,
            observacion
        });

        await nuevoDoc.save();
        res.status(201).json(nuevoDoc);
    } catch (error) {
        res.status(500).json({ message: 'Error al subir el documento', error: error.message });
    }
};

exports.deleteDocumento = async (req, res) => {
    try {
        const doc = await DocumentoHotel.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });
        res.json({ message: 'Documento eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el documento', error: error.message });
    }
};
