const PersonalFinance = require('../models/PersonalFinance');
const PersonalCategory = require('../models/PersonalCategory');

// --- Categorías ---
exports.getPersonalCategories = async (req, res) => {
    try {
        const categories = await PersonalCategory.find({ usuario_id: req.usuario.id });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener categorías', error: error.message });
    }
};

exports.createPersonalCategory = async (req, res) => {
    try {
        const { nombre, tipo, color } = req.body;
        const newCat = new PersonalCategory({
            nombre, tipo, color, usuario_id: req.usuario.id
        });
        await newCat.save();
        res.status(201).json(newCat);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear categoría', error: error.message });
    }
};

exports.deletePersonalCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const inUse = await PersonalFinance.findOne({ categoria_id: id });
        if (inUse) {
            return res.status(400).json({ mensaje: 'No se puede eliminar una categoría que está en uso' });
        }
        await PersonalCategory.deleteOne({ _id: id, usuario_id: req.usuario.id });
        res.json({ mensaje: 'Categoría eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar categoría', error: error.message });
    }
};

// --- Finanzas ---
exports.getPersonalFinances = async (req, res) => {
    try {
        const finances = await PersonalFinance.find({ usuario_id: req.usuario.id })
            .populate('categoria_id')
            .sort({ fecha: -1 });
        
        const resumen = { ingresos: 0, gastos: 0, balance: 0 };
        const porCategoria = {};

        finances.forEach(item => {
            const catNombre = item.categoria_id?.nombre || 'Sin Categoría';
            
            if (item.tipo === 'ingreso') {
                resumen.ingresos += item.monto;
            } else {
                resumen.gastos += item.monto;
                porCategoria[catNombre] = (porCategoria[catNombre] || 0) + item.monto;
            }
        });

        resumen.balance = resumen.ingresos - resumen.gastos;
        const metricasGastos = Object.entries(porCategoria).map(([name, value]) => ({ name, value }));

        res.json({ data: finances, resumen, metricasGastos });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener finanzas', error: error.message });
    }
};

exports.createPersonalFinance = async (req, res) => {
    try {
        const { tipo, categoria_id, monto, descripcion, fecha } = req.body;
        const newRecord = new PersonalFinance({
            tipo, categoria_id, monto, descripcion, 
            fecha: fecha || new Date(),
            usuario_id: req.usuario.id
        });
        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear registro', error: error.message });
    }
};

exports.deletePersonalFinance = async (req, res) => {
    try {
        const { id } = req.params;
        await PersonalFinance.deleteOne({ _id: id, usuario_id: req.usuario.id });
        res.json({ mensaje: 'Registro eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar', error: error.message });
    }
};
