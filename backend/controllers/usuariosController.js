const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

const usuariosController = {
    getAllUsuarios: async (req, res) => {
        try {
            const usuarios = await Usuario.find({}, '-password').populate('rol');
            res.json(usuarios);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
        }
    },

    createUsuario: async (req, res) => {
        try {
            const { nombre, email, password, rol_id, telefono } = req.body;
            const hashedPassword = bcrypt.hashSync(password, 10);
            const newUsuario = new Usuario({
                nombre,
                email,
                password: hashedPassword,
                rol: rol_id,
                telefono,
                usuarioCreacion: req.userName
            });
            await newUsuario.save();
            res.status(201).json(newUsuario);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear usuario', error: error.message });
        }
    },

    updateUsuario: async (req, res) => {
        try {
            const { id } = req.params;
            const data = { ...req.body };
            if (data.password) data.password = bcrypt.hashSync(data.password, 10);
            const updated = await Usuario.findByIdAndUpdate(id, data, { new: true });
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
        }
    },

    deleteUsuario: async (req, res) => {
        try {
            const { id } = req.params;
            await Usuario.findByIdAndDelete(id);
            res.json({ message: 'Usuario eliminado' });
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
        }
    }
};

module.exports = usuariosController;
