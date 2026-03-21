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
    const { poolPromise, sql } = require('../config/db');
    return async (req, res, next) => {
        try {
            // Bypass para SuperAdmin (rol_id = 1)
            if (req.userRole === 1) {
                return next();
            }

            const pool = await poolPromise;
            const result = await pool.request()
                .input('rol_id', sql.Int, req.userRole)
                .input('pantalla', sql.VarChar, pantalla)
                .query(`SELECT ${accion} as authorized FROM roles_permisos WHERE rol_id = @rol_id AND pantalla_codigo = @pantalla`);

            if (result.recordset.length > 0 && result.recordset[0].authorized) {
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
