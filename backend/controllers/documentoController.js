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
        
        // Generar URLs firmadas para asegurar acceso si la cuenta tiene restricciones
        const docsConUrlsFirmadas = documentos.map(doc => {
            const docObj = doc.toObject();
            
            // Usar public_id y resource_type almacenados si existen (más robusto)
            if (doc.public_id && doc.resource_type) {
                // Sanitizar nombre para el attachment (quitar extensión y caracteres especiales)
                let cleanName = doc.nombre.replace(/\.[^/.]+$/, ""); 
                cleanName = cleanName.replace(/[^a-zA-Z0-9]/g, '_');

                docObj.url = cloudinary.url(doc.public_id, {
                    resource_type: doc.resource_type,
                    version: doc.version,
                    secure: true,
                    sign_url: true,
                    flags: `attachment:${cleanName}`
                });
            } else {
                // Fallback: Extraer de la URL (para registros antiguos)
                const urlParts = doc.url.split('/');
                const uploadIndex = urlParts.indexOf('upload');
                
                if (uploadIndex !== -1) {
                    const resourceType = urlParts[uploadIndex - 1]; 
                    const versionPart = urlParts[uploadIndex + 1];
                    const hasVersion = versionPart && versionPart.startsWith('v') && !isNaN(versionPart.substring(1));
                    
                    const publicIdWithFolder = urlParts.slice(uploadIndex + (hasVersion ? 2 : 1)).join('/');
                    
                    const cleanName = doc.nombre.replace(/[^a-zA-Z0-9]/g, '_');
                    const downloadName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

                    docObj.url = cloudinary.url(publicIdWithFolder, {
                        resource_type: resourceType,
                        secure: true,
                        sign_url: true,
                        version: hasVersion ? versionPart.substring(1) : undefined,
                        flags: resourceType !== 'raw' ? `attachment:${downloadName}` : undefined
                    });
                }
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

        const { nombre, tipo, observacion, entidad_id } = req.body;
        
        // PDFs se tratan como imágenes en Cloudinary para permitir fl_attachment (descarga forzada)
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
