const { poolPromise, sql } = require('../config/db');

const tiposRegistroController = {
    getAll: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT * FROM tipos_registro ORDER BY nombre ASC');
            res.json(result.recordset);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    create: async (req, res) => {
        try {
            const { nombre, descripcion, visualizar } = req.body;
            const pool = await poolPromise;
            await pool.request()
                .input('nombre', sql.VarChar, nombre)
                .input('descripcion', sql.VarChar, descripcion || null)
                .input('visualizar', sql.Bit, visualizar !== undefined ? visualizar : 1)
                .input('usuario', sql.VarChar, req.userName)
                .query('INSERT INTO tipos_registro (nombre, descripcion, visualizar, UsuarioCreacion) VALUES (@nombre, @descripcion, @visualizar, @usuario)');
            res.status(201).json({ message: 'Tipo de registro creado' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, descripcion, visualizar } = req.body;
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .input('nombre', sql.VarChar, nombre)
                .input('descripcion', sql.VarChar, descripcion || null)
                .input('visualizar', sql.Bit, visualizar !== undefined ? visualizar : 1)
                .input('usuario', sql.VarChar, req.userName)
                .query('UPDATE tipos_registro SET nombre = @nombre, descripcion = @descripcion, visualizar = @visualizar, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @id');
            res.json({ message: 'Tipo de registro actualizado' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await poolPromise;
            
            // Verificar si está en uso
            const enUso = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT COUNT(*) as count FROM registros WHERE tipo_registro_id = @id');
                
            if (enUso.recordset[0].count > 0) {
                return res.status(400).json({ message: 'No se puede eliminar un tipo de registro que está en uso.' });
            }

            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM tipos_registro WHERE id = @id');
            res.json({ message: 'Tipo de registro eliminado' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
};

module.exports = tiposRegistroController;
