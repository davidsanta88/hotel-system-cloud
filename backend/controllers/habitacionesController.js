const Habitacion = require('../models/Habitacion');
const fs = require('fs');
const path = require('path');

exports.getHabitaciones = async (req, res) => {
    try {
        const habitaciones = await Habitacion.find()
            .populate('tipo', 'nombre')
            .populate('estado', 'nombre');
        
        // Formatear para mantener compatibilidad con el frontend si es necesario
        const formattedResult = habitaciones.map(h => ({
            ...h._doc,
            id: h._id,
            tipo_nombre: h.tipo ? h.tipo.nombre : null,
            estado_nombre: h.estado ? h.estado.nombre : null,
            photos: h.fotos || []
        }));

        res.json(formattedResult);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createHabitacion = async (req, res) => {
    try {
        const { numero, tipo_id, estado_id, precio_1, precio_2, precio_3, precio_4, precio_5, precio_6, descripcion } = req.body;
        
        const newHab = new Habitacion({
            numero,
            tipo: tipo_id, // Asumiendo que enviarán el ObjectId
            estado: estado_id,
            precios: { precio_1, precio_2, precio_3, precio_4, precio_5, precio_6 },
            descripcion,
            usuarioCreacion: req.userName
        });

        await newHab.save();
        res.status(201).json({ message: 'Habitación creada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero, tipo_id, estado_id, precio_1, precio_2, precio_3, precio_4, precio_5, precio_6, descripcion } = req.body;

        await Habitacion.findByIdAndUpdate(id, {
            numero,
            tipo: tipo_id,
            estado: estado_id,
            precios: { precio_1, precio_2, precio_3, precio_4, precio_5, precio_6 },
            descripcion,
            usuarioModificacion: req.userName,
            fechaModificacion: Date.now()
        });
        
        res.json({ message: 'Habitación actualizada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// ... (uploadFotos y deleteFoto se actualizarían de forma similar usando Habitacion.findById)


exports.deleteHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM habitaciones WHERE id=@id');
        
        res.json({ message: 'Habitación eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.uploadFotos = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No se subieron archivos' });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const file of req.files) {
                const url = `/uploads/habitaciones/${file.filename}`;
                await transaction.request()
                    .input('habitacion_id', sql.Int, id)
                    .input('url', sql.VarChar, url)
                    .input('usuario', sql.VarChar, req.userName)
                    .query('INSERT INTO habitaciones_fotos (habitacion_id, url, UsuarioCreacion) VALUES (@habitacion_id, @url, @usuario)');
            }
            await transaction.commit();
            res.status(201).json({ message: 'Fotos subidas con éxito' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteFoto = async (req, res) => {
    try {
        const { id } = req.params; // ID de la foto
        const pool = await poolPromise;
        
        // 1. Obtener URL de la foto para borrar el archivo
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT url FROM habitaciones_fotos WHERE id = @id');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Foto no encontrada' });
        }

        const photoUrl = result.recordset[0].url;
        const filePath = path.join(__dirname, '..', photoUrl);

        // 2. Eliminar de la base de datos
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM habitaciones_fotos WHERE id = @id');

        // 3. Eliminar archivo físico
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Foto eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateCleaningStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_limpieza, comentario_limpieza } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('estado_limpieza', sql.NVarChar, estado_limpieza)
            .input('comentario_limpieza', sql.NVarChar, comentario_limpieza || null)
            .input('usuario', sql.VarChar, req.userName)
            .query(`UPDATE habitaciones 
                    SET estado_limpieza = @estado_limpieza, 
                        comentario_limpieza = @comentario_limpieza,
                        UsuarioModificacion = @usuario, 
                        FechaModificacion = GETDATE() 
                    WHERE id = @id`);
        
        res.json({ message: 'Estado de limpieza actualizado con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
