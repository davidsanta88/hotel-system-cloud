const { poolPromise, sql } = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getHabitaciones = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT h.*, t.nombre as tipo_nombre, e.nombre as estado_nombre,
            (SELECT url FROM habitaciones_fotos f WHERE f.habitacion_id = h.id FOR JSON PATH) as photos
            FROM habitaciones h 
            LEFT JOIN tipos_habitacion t ON h.tipo_id = t.id
            LEFT JOIN estados_habitacion e ON h.estado_id = e.id
        `);
        
        // Parsear las fotos de cada habitación
        const formattedResult = result.recordset.map(room => ({
            ...room,
            photos: room.photos ? JSON.parse(room.photos).map(p => p.url) : []
        }));

        res.json(formattedResult);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createHabitacion = async (req, res) => {
    try {
        const { numero, tipo_id, estado_id, precio_1, precio_2, precio_3, precio_4, precio_5, precio_6, descripcion } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('numero', sql.Int, numero)
            .input('tipo_id', sql.Int, tipo_id)
            .input('estado_id', sql.Int, estado_id)
            .input('precio_1', sql.Decimal(10,2), precio_1 || null)
            .input('precio_2', sql.Decimal(10,2), precio_2 || null)
            .input('precio_3', sql.Decimal(10,2), precio_3 || null)
            .input('precio_4', sql.Decimal(10,2), precio_4 || null)
            .input('precio_5', sql.Decimal(10,2), precio_5 || null)
            .input('precio_6', sql.Decimal(10,2), precio_6 || null)
            .input('descripcion', sql.Text, descripcion)
            .input('descripcion', sql.Text, descripcion)
            .input('usuario', sql.VarChar, req.userName)
            .query(`INSERT INTO habitaciones (numero, tipo_id, estado_id, precio_1, precio_2, precio_3, precio_4, precio_5, precio_6, descripcion, UsuarioCreacion) 
                    VALUES (@numero, @tipo_id, @estado_id, @precio_1, @precio_2, @precio_3, @precio_4, @precio_5, @precio_6, @descripcion, @usuario)`);
        
        res.status(201).json({ message: 'Habitación creada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero, tipo_id, estado_id, precio_1, precio_2, precio_3, precio_4, precio_5, precio_6, descripcion } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('numero', sql.Int, numero)
            .input('tipo_id', sql.Int, tipo_id)
            .input('estado_id', sql.Int, estado_id)
            .input('precio_1', sql.Decimal(10,2), precio_1 || null)
            .input('precio_2', sql.Decimal(10,2), precio_2 || null)
            .input('precio_3', sql.Decimal(10,2), precio_3 || null)
            .input('precio_4', sql.Decimal(10,2), precio_4 || null)
            .input('precio_5', sql.Decimal(10,2), precio_5 || null)
            .input('precio_6', sql.Decimal(10,2), precio_6 || null)
            .input('descripcion', sql.Text, descripcion)
            .input('usuario', sql.VarChar, req.userName)
            .query(`UPDATE habitaciones SET numero=@numero, tipo_id=@tipo_id, estado_id=@estado_id, 
                    precio_1=@precio_1, precio_2=@precio_2, precio_3=@precio_3, precio_4=@precio_4, precio_5=@precio_5, precio_6=@precio_6, 
                    descripcion=@descripcion, UsuarioModificacion=@usuario, FechaModificacion=GETDATE() WHERE id=@id`);
        
        res.json({ message: 'Habitación actualizada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

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
