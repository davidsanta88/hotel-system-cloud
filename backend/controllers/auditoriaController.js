const { poolPromise, sql } = require('../config/db');

const auditoriaController = {
    getLogs: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT TOP 100 a.*, u.nombre as usuario_nombre
                FROM auditoria a
                LEFT JOIN usuarios u ON a.usuario_id = u.id
                ORDER BY a.created_at DESC
            `);
            res.json(result.recordset);
        } catch (err) {
            console.error('Error al obtener logs:', err);
            res.status(500).json({ error: 'Error al obtener auditoría' });
        }
    }
};

module.exports = auditoriaController;
