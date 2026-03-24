const { poolPromise, sql } = require('../config/db');

const auditMiddleware = async (req, res, next) => {
    const originalJson = res.json;
    
    // Solo loggear métodos que modifican datos
    const methodsToLog = ['POST', 'PUT', 'DELETE'];
    if (!methodsToLog.includes(req.method)) {
        return next();
    }

    // Interceptar la respuesta para saber si fue exitosa
    res.json = function(data) {
        res.locals.responseBody = data;
        originalJson.call(this, data);
        
        // Loggear después de enviar la respuesta exitosa
        if (res.statusCode >= 200 && res.statusCode < 300) {
            logAction(req, res);
        }
    };

    next();
};

const logAction = async (req, res) => {
    try {
        const pool = await poolPromise;
        const usuario_id = req.user ? req.user.id : null;
        const modulo = req.originalUrl.split('/')[2] || 'general';
        const accion = req.method;
        const detalle = JSON.stringify({
            body: req.body,
            params: req.params,
            query: req.query,
            response: res.locals.responseBody
        });
        const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // No loggear la propia auditoría ni el login (opcional, pero login es sensible)
        if (modulo === 'auditoria' || req.originalUrl.includes('/login')) return;

        await pool.request()
            .input('usuario_id', sql.Int, usuario_id)
            .input('accion', sql.NVarChar, accion)
            .input('modulo', sql.NVarChar, modulo)
            .input('detalle', sql.NVarChar, detalle)
            .input('ip_address', sql.NVarChar, ip_address)
            .query(`
                INSERT INTO auditoria (usuario_id, accion, modulo, detalle, ip_address)
                VALUES (@usuario_id, @accion, @modulo, @detalle, @ip_address)
            `);
    } catch (err) {
        console.error('Error al registrar auditoría:', err);
    }
};

module.exports = auditMiddleware;
