const Categoria = require('../models/Categoria');

const categoriasController = {
    getAllCategorias: async (req, res) => {
        try {
            const categorias = await Categoria.find().sort({ nombre: 1 });
            res.json(categorias);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
        }
    },

    createCategoria: async (req, res) => {
        try {
            const { nombre, descripcion } = req.body;
            const newCat = new Categoria({ nombre, descripcion });
            await newCat.save();
            res.status(201).json(newCat);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear categoría', error: error.message });
        }
    },

    updateCategoria: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await Categoria.findByIdAndUpdate(id, req.body, { new: true });
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar categoría', error: error.message });
        }
    },

    toggleCategoriaActivo: async (req, res) => {
        try {
            const { id } = req.params;
            const cat = await Categoria.findById(id);
            if (!cat) return res.status(404).json({ message: 'Categoría no encontrada' });
            cat.activo = !cat.activo;
            await cat.save();
            res.json({ activo: cat.activo });
        } catch (error) {
            res.status(500).json({ message: 'Error al cambiar estado', error: error.message });
        }
    },

    deleteCategoria: async (req, res) => {
        try {
            const { id } = req.params;
            await Categoria.findByIdAndDelete(id);
            res.json({ message: 'Categoría eliminada' });
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar categoría', error: error.message });
        }
    }
};

module.exports = categoriasController;
