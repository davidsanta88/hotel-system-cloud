const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, provea email y contraseña' });
        }

        // Buscar usuario e incluir el rol
        const user = await Usuario.findOne({ email }).populate('rol');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Contraseña inválida' });
        }

        // Obtener permisos del rol poblado
        const permisos = user.rol ? user.rol.permisos : [];

        const token = jwt.sign(
            { id: user._id, rol_id: user.rol ? user.rol._id : null, nombre: user.nombre, permisos },
            process.env.JWT_SECRET,
            { expiresIn: 86400 } // 24 horas
        );

        res.status(200).json({
            id: user._id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol ? user.rol.nombre : null,
            permisos: permisos,
            accessToken: token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await Usuario.findById(userId).populate('rol');
        
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        res.json({
            id: user._id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol ? user.rol.nombre : null,
            permisos: user.rol ? user.rol.permisos : []
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

