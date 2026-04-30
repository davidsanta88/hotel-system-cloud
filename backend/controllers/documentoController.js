const DocumentoHotel = require('../models/DocumentoHotel');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const streamUpload = (buffer, isRaw = false, originalName = '') => {
    return new Promise((resolve, reject) => {
        const fileExt = path.extname(originalName);
        const fileName = path.basename(originalName, fileExt).replace(/[^a-zA-Z0-9]/g, '_');
        
        const options = { 
            folder: 'documentos_hotel', 
            resource_type: isRaw ? 'raw' : 'image',
            type: 'upload',
            access_mode: 'public'
        };

        // Siempre incluimos la extensión en el public_id para asegurar que se sirva correctamente
        if (originalName) {
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

        const { nombre, tipo, observacion, entidad_id } = req.body;
        
        // PDFs se tratan como imágenes en Cloudinary para permitir fl_attachment si se requiere luego
        const isPDF = req.file.mimetype === 'application/pdf';
        const isImage = req.file.mimetype.startsWith('image/');
        const isRaw = !isImage && !isPDF;

        const result = await streamUpload(req.file.buffer, isRaw, req.file.originalname);

        const nuevoDoc = new DocumentoHotel({
            nombre: nombre || req.file.originalname,
            tipo: tipo || 'OTRO',
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            version: result.version,
            entidad_id: entidad_id,
            observacion
        });

        await nuevoDoc.save();
        res.status(201).json(nuevoDoc);
    } catch (error) {
        res.status(500).json({ message: 'Error al subir el documento', error: error.message });
    }
};

exports.downloadDocumento = async (req, res) => {
    try {
        const doc = await DocumentoHotel.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        const axios = require('axios');
        const response = await axios({
            method: 'get',
            url: doc.url,
            responseType: 'stream'
        });

        // Configurar cabeceras para forzar la descarga con el nombre real
        const extension = path.extname(doc.url) || '.pdf';
        const fileName = doc.nombre.toLowerCase().endsWith(extension.toLowerCase()) ? doc.nombre : `${doc.nombre}${extension}`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/pdf');

        response.data.pipe(res);
    } catch (error) {
        console.error('Error en proxy de descarga:', error.message);
        res.status(500).json({ message: 'Error al procesar la descarga' });
    }
};

exports.deleteDocumento = async (req, res) => {
    try {
        const doc = await DocumentoHotel.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        // Intentar eliminar de Cloudinary
        let publicId = doc.public_id;
        let resourceType = doc.resource_type || 'image';

        if (!publicId) {
            // Fallback: extraer de la URL
            const urlParts = doc.url.split('/');
            const uploadIndex = urlParts.indexOf('upload');
            if (uploadIndex !== -1) {
                const hasVersion = urlParts[uploadIndex + 1] && urlParts[uploadIndex + 1].startsWith('v');
                publicId = urlParts.slice(uploadIndex + (hasVersion ? 2 : 1)).join('/');
                // Quitar la extensión para el destroy
                if (publicId.includes('.')) {
                    publicId = publicId.substring(0, publicId.lastIndexOf('.'));
                }
                resourceType = urlParts[uploadIndex - 1];
            }
        }

        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            } catch (err) {
                console.error('[CLOUDINARY] Error deleting file:', err.message);
                // Continuamos con la eliminación en DB incluso si falla en Cloudinary
            }
        }

        await DocumentoHotel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Documento eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el documento', error: error.message });
    }
};
