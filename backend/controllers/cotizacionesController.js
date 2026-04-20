const Cotizacion = require('../models/Cotizacion');
const HotelConfig = require('../models/HotelConfig');

exports.getCotizaciones = async (req, res) => {
    try {
        const cotizaciones = await Cotizacion.find().sort({ createdAt: -1 });
        res.status(200).json(cotizaciones);
    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        res.status(500).json({ message: 'Error al obtener las cotizaciones' });
    }
};

exports.getCotizacionById = async (req, res) => {
    try {
        const cotizacion = await Cotizacion.findById(req.params.id);
        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });
        res.status(200).json(cotizacion);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la cotización' });
    }
};

exports.createCotizacion = async (req, res) => {
    try {
        const { cliente, correo, telefono, numeroPersonal, valorPersonalNormal, valorDescuento, detalles } = req.body;
        
        const config = await HotelConfig.findOne();
        
        // Generar número de cotización correlativo
        const lastCot = await Cotizacion.findOne().sort({ createdAt: -1 });
        let nextNum = 1;
        if (lastCot && lastCot.numeroCotizacion) {
            const lastNum = parseInt(lastCot.numeroCotizacion.replace('COT-', ''));
            if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
        const numeroCotizacion = `COT-${String(nextNum).padStart(4, '0')}`;

        const subtotal = numeroPersonal * valorPersonalNormal;
        const total = subtotal - valorDescuento;

        const newCotizacion = new Cotizacion({
            numeroCotizacion,
            cliente,
            correo,
            telefono,
            numeroPersonal,
            valorPersonalNormal,
            valorDescuento,
            detalles,
            subtotal,
            total,
            hotelSnapshot: {
                nombre: config?.nombre,
                nit: config?.nit,
                direccion: config?.direccion,
                telefono: config?.telefono,
                correo: config?.correo,
                lema: config?.lema,
                datosBancarios: config?.datosBancarios
            }
        });

        await newCotizacion.save();
        res.status(201).json(newCotizacion);
    } catch (error) {
        console.error('Error al crear cotización:', error);
        res.status(500).json({ message: 'Error al crear la cotización' });
    }
};

exports.updateCotizacion = async (req, res) => {
    try {
        const { cliente, correo, telefono, numeroPersonal, valorPersonalNormal, valorDescuento, detalles } = req.body;
        
        const subtotal = numeroPersonal * valorPersonalNormal;
        const total = subtotal - valorDescuento;

        const cotizacion = await Cotizacion.findByIdAndUpdate(
            req.params.id,
            { 
                cliente, 
                correo, 
                telefono, 
                numeroPersonal, 
                valorPersonalNormal, 
                valorDescuento, 
                detalles,
                subtotal,
                total
            },
            { new: true }
        );

        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });
        res.status(200).json(cotizacion);
    } catch (error) {
        console.error('Error al actualizar cotización:', error);
        res.status(500).json({ message: 'Error al actualizar la cotización' });
    }
};

exports.updateCotizacionStatus = async (req, res) => {
    try {
        const { estado } = req.body;
        const cotizacion = await Cotizacion.findByIdAndUpdate(
            req.params.id, 
            { estado }, 
            { new: true }
        );
        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });
        res.status(200).json(cotizacion);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el estado' });
    }
};

exports.deleteCotizacion = async (req, res) => {
    try {
        await Cotizacion.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Cotización eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la cotización' });
    }
};
