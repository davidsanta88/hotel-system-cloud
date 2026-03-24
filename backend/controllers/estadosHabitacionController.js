const EstadoHabitacion = require('../models/EstadoHabitacion');

exports.getEstados = async (req, res) => {
    try {
        const estados = await EstadoHabitacion.find();
        res.json(estados);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createEstado = async (req, res) => {
    try {
        const { nombre, color, descripcion } = req.body;
        const newEstado = new EstadoHabitacion({ nombre, color, descripcion });
        await newEstado.save();
        res.status(201).json(newEstado);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateEstadoHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('usuario', sql.VarChar, req.userName)
            .query('UPDATE estados_habitacion SET nombre = @nombre, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @id');
        res.json({ message: 'Estado de habitación actualizado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteEstadoHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        // Verificar si está en uso por alguna habitación
        const verify = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM habitaciones WHERE estado_id = @id');
            
        if (verify.recordset[0].count > 0) {
            return res.status(400).json({ message: 'No se puede eliminar el estado porque existen habitaciones asociadas a él.' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM estados_habitacion WHERE id = @id');
        res.json({ message: 'Estado de habitación eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
