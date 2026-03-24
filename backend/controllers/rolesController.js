const Rol = require('../models/Rol');
const Usuario = require('../models/Usuario');

const rolesController = {
    getAllRoles: async (req, res) => {
        try {
            const roles = await Rol.find().sort({ name: 1 });
            res.json(roles);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener roles', error: error.message });
        }
    },

    createRole: async (req, res) => {
        try {
            const { nombre, descripcion, permisos } = req.body;
            const newRole = new Rol({
                nombre,
                descripcion,
                permisos // Array de objetos { p: string, v: bool, e: bool, d: bool }
            });
            await newRole.save();
            res.status(201).json({ message: 'Rol creado', id: newRole._id });
        } catch (error) {
            res.status(500).json({ message: 'Error al crear rol', error: error.message });
        }
    },

    updateRole: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await Rol.findByIdAndUpdate(id, req.body, { new: true });
            res.json({ message: 'Rol actualizado', rol: updated });
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar rol', error: error.message });
        }
    },

    deleteRole: async (req, res) => {
        try {
            const { id } = req.params;
            // Verificar si hay usuarios con este rol
            const count = await Usuario.countDocuments({ rol: id });
            if (count > 0) {
                return res.status(400).json({ message: 'Hay usuarios asignados a este rol' });
            }
            await Rol.findByIdAndDelete(id);
            res.json({ message: 'Rol eliminado con éxito' });
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar rol', error: error.message });
        }
    }
};

module.exports = rolesController;
