const Gasto = require('../models/Gasto');

const gastosController = {
    getAllGastos: async (req, res) => {
        try {
            const { fechaInicio, fechaFin, categoria_id } = req.query;
            let filter = {};
            if (fechaInicio || fechaFin) {
                filter.fecha = {};
                if (fechaInicio) filter.fecha.$gte = new Date(fechaInicio);
                if (fechaFin) filter.fecha.$lte = new Date(fechaFin);
            }
            if (categoria_id) filter.categoria = categoria_id;

            const gastos = await Gasto.find(filter).populate('categoria').sort({ fecha: -1 });
            res.json(gastos);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener gastos', error: error.message });
        }
    },

    createGasto: async (req, res) => {
        try {
            const { concepto, categoria_id, monto, notas, fecha_gasto } = req.body;
            const newGasto = new Gasto({
                descripcion: concepto,
                categoria: categoria_id,
                monto,
                observaciones: notas,
                fecha: fecha_gasto || Date.now(),
                usuario: req.userId
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
            const updated = await Gasto.findByIdAndUpdate(id, req.body, { new: true });
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
