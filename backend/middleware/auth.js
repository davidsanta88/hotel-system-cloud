const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Soporte para ambos headers: 'x-auth-token' inyectado por el proxy de Vercel TIENE PRIORIDAD
    // sobre 'authorization', el cual en la nube contiene la contraseña de SmarterASP.
    let token = req.headers['x-auth-token'] || req.headers['authorization'];
    
    if (!token) {
        console.log(`[AUTH] No token found for ${req.method} ${req.url}`);
        return res.status(403).json({ message: 'No token provided' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error(`[AUTH] JWT verify error for ${req.method} ${req.url}:`, err.message);
            return res.status(401).json({ message: 'Unauthorized', error: err.message });
        }
        req.userId = decoded.id;
        req.userRole = decoded.rol_id;
        req.userRoleName = decoded.rol_nombre;
        req.userName = decoded.nombre;
        next();
    });
};

const isAdmin = async (req, res, next) => {
    try {
        // 1. Bypass por nombre de usuario 'Administrador' (SuperAdmin total)
        if (req.userName === 'Administrador') return next();

        // 2. Intentar por el nombre guardado en el token
        const roleName = req.userRoleName ? req.userRoleName.toLowerCase() : '';
        if (roleName.includes('admin') || roleName.includes('administrador')) {
            return next();
        }

        // 3. Fallback: buscar el rol en la DB por ID
        if (req.userRole) {
            const Rol = require('../models/Rol');
            const rol = await Rol.findById(req.userRole);
            if (rol && (rol.nombre.toLowerCase().includes('admin') || rol.nombre.toLowerCase().includes('administrador'))) {
                return next();
            }
        }

        res.status(403).json({ message: 'Requiere rol de Administrador' });
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar permisos de administrador' });
    }
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
            // Bypass para SuperAdmin por nombre de usuario
            if (req.userName === 'Administrador') return next();

            const rol = await Rol.findById(req.userRole);
            
            if (!rol) return res.status(403).json({ message: 'Rol no encontrado' });

            // Case-insensitive check for admin variants
            const roleName = rol.nombre.toLowerCase();
            if (roleName.includes('admin') || roleName.includes('administrador')) return next();

            const permiso = rol.permisos.find(p => p.p === pantalla);
            
            // Map actions to short names used in model
            const actionMap = {
                'can_view': 'v',
                'can_edit': 'e',
                'can_delete': 'd'
            };
            const mappedAccion = actionMap[accion] || accion;

            if (permiso && permiso[mappedAccion]) {
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
