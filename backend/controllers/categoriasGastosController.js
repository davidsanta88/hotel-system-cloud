const CategoriaGasto = require('../models/CategoriaGasto');

const categoriasGastosController = {
    getAllCategorias: async (req, res) => {
        try {
            const categorias = await CategoriaGasto.find().sort({ nombre: 1 });
            res.json(categorias);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener categorías de gastos', error: error.message });
        }
    },

    createCategoria: async (req, res) => {
        try {
            const { nombre, descripcion } = req.body;
            const newCat = new CategoriaGasto({ nombre, descripcion });
            await newCat.save();
            res.status(201).json(newCat);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear categoría de gasto', error: error.message });
        }
    },

    updateCategoria: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await CategoriaGasto.findByIdAndUpdate(id, req.body, { new: true });
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar categoría de gasto', error: error.message });
        }
    },

    deleteCategoria: async (req, res) => {
        try {
            const { id } = req.params;
            await CategoriaGasto.findByIdAndDelete(id);
            res.json({ message: 'Categoría eliminada' });
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar categoría', error: error.message });
        }
    }
};

module.exports = categoriasGastosController;
