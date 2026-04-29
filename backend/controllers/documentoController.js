const DocumentoHotel = require('../models/DocumentoHotel');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const streamUpload = (buffer, isRaw = false, originalName = '') => {
    return new Promise((resolve, reject) => {
        const fileExt = path.extname(originalName);
        const fileName = path.basename(originalName, fileExt);
        
        const options = { 
            folder: 'documentos_hotel', 
            resource_type: isRaw ? 'raw' : 'auto',
            type: 'upload',
            access_mode: 'public'
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
        
        // Generar URLs firmadas para asegurar acceso si la cuenta tiene restricciones
        const docsConUrlsFirmadas = documentos.map(doc => {
            const docObj = doc.toObject();
            
            // Extraer el public_id de la URL almacenada
            // La URL suele ser: https://res.cloudinary.com/cloud_name/resource_type/type/v.../folder/public_id
            const urlParts = doc.url.split('/');
            const uploadIndex = urlParts.indexOf('upload');
            if (uploadIndex !== -1) {
                // El public_id empieza después del 'v...' (versión)
                // O después de 'upload' si no hay versión
                const publicIdWithFolder = urlParts.slice(uploadIndex + 2).join('/');
                const resourceType = urlParts[uploadIndex - 2]; // 'image' o 'raw'
                
                docObj.url = cloudinary.url(publicIdWithFolder, {
                    resource_type: resourceType,
                    secure: true,
                    sign_url: true,
                    // Si queremos forzar descarga aquí también podemos
                    flags: 'attachment'
                });
            }
            
            return docObj;
        });

        res.json(docsConUrlsFirmadas);
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
