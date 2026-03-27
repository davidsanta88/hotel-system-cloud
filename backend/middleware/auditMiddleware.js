const Auditoria = require('../models/Auditoria');

const auditMiddleware = async (req, res, next) => {
    const originalJson = res.json;
    const methodsToLog = ['POST', 'PUT', 'DELETE'];
    
    if (!methodsToLog.includes(req.method)) {
        return next();
    }

    res.json = function(data) {
        res.locals.responseBody = data;
        originalJson.call(this, data);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
            logAction(req, res);
        }
    };

    next();
};

const logAction = async (req, res) => {
    try {
        const modulo = req.originalUrl.split('/')[2] || 'general';
        if (modulo === 'auditoria' || req.originalUrl.includes('/login')) return;

        const detail = {
            body: req.body,
            params: req.params,
            query: req.query,
            response: res.locals.responseBody
        };

        const newLog = new Auditoria({
            usuario: req.userName || 'Sistema',
            accion: req.method,
            tabla: modulo,
            detalles: detail,
            ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip
        });

        await newLog.save();
    } catch (err) {
        console.error('Error al registrar auditoría:', err);
    }
};

module.exports = auditMiddleware;
