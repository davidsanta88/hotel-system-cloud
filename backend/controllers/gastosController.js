const Gasto = require('../models/Gasto');
const cloudinary = require('../config/cloudinary');

// Helper para subir buffer a Cloudinary
const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'gastos' },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

const gastosController = {
    getAllGastos: async (req, res) => {
        try {
            const { fechaInicio, fechaFin, categoria_id } = req.query;
            let filter = {};
            if (fechaInicio || fechaFin) {
                filter.fecha = {};
                if (fechaInicio) filter.fecha.$gte = fechaInicio.includes('T') ? new Date(fechaInicio) : new Date(`${fechaInicio}T00:00:00-05:00`);
                if (fechaFin) filter.fecha.$lte = fechaFin.includes('T') ? new Date(fechaFin) : new Date(`${fechaFin}T23:59:59-05:00`);
            }
            if (categoria_id) filter.categoria = categoria_id;

            const gastos = await Gasto.find(filter)
                .populate('categoria')
                .populate('usuario', 'nombre')
                .sort({ fecha: -1 });
            res.json(gastos);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener gastos', error: error.message });
        }
    },

    createGasto: async (req, res) => {
        try {
            const { concepto, categoria_id, monto, notas, fecha_gasto, medioPago } = req.body;
            
            let comprobante_url = null;
            if (req.file) {
                const result = await streamUpload(req.file.buffer);
                comprobante_url = result.secure_url;
                console.log(`[CLOUDINARY] Expense image uploaded: ${comprobante_url}`);
            }

            // Ensure fecha includes current time if it's a date-only string from frontend
            let finalFecha = new Date();
            if (fecha_gasto) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('en-GB', { hour12: false }); // "HH:MM:SS"
                finalFecha = new Date(`${fecha_gasto}T${timeStr}-05:00`);
            }

            const newGasto = new Gasto({
                descripcion: concepto,
                categoria: categoria_id,
                monto: parseFloat(monto) || 0,
                observaciones: notas,
                fecha: finalFecha,
                usuario: req.userId,
                medioPago: medioPago || 'EFECTIVO',
                comprobante_url
            });
            await newGasto.save();
            res.status(201).json(newGasto);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear gasto', error: error.message });
        }
    },

    updateGasto: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = { ...req.body };
            
            // Mapeo de campos si vienen del frontend con nombres distintos
            if (updateData.concepto) updateData.descripcion = updateData.concepto;
            if (updateData.notas) updateData.observaciones = updateData.notas;
            if (updateData.fecha_gasto) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
                updateData.fecha = new Date(`${updateData.fecha_gasto}T${timeStr}-05:00`);
            }
            if (updateData.categoria_id) updateData.categoria = updateData.categoria_id;
            // medioPago remains in updateData if provided

            if (req.file) {
                const result = await streamUpload(req.file.buffer);
                updateData.comprobante_url = result.secure_url;
                console.log(`[CLOUDINARY] Expense image updated: ${updateData.comprobante_url}`);
            }

            const updated = await Gasto.findByIdAndUpdate(id, updateData, { new: true });
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar gasto', error: error.message });
        }
    },

    deleteGasto: async (req, res) => {
        try {
            const { id } = req.params;
            await Gasto.findByIdAndDelete(id);
            res.json({ message: 'Gasto eliminado' });
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar gasto', error: error.message });
        }
    }
};

module.exports = gastosController;
