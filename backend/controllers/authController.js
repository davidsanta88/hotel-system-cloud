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
            { 
                id: user._id, 
                rol_id: user.rol ? user.rol._id : null, 
                rol_nombre: user.rol ? user.rol.nombre : null, // Añadido nombre al token
                nombre: user.nombre, 
                permisos 
            },
            process.env.JWT_SECRET,
            { expiresIn: 86400 } // 24 horas
        );


        res.status(200).json({
            id: user._id,
            nombre: user.nombre,
            email: user.email,
            rol_id: user.rol ? user.rol._id : null, 
            rol_nombre: user.rol ? user.rol.nombre : null,
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
            rol_id: user.rol ? user.rol._id : null,
            rol_nombre: user.rol ? user.rol.nombre : null,
            permisos: user.rol ? user.rol.permisos : []
        });

    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.setupInitialAdmin = async (req, res) => {
    try {
        const userCount = await Usuario.countDocuments();
        if (userCount > 0) {
            return res.status(403).json({ message: 'El administrador inicial ya ha sido configurado' });
        }

        const { nombre, email, password } = req.body;
        
        // Crear el rol Admin por defecto si no existe
        let adminRole = await Rol.findOne({ nombre: 'Admin' });
        if (!adminRole) {
            adminRole = new Rol({
                nombre: 'Admin',
                descripcion: 'Administrador total del sistema'
            });
            await adminRole.save();
        }



        const hashedPassword = bcrypt.hashSync(password, 10);
        const newAdmin = new Usuario({
            nombre,
            email,
            password: hashedPassword,
            rol: adminRole._id,
            activo: true,
            usuarioCreacion: 'SYSTEM_SETUP'
        });

        await newAdmin.save();
        res.status(201).json({ message: 'Administrador inicial creado con éxito. Ya puedes iniciar sesión.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


