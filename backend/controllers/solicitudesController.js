const { poolPromise, sql } = require('../config/db');
const notificacionesController = require('./notificacionesController');

const solicitudesController = {
    // Crear solicitud (Público)
    crearSolicitud: async (req, res) => {
        const { nombre, celular, correo, num_huespedes, fecha_llegada, notas } = req.body;
        if (!celular) return res.status(400).json({ error: 'El celular es obligatorio' });

        try {
            const pool = await poolPromise;
            await pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('celular', sql.NVarChar, celular)
                .input('correo', sql.NVarChar, correo)
                .input('num_huespedes', sql.Int, num_huespedes || 1)
                .input('fecha_llegada', sql.Date, fecha_llegada || null)
                .input('notas', sql.NVarChar, notas || null)
                .query(`
                    INSERT INTO solicitudes_reserva (nombre, celular, correo, num_huespedes, fecha_llegada, notas)
                    VALUES (@nombre, @celular, @correo, @num_huespedes, @fecha_llegada, @notas)
                `);
            
            // Trigger notifications in background
            notificacionesController.sendNotifications({ nombre, celular, correo, num_huespedes, fecha_llegada, notas });

            res.json({ message: 'Solicitud enviada correctamente. Pronto nos contactaremos con usted.' });
        } catch (err) {
            console.error('Error al crear solicitud:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener todas (Admin)
    getSolicitudes: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT * FROM solicitudes_reserva ORDER BY created_at DESC');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error al obtener solicitudes:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // actualizar estado (Admin)
    actualizarEstado: async (req, res) => {
        const { id } = req.params;
        const { estado } = req.body;
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .input('estado', sql.NVarChar, estado)
                .query('UPDATE solicitudes_reserva SET estado = @estado WHERE id = @id');
            res.json({ message: 'Estado actualizado' });
        } catch (err) {
            console.error('Error al actualizar solicitud:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

module.exports = solicitudesController;
