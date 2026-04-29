const DocumentoHotel = require('../models/DocumentoHotel');
const cloudinary = require('../config/cloudinary');

const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'documentos_hotel', resource_type: 'auto' },
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
        const result = await streamUpload(req.file.buffer);

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
