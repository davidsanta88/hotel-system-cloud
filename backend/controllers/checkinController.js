const { poolPromise, sql } = require('../config/db');

const checkinController = {
    // Público: Crear check-in
    createPublicCheckin: async (req, res) => {
        const { nombre, documento, celular, correo, procedencia, fecha_llegada, habitacion_numero } = req.body;
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('documento', sql.NVarChar, documento)
                .input('celular', sql.NVarChar, celular)
                .input('correo', sql.NVarChar, correo)
                .input('procedencia', sql.NVarChar, procedencia)
                .input('fecha_llegada', sql.DateTime, fecha_llegada || new Date())
                .input('habitacion_numero', sql.NVarChar, habitacion_numero)
                .query(`
                    INSERT INTO checkin_digital (nombre, documento, celular, correo, procedencia, fecha_llegada, habitacion_numero)
                    VALUES (@nombre, @documento, @celular, @correo, @procedencia, @fecha_llegada, @habitacion_numero)
                `);

            // Aquí se podría disparar una notificación al admin
            res.status(201).json({ message: 'Registro enviado con éxito. Bienvenido al hotel.' });
        } catch (err) {
            console.error('Error in public checkin:', err);
            res.status(500).json({ error: 'Error al enviar registro' });
        }
    },

    // Privado: Obtener check-ins pendientes
    getPendingCheckins: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT * FROM checkin_digital WHERE estado = 'PENDIENTE' ORDER BY created_at DESC
            `);
            res.json(result.recordset);
        } catch (err) {
            console.error('Error fetching checkins:', err);
            res.status(500).json({ error: 'Error al obtener registros' });
        }
    },

    // Privado: Cambiar estado
    updateCheckinStatus: async (req, res) => {
        const { id } = req.params;
        const { estado } = req.body;
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .input('estado', sql.NVarChar, estado)
                .query('UPDATE checkin_digital SET estado = @estado WHERE id = @id');
            res.json({ message: 'Estado actualizado correctamente' });
        } catch (err) {
            console.error('Error updating checkin:', err);
            res.status(500).json({ error: 'Error al actualizar registro' });
        }
    }
};

module.exports = checkinController;
