const { poolPromise, sql } = require('../config/db');

const mantenimientoController = {
    getMantenimientos: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT m.*, h.numero as habitacion_numero, u.nombre as usuario_nombre
                FROM mantenimiento m
                JOIN habitaciones h ON m.habitacion_id = h.id
                LEFT JOIN usuarios u ON m.usuario_reporta = u.id
                ORDER BY m.fecha_reporte DESC
            `);
            res.json(result.recordset);
        } catch (err) {
            console.error('Error fetching maintenance:', err);
            res.status(500).json({ error: 'Error al obtener mantenimientos' });
        }
    },

    createMantenimiento: async (req, res) => {
        const { habitacion_id, descripcion, prioridad } = req.body;
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('habitacion_id', sql.Int, habitacion_id)
                .input('descripcion', sql.NVarChar, descripcion)
                .input('prioridad', sql.NVarChar, prioridad || 'MEDIA')
                .input('usuario_reporta', sql.Int, req.user ? req.user.id : null)
                .query(`
                    INSERT INTO mantenimiento (habitacion_id, descripcion, prioridad, usuario_reporta)
                    VALUES (@habitacion_id, @descripcion, @prioridad, @usuario_reporta)
                `);
            res.status(201).json({ message: 'Mantenimiento reportado con éxito' });
        } catch (err) {
            console.error('Error creating maintenance:', err);
            res.status(500).json({ error: 'Error al reportar mantenimiento' });
        }
    },

    updateMantenimiento: async (req, res) => {
        const { id } = req.params;
        const { estado, costo, fecha_solucion, solucion_notas } = req.body;
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .input('estado', sql.NVarChar, estado)
                .input('costo', sql.Decimal(10,2), costo || 0)
                .input('solucion_notas', sql.NVarChar, solucion_notas || null)
                .input('fecha_solucion', sql.DateTime, estado === 'SOLUCIONADO' ? (fecha_solucion || new Date()) : null)
                .query(`
                    UPDATE mantenimiento
                    SET estado = @estado, costo = @costo, fecha_solucion = @fecha_solucion, solucion_notas = @solucion_notas
                    WHERE id = @id
                `);
            res.json({ message: 'Mantenimiento actualizado con éxito' });
        } catch (err) {
            console.error('Error updating maintenance:', err);
            res.status(500).json({ error: 'Error al actualizar mantenimiento' });
        }
    },

    deleteMantenimiento: async (req, res) => {
        const { id } = req.params;
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM mantenimiento WHERE id = @id');
            res.json({ message: 'Mantenimiento eliminado con éxito' });
        } catch (err) {
            console.error('Error deleting maintenance:', err);
            res.status(500).json({ error: 'Error al eliminar mantenimiento' });
        }
    }
};

module.exports = mantenimientoController;
