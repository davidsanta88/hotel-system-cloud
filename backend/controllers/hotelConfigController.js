const HotelConfig = require('../models/HotelConfig');

// Obtener la configuración (Singleton)
exports.getConfig = async (req, res) => {
    try {
        let config = await HotelConfig.findOne();
        
        // Si no existe, crear la inicial con valores por defecto
        if (!config) {
            config = new HotelConfig({});
            await config.save();
        }
        
        res.status(200).json(config);
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ message: 'Error al obtener la configuración del hotel' });
    }
};

// Actualizar la configuración
exports.updateConfig = async (req, res) => {
    try {
        const { nombre, nit, direccion, telefono, correo, politica } = req.body;
        
        let config = await HotelConfig.findOne();
        
        if (!config) {
            config = new HotelConfig({ nombre, nit, direccion, telefono, correo, politica });
        } else {
            config.nombre = nombre || config.nombre;
            config.nit = nit || config.nit;
            config.direccion = direccion || config.direccion;
            config.telefono = telefono || config.telefono;
            config.correo = correo || config.correo;
            config.politica = politica || config.politica;
            config.updatedAt = Date.now();
        }
        
        await config.save();
        res.status(200).json(config);
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({ message: 'Error al actualizar la configuración del hotel' });
    }
};
