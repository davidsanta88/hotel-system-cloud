const { poolPromise, sql } = require('../config/db');

const notasController = {
    getAll: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT n.*, u1.nombre as usuario_destino_nombre, u2.nombre as usuario_creacion_nombre
                FROM notas_alertas n
                LEFT JOIN usuarios u1 ON n.usuario_destino_id = u1.id
                JOIN usuarios u2 ON n.usuario_creacion_id = u2.id
                ORDER BY n.FechaCreacion DESC
            `);
            res.json(result.recordset);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    getMyAlerts: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('usuario_id', sql.Int, req.userId)
                .query(`
                    SELECT * FROM notas_alertas 
                    WHERE (usuario_destino_id = @usuario_id OR usuario_destino_id IS NULL)
                    AND leida = 0
                    AND fecha_alerta <= CAST(GETDATE() AS DATE)
                    ORDER BY prioridad DESC, fecha_alerta ASC
                `);
            res.json(result.recordset);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    create: async (req, res) => {
        try {
            const { titulo, descripcion, fecha_alerta, usuario_destino_id, prioridad } = req.body;
            const pool = await poolPromise;
            await pool.request()
                .input('titulo', sql.VarChar, titulo)
                .input('descripcion', sql.NVarChar, descripcion)
                .input('fecha_alerta', sql.Date, fecha_alerta)
                .input('usuario_destino_id', sql.Int, usuario_destino_id || null)
                .input('usuario_creacion_id', sql.Int, req.userId)
                .input('prioridad', sql.VarChar, prioridad || 'Normal')
                .input('usuario_nombre', sql.VarChar, req.userName)
                .query(`
                    INSERT INTO notas_alertas (titulo, descripcion, fecha_alerta, usuario_destino_id, usuario_creacion_id, prioridad, UsuarioCreacion)
                    VALUES (@titulo, @descripcion, @fecha_alerta, @usuario_destino_id, @usuario_creacion_id, @prioridad, @usuario_nombre)
                `);
            res.status(201).json({ message: 'Nota creada con éxito' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { titulo, descripcion, fecha_alerta, usuario_destino_id, prioridad, leida } = req.body;
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .input('titulo', sql.VarChar, titulo)
                .input('descripcion', sql.NVarChar, descripcion)
                .input('fecha_alerta', sql.Date, fecha_alerta)
                .input('usuario_destino_id', sql.Int, usuario_destino_id || null)
                .input('prioridad', sql.VarChar, prioridad || 'Normal')
                .input('leida', sql.Bit, leida !== undefined ? leida : 0)
                .input('usuario_nombre', sql.VarChar, req.userName)
                .query(`
                    UPDATE notas_alertas 
                    SET titulo = @titulo, descripcion = @descripcion, fecha_alerta = @fecha_alerta, 
                        usuario_destino_id = @usuario_destino_id, prioridad = @prioridad, leida = @leida,
                        UsuarioModificacion = @usuario_nombre, FechaModificacion = GETDATE()
                    WHERE id = @id
                `);
            res.json({ message: 'Nota actualizada con éxito' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .query('UPDATE notas_alertas SET leida = 1 WHERE id = @id');
            res.json({ message: 'Alerta marcada como leída' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM notas_alertas WHERE id = @id');
            res.json({ message: 'Nota eliminada' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
};

module.exports = notasController;
