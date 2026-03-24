const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Soporte para ambos headers: 'x-auth-token' inyectado por el proxy de Vercel TIENE PRIORIDAD
    // sobre 'authorization', el cual en la nube contiene la contraseña de SmarterASP.
    let token = req.headers['x-auth-token'] || req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.rol_id;
        req.userName = decoded.nombre;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.userRole === 1) {
        next();
        return;
    }
    res.status(403).json({ message: 'Requiere rol de Administrador' });
};

const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (allowedRoles.includes(req.userRole)) {
            next();
        } else {
            res.status(403).json({ message: 'No tiene permisos para realizar esta acción' });
        }
    };
};

// Middleware para permisos granulares basados en la tabla roles_permisos
const checkPermission = (pantalla, accion) => {
    const Rol = require('../models/Rol');
    return async (req, res, next) => {
        try {
            // Bypass para SuperAdmin (asumiendo que tiene un nombre específico o ID)
            // Aquí usamos el nombre del rol o podemos buscar por ID
            const rol = await Rol.findById(req.userRole);
            
            if (!rol) return res.status(403).json({ message: 'Rol no encontrado' });

            if (rol.nombre === 'admin') return next();

            const permiso = rol.permisos.find(p => p.p === pantalla);
            
            if (permiso && permiso[accion]) {
                next();
            } else {
                res.status(403).json({ message: `No tienes permiso para ${accion} en el módulo ${pantalla}` });
            }
        } catch (err) {
            res.status(500).json({ message: 'Error al verificar permisos' });
        }
    };
};


module.exports = {
    verifyToken,
    isAdmin,
    authorize,
    checkPermission
};
