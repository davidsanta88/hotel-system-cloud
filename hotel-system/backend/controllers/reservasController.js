const sql = require('mssql');
const { poolPromise } = require('../config/db');

exports.getAllReservas = async (req, res) => {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                r.id, r.cliente_id, c.nombre AS cliente_nombre, c.documento as identificacion, c.telefono,
                r.numero_personas, r.valor_total, r.valor_abonado, 
                r.fecha_entrada, r.fecha_salida, r.estado, r.FechaCreacion,
                (
                    SELECT h.numero, h.tipo_id, rh.habitacion_id, rh.precio_acordado
                    FROM reservas_habitaciones rh
                    JOIN habitaciones h ON h.id = rh.habitacion_id
                    WHERE rh.reserva_id = r.id
                    FOR JSON PATH
                ) as habitaciones
            FROM reservas r
            JOIN clientes c ON c.id = r.cliente_id
            ORDER BY r.fecha_entrada DESC
        `;
        const result = await pool.request().query(query);
        
        const reservas = result.recordset.map(row => ({
            ...row,
            habitaciones: row.habitaciones ? JSON.parse(row.habitaciones) : []
        }));

        res.json(reservas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createReserva = async (req, res) => {
    try {
        const { cliente_id, habitaciones, fecha_entrada, fecha_salida, numero_personas, valor_total, valor_abonado } = req.body;
        const usuario_id = req.userId; // Provided by Auth middleware

        if (!cliente_id || !habitaciones || !habitaciones.length || !fecha_entrada || !fecha_salida) {
            return res.status(400).json({ message: 'Faltan datos requeridos (Cliente, Habitaciones o Fechas)' });
        }

        const pool = await poolPromise;

        // Overlapping Logic:
        // A reserved block C overlaps with new block N if: (N.entrada < C.salida) AND (N.salida > C.entrada)
        const checkQuery = `
            SELECT r.id, h.numero 
            FROM reservas r
            JOIN reservas_habitaciones rh ON r.id = rh.reserva_id
            JOIN habitaciones h ON h.id = rh.habitacion_id
            WHERE rh.habitacion_id IN (${habitaciones.map(h => parseInt(h.id)).join(',')})
            AND r.estado != 'Cancelada'
            AND r.fecha_entrada < @fecha_salida
            AND r.fecha_salida > @fecha_entrada
        `;
        
        const requestCheck = pool.request();
        requestCheck.input('fecha_entrada', sql.Date, fecha_entrada);
        requestCheck.input('fecha_salida', sql.Date, fecha_salida);
        const checkResult = await requestCheck.query(checkQuery);

        if (checkResult.recordset.length > 0) {
            // Distinct list of rooms that overlapped
            const cruzadas = [...new Set(checkResult.recordset.map(r => r.numero))].join(', ');
            return res.status(400).json({ 
                message: `Conflicto de fechas: Las habitaciones [${cruzadas}] ya están reservadas parcial o totalmente en esos días.` 
            });
        }

        // Transaction to ensure atomicity
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const reqReserva = new sql.Request(transaction);
            reqReserva.input('cliente_id', sql.Int, cliente_id);
            reqReserva.input('numero_personas', sql.Int, numero_personas || 1);
            reqReserva.input('valor_total', sql.Decimal(10,2), valor_total || 0);
            reqReserva.input('valor_abonado', sql.Decimal(10,2), valor_abonado || 0);
            reqReserva.input('fecha_entrada', sql.Date, fecha_entrada);
            reqReserva.input('fecha_salida', sql.Date, fecha_salida);
            reqReserva.input('usuario_id', sql.Int, usuario_id);

            const insertReservaQuery = `
                INSERT INTO reservas (cliente_id, numero_personas, valor_total, valor_abonado, fecha_entrada, fecha_salida, usuario_id)
                OUTPUT inserted.id
                VALUES (@cliente_id, @numero_personas, @valor_total, @valor_abonado, @fecha_entrada, @fecha_salida, @usuario_id)
            `;
            
            const reservaResult = await reqReserva.query(insertReservaQuery);
            const reserva_id = reservaResult.recordset[0].id;

            // Details N:M
            for (let hab of habitaciones) {
                const reqHab = new sql.Request(transaction);
                reqHab.input('reserva_id', sql.Int, reserva_id);
                reqHab.input('habitacion_id', sql.Int, hab.id);
                reqHab.input('precio_acordado', sql.Decimal(10,2), hab.precio || 0);
                await reqHab.query(`INSERT INTO reservas_habitaciones (reserva_id, habitacion_id, precio_acordado) VALUES (@reserva_id, @habitacion_id, @precio_acordado)`);
            }

            await transaction.commit();
            res.status(201).json({ message: 'Reserva creada exitosamente', id: reserva_id });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error("Create reserva err", err);
        res.status(500).json({ message: err.message });
    }
};

exports.updateReservaStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        if (!['Pendiente', 'Confirmada', 'Cancelada', 'Concluida'].includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido.' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('estado', sql.VarChar(50), estado)
            .query('UPDATE reservas SET estado = @estado WHERE id = @id');
        
        if (result.rowsAffected[0] === 0) {
             return res.status(404).json({ message: 'Reserva no encontrada.' });
        }
        res.json({ message: 'El estado de la reserva ha sido actualizado con éxito.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const { cliente_id, habitaciones, fecha_entrada, fecha_salida, numero_personas, valor_total, valor_abonado } = req.body;
        const usuario_id = req.userId;

        if (!cliente_id || !habitaciones || !habitaciones.length || !fecha_entrada || !fecha_salida) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        const pool = await poolPromise;

        // Check for overlaps excluding current reservation
        const checkQuery = `
            SELECT r.id, h.numero 
            FROM reservas r
            JOIN reservas_habitaciones rh ON r.id = rh.reserva_id
            JOIN habitaciones h ON h.id = rh.habitacion_id
            WHERE rh.habitacion_id IN (${habitaciones.map(h => parseInt(h.id)).join(',')})
            AND r.estado != 'Cancelada'
            AND r.id != @reserva_id
            AND r.fecha_entrada < @fecha_salida
            AND r.fecha_salida > @fecha_entrada
        `;
        
        const requestCheck = pool.request();
        requestCheck.input('reserva_id', sql.Int, id);
        requestCheck.input('fecha_entrada', sql.Date, fecha_entrada);
        requestCheck.input('fecha_salida', sql.Date, fecha_salida);
        const checkResult = await requestCheck.query(checkQuery);

        if (checkResult.recordset.length > 0) {
            const cruzadas = [...new Set(checkResult.recordset.map(r => r.numero))].join(', ');
            return res.status(400).json({ 
                message: `Conflicto de fechas: Las habitaciones [${cruzadas}] tienen otra reserva en ese rango.` 
            });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Update main Reserva
            const reqReserva = new sql.Request(transaction);
            reqReserva.input('id', sql.Int, id);
            reqReserva.input('cliente_id', sql.Int, cliente_id);
            reqReserva.input('numero_personas', sql.Int, numero_personas || 1);
            reqReserva.input('valor_total', sql.Decimal(10,2), valor_total || 0);
            reqReserva.input('valor_abonado', sql.Decimal(10,2), valor_abonado || 0);
            reqReserva.input('fecha_entrada', sql.Date, fecha_entrada);
            reqReserva.input('fecha_salida', sql.Date, fecha_salida);

            await reqReserva.query(`
                UPDATE reservas 
                SET cliente_id = @cliente_id, 
                    numero_personas = @numero_personas, 
                    valor_total = @valor_total, 
                    valor_abonado = @valor_abonado, 
                    fecha_entrada = @fecha_entrada, 
                    fecha_salida = @fecha_salida
                WHERE id = @id
            `);

            // 2. Refresh rooms (Delete and Insert)
            const reqDel = new sql.Request(transaction);
            reqDel.input('reserva_id', sql.Int, id);
            await reqDel.query(`DELETE FROM reservas_habitaciones WHERE reserva_id = @reserva_id`);

            for (let hab of habitaciones) {
                const reqHab = new sql.Request(transaction);
                reqHab.input('reserva_id', sql.Int, id);
                reqHab.input('habitacion_id', sql.Int, hab.id);
                reqHab.input('precio_acordado', sql.Decimal(10,2), hab.precio_acordado || hab.precio || 0);
                await reqHab.query(`INSERT INTO reservas_habitaciones (reserva_id, habitacion_id, precio_acordado) VALUES (@reserva_id, @habitacion_id, @precio_acordado)`);
            }

            await transaction.commit();
            res.json({ message: 'Reserva actualizada exitosamente' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error("Update reserva err", err);
        res.status(500).json({ message: err.message });
    }
};
