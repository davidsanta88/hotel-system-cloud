const { poolPromise, sql } = require('../config/db');

exports.getRegistros = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT r.*, h.numero as numero_habitacion, c.nombre as nombre_cliente, tr.nombre as tipo_registro_nombre
            FROM registros r
            JOIN habitaciones h ON r.habitacion_id = h.id
            JOIN clientes c ON r.cliente_id = c.id
            LEFT JOIN tipos_registro tr ON r.tipo_registro_id = tr.id
            ORDER BY r.fecha_creacion DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getActiveRegistros = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT r.*, c.nombre as cliente_nombre, h.numero as habitacion_numero, tr.nombre as tipo_registro_nombre
            FROM registros r
            JOIN clientes c ON r.cliente_id = c.id
            JOIN habitaciones h ON r.habitacion_id = h.id
            LEFT JOIN tipos_registro tr ON r.tipo_registro_id = tr.id
            WHERE r.estado = 'activa'
            ORDER BY r.fecha_creacion DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRegistroById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        // Fetch main registro details
        const resultRegistro = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT r.*, 
                       h.numero as numero_habitacion, 
                       c.nombre as nombre_cliente,
                       c.documento as documento_cliente,
                       mp.nombre as medio_pago_nombre
                FROM registros r
                JOIN habitaciones h ON r.habitacion_id = h.id
                JOIN clientes c ON r.cliente_id = c.id
                LEFT JOIN medios_pago mp ON r.medio_pago_id = mp.id
                WHERE r.id = @id
            `);

        if (resultRegistro.recordset.length === 0) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        const registro = resultRegistro.recordset[0];

        // Fetch all huespedes associated with this registro
        const resultHuespedes = await pool.request()
            .input('registro_id', sql.Int, id)
            .query(`
                SELECT c.id, c.nombre, c.documento, c.tipo_documento, c.telefono, c.email
                FROM registros_huespedes rh
                JOIN clientes c ON rh.cliente_id = c.id
                WHERE rh.registro_id = @registro_id
            `);

        registro.huespedes = resultHuespedes.recordset;

        res.json(registro);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createRegistro = async (req, res) => {
    try {
        const { habitacion_id, cliente_id, fecha_ingreso, fecha_salida, huespedes, total, medio_pago_id, valor_cobrado, notas, tipo_registro_id } = req.body;
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            if (!huespedes || huespedes.length === 0) {
                throw new Error("Debe agregar al menos un huésped para el registro.");
            }

            let cliente_ids = [];
            
            for (let huesped of huespedes) {
                if (huesped.id) {
                    cliente_ids.push(huesped.id); // Cliente existente
                } else {
                    let result_cliente = await transaction.request()
                        .input('documento', sql.VarChar, huesped.documento)
                        .query('SELECT id FROM clientes WHERE documento = @documento');
                    
                    if (result_cliente.recordset.length > 0) {
                        cliente_ids.push(result_cliente.recordset[0].id);
                    } else {
                        // Crear nuevo cliente
                        let inst_client = await transaction.request()
                            .input('nombre', sql.VarChar, huesped.nombre)
                            .input('documento', sql.VarChar, huesped.documento)
                            .input('tipo_documento', sql.VarChar, huesped.tipo_documento || 'CC')
                            .input('telefono', sql.VarChar, huesped.telefono || null)
                            .input('email', sql.VarChar, huesped.email || null)
                            .input('municipio_origen_id', sql.Int, huesped.municipio_origen_id || null)
                            .input('usuario', sql.VarChar, req.userName)
                            .query('INSERT INTO clientes (nombre, documento, tipo_documento, telefono, email, municipio_origen_id, UsuarioCreacion) OUTPUT inserted.id VALUES (@nombre, @documento, @tipo_documento, @telefono, @email, @municipio_origen_id, @usuario)');
                        cliente_ids.push(inst_client.recordset[0].id);
                    }
                }
            }

            const titular_id = cliente_ids[0]; // El primer huésped es el titular

            // Insertar registro
            const resInsert = await transaction.request()
                .input('habitacion_id', sql.Int, habitacion_id)
                .input('cliente_id', sql.Int, titular_id)
                .input('fecha_ingreso', sql.Date, fecha_ingreso)
                .input('fecha_salida', sql.Date, fecha_salida)
                .input('total', sql.Decimal(10,2), total)
                .input('medio_pago_id', sql.Int, medio_pago_id || null)
                .input('valor_cobrado', sql.Decimal(10,2), valor_cobrado || 0)
                .input('notas', sql.NVarChar(sql.MAX), notas || null)
                .input('tipo_registro_id', sql.Int, tipo_registro_id || 1) // 1 = Formal por defecto
                .input('usuario', sql.VarChar, req.userName)
                .query(`
                    INSERT INTO registros (habitacion_id, cliente_id, fecha_ingreso, fecha_salida, estado, total, medio_pago_id, valor_cobrado, notas, tipo_registro_id, UsuarioCreacion)
                    OUTPUT inserted.id
                    VALUES (@habitacion_id, @cliente_id, @fecha_ingreso, @fecha_salida, 'activa', @total, @medio_pago_id, @valor_cobrado, @notas, @tipo_registro_id, @usuario)
                `);

            const registro_id = resInsert.recordset[0].id;

            // Asociar todos los huéspedes al registro
            for (let c_id of cliente_ids) {
                await transaction.request()
                    .input('registro_id', sql.Int, registro_id)
                    .input('cliente_id', sql.Int, c_id)
                    .input('usuario', sql.VarChar, req.userName || 'Sistema')
                    .query('INSERT INTO registros_huespedes (registro_id, cliente_id, UsuarioCreacion) VALUES (@registro_id, @cliente_id, @usuario)');
            }

            await transaction.request()
                .input('habitacion_id', sql.Int, habitacion_id)
                .input('usuario', sql.VarChar, req.userName)
                .query("UPDATE habitaciones SET estado_id = (SELECT id FROM estados_habitacion WHERE nombre = 'ocupada'), UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @habitacion_id");

            await transaction.commit();
            res.status(201).json({ message: 'Registro creado con éxito' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateRegistro = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            habitacion_id, 
            huespedes, 
            fecha_ingreso, 
            fecha_salida, 
            total, 
            medio_pago_id, 
            valor_cobrado, 
            notas, 
            estado 
        } = req.body;
        
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Obtener datos actuales del registro
            const currentRes = await transaction.request()
                .input('id', sql.Int, id)
                .query('SELECT habitacion_id, cliente_id, estado FROM registros WHERE id=@id');
            
            if (currentRes.recordset.length === 0) {
                throw new Error('Registro no encontrado');
            }
            
            const old_habitacion_id = currentRes.recordset[0].habitacion_id;
            const old_estado = currentRes.recordset[0].estado;

            // 2. Manejo de cambio de habitación si aplica
            if (habitacion_id && habitacion_id != old_habitacion_id) {
                // Liberar habitación vieja
                await transaction.request()
                    .input('old_hab', sql.Int, old_habitacion_id)
                    .input('usuario', sql.VarChar, req.userName)
                    .query("UPDATE habitaciones SET estado_id = (SELECT id FROM estados_habitacion WHERE nombre = 'disponible'), UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @old_hab");
                
                // Ocupar habitación nueva
                await transaction.request()
                    .input('new_hab', sql.Int, habitacion_id)
                    .input('usuario', sql.VarChar, req.userName)
                    .query("UPDATE habitaciones SET estado_id = (SELECT id FROM estados_habitacion WHERE nombre = 'ocupada'), UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @new_hab");
            }

            // 3. Manejo de estado: si pasa a completada/cancelada, liberar habitación actual
            if (estado && (estado === 'completada' || estado === 'cancelada') && old_estado !== 'completada' && old_estado !== 'cancelada') {
                const hab_to_release = habitacion_id || old_habitacion_id;
                await transaction.request()
                    .input('hab_id', sql.Int, hab_to_release)
                    .input('usuario', sql.VarChar, req.userName)
                    .query("UPDATE habitaciones SET estado_id = (SELECT id FROM estados_habitacion WHERE nombre = 'disponible'), UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @hab_id");
            } 
            // Si vuelve a activa/pendiente desde completada/cancelada, volver a ocupar
            else if (estado && (estado === 'activa' || estado === 'pendiente') && (old_estado === 'completada' || old_estado === 'cancelada')) {
                const hab_to_occupy = habitacion_id || old_habitacion_id;
                await transaction.request()
                    .input('hab_id', sql.Int, hab_to_occupy)
                    .input('usuario', sql.VarChar, req.userName)
                    .query("UPDATE habitaciones SET estado_id = (SELECT id FROM estados_habitacion WHERE nombre = 'ocupada'), UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @hab_id");
            }

            // 4. Manejo de Huéspedes si se proporcionan
            let titular_id = currentRes.recordset[0].cliente_id;
            if (huespedes && huespedes.length > 0) {
                // Borrar asociaciones actuales
                await transaction.request()
                    .input('registro_id', sql.Int, id)
                    .query('DELETE FROM registros_huespedes WHERE registro_id = @registro_id');

                let cliente_ids = [];
                for (let huesped of huespedes) {
                    if (huesped.id) {
                        cliente_ids.push(huesped.id);
                    } else {
                        // Buscar o crear cliente (como en createRegistro)
                        let res_c = await transaction.request()
                            .input('doc', sql.VarChar, huesped.documento)
                            .query('SELECT id FROM clientes WHERE documento = @doc');
                        
                        if (res_c.recordset.length > 0) {
                            cliente_ids.push(res_c.recordset[0].id);
                        } else {
                            let inst = await transaction.request()
                                .input('nombre', sql.VarChar, huesped.nombre)
                                .input('doc', sql.VarChar, huesped.documento)
                                .input('tipo', sql.VarChar, huesped.tipo_documento || 'CC')
                                .input('tel', sql.VarChar, huesped.telefono || null)
                                .input('email', sql.VarChar, huesped.email || null)
                                .input('email', sql.VarChar, huesped.email || null)
                                .input('muni', sql.Int, huesped.municipio_origen_id || null)
                                .input('usuario', sql.VarChar, req.userName)
                                .query('INSERT INTO clientes (nombre, documento, tipo_documento, telefono, email, municipio_origen_id, UsuarioCreacion) OUTPUT inserted.id VALUES (@nombre, @doc, @tipo, @tel, @email, @muni, @usuario)');
                            cliente_ids.push(inst.recordset[0].id);
                        }
                    }
                }

                // El primer huésped de la lista es el nuevo titular
                titular_id = cliente_ids[0];

                // Re-asociar huéspedes
                for (let c_id of cliente_ids) {
                    await transaction.request()
                        .input('registro_id', sql.Int, id)
                        .input('cliente_id', sql.Int, c_id)
                        .input('usuario', sql.VarChar, req.userName)
                        .query('INSERT INTO registros_huespedes (registro_id, cliente_id, UsuarioCreacion) VALUES (@registro_id, @cliente_id, @usuario)');
                }
            }

            // 5. Actualizar campos del registro
            // Usamos COALESCE o valores previos si no vienen en el body para campos clave
            await transaction.request()
                .input('id', sql.Int, id)
                .input('habitacion_id', sql.Int, habitacion_id || old_habitacion_id)
                .input('cliente_id', sql.Int, titular_id)
                .input('fecha_ingreso', sql.Date, fecha_ingreso || null)
                .input('fecha_salida', sql.Date, fecha_salida || null)
                .input('total', sql.Decimal(10,2), total || null)
                .input('medio_pago_id', sql.Int, medio_pago_id || null)
                .input('valor_cobrado', sql.Decimal(10,2), valor_cobrado || null)
                .input('notas', sql.NVarChar(sql.MAX), notas || null)
                .input('estado', sql.VarChar, estado || old_estado)
                .input('usuario', sql.VarChar, req.userName)
                .query(`
                    UPDATE registros SET 
                        habitacion_id = @habitacion_id,
                        cliente_id = @cliente_id,
                        fecha_ingreso = COALESCE(@fecha_ingreso, fecha_ingreso),
                        fecha_salida = COALESCE(@fecha_salida, fecha_salida),
                        total = COALESCE(@total, total),
                        medio_pago_id = @medio_pago_id,
                        valor_cobrado = COALESCE(@valor_cobrado, valor_cobrado),
                        notas = @notas,
                        estado = @estado,
                        UsuarioModificacion = @usuario,
                        FechaModificacion = GETDATE()
                    WHERE id = @id
                `);

            await transaction.commit();
            res.json({ message: 'Registro actualizado con éxito' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
