const Venta = require('../models/Venta');
const Producto = require('../models/Producto');

exports.getVentas = async (req, res) => {
    try {
        const ventas = await Venta.find()
            .populate('empleado', 'nombre')
            .sort({ fecha: -1 });
        
        const formatted = ventas.map(v => ({
            ...v._doc,
            empleado: v.empleado ? v.empleado.nombre : 'Sistema'
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVentaDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const venta = await Venta.findById(id).populate('items.producto');
        if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
        
        const details = venta.items.map(item => ({
            producto_id: item.producto ? item.producto._id : null,
            producto_nombre: item.productoNombre,
            cantidad: item.cantidad,
            precio: item.precioUnitario,
            subtotal: item.subtotal
        }));
        res.json(details);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createVenta = async (req, res) => {
    try {
        const { productos, total, medio_pago_id, registro_id } = req.body;

        const session = await Venta.startSession();
        session.startTransaction();

        try {
            const items = [];
            for (let p of productos) {
                // Actualizar stock atómicamente
                const prod = await Producto.findById(p.id).session(session);
                if (!prod) throw new Error(`Producto ${p.id} no encontrado`);
                
                prod.stock -= p.cantidad;
                await prod.save({ session });

                items.push({
                    producto: p.id,
                    productoNombre: p.nombre,
                    cantidad: p.cantidad,
                    precioUnitario: p.precio,
                    subtotal: p.subtotal
                });
            }

            const newVenta = new Venta({
                empleado: req.userId,
                registro: registro_id,
                items,
                total,
                medioPago: medio_pago_id, // Aquí podrías mapear el ID a nombre si prefieres
                usuarioCreacion: req.userName
            });

            await newVenta.save({ session });
            await session.commitTransaction();
            res.status(201).json({ message: 'Venta registrada con éxito', ventaId: newVenta._id });
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// ... (Otros métodos se adaptarían de forma similar usando sesiones de Mongoose)


exports.createConsumoHabitacion = async (req, res) => {
    try {
        const { registro_id, productos } = req.body;
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (let prod of productos) {
                const total = prod.cantidad * prod.precio;
                
                // Insertar consumo
                await transaction.request()
                    .input('registro_id', sql.Int, registro_id)
                    .input('producto_id', sql.Int, prod.id)
                    .input('cantidad', sql.Int, prod.cantidad)
                    .input('precio_unitario', sql.Decimal(10,2), prod.precio)
                    .input('total', sql.Decimal(10,2), total)
                    .input('usuario_id', sql.Int, req.userId)
                    .input('usuario', sql.VarChar, req.userName)
                    .query('INSERT INTO consumos_habitacion (registro_id, producto_id, cantidad, precio_unitario, total, usuario_id, UsuarioCreacion) VALUES (@registro_id, @producto_id, @cantidad, @precio_unitario, @total, @usuario_id, @usuario)');
                
                // Actualizar stock
                await transaction.request()
                    .input('producto_id', sql.Int, prod.id)
                    .input('cantidad', sql.Int, prod.cantidad)
                    .input('usuario', sql.VarChar, req.userName)
                    .query('UPDATE productos SET stock = stock - @cantidad, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @producto_id');
                
                // Movimiento inventario
                await transaction.request()
                    .input('producto_id', sql.Int, prod.id)
                    .input('tipo', sql.VarChar, 'salida')
                    .input('cantidad', sql.Int, prod.cantidad)
                    .input('motivo', sql.VarChar, 'consumo_habitacion')
                    .input('usuario_id', sql.Int, req.userId)
                    .input('usuario', sql.VarChar, req.userName)
                    .query('INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, motivo, usuario_id, UsuarioCreacion) VALUES (@producto_id, @tipo, @cantidad, @motivo, @usuario_id, @usuario)');
            }

            await transaction.commit();
            res.status(201).json({ message: 'Consumo cargado a la habitación con éxito' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getConsumosByRegistro = async (req, res) => {
    try {
        const { registro_id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('registro_id', sql.Int, registro_id)
            .query(`
                SELECT c.producto_id, c.cantidad, c.precio_unitario as precio, p.nombre as producto_nombre, c.fecha
                FROM consumos_habitacion c
                JOIN productos p ON c.producto_id = p.id
                WHERE c.registro_id = @registro_id
                UNION ALL
                SELECT dv.producto_id, dv.cantidad, dv.precio_unitario as precio, p.nombre as producto_nombre, v.fecha
                FROM detalle_ventas dv
                JOIN ventas v ON dv.venta_id = v.id
                JOIN productos p ON dv.producto_id = p.id
                WHERE v.registro_id = @registro_id
                ORDER BY fecha DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { productos, total, medio_pago_id } = req.body;

        if (!productos || productos.length === 0) {
            return res.status(400).json({ message: 'La venta debe tener al menos un producto' });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Obtener detalles actuales para revertir el stock
            const oldDetails = await transaction.request()
                .input('venta_id', sql.Int, id)
                .query('SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = @venta_id');

            // 2. Revertir stock de los productos anteriores
            for (let old of oldDetails.recordset) {
                await transaction.request()
                    .input('producto_id', sql.Int, old.producto_id)
                    .input('cantidad', sql.Int, old.cantidad)
                    .input('usuario', sql.VarChar, req.userName)
                    .query('UPDATE productos SET stock = stock + @cantidad, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @producto_id');
            }

            // 3. Eliminar detalles anteriores
            await transaction.request()
                .input('venta_id', sql.Int, id)
                .query('DELETE FROM detalle_ventas WHERE venta_id = @venta_id');

            // 4. Insertar nuevos detalles y descontar stock
            for (let prod of productos) {
                await transaction.request()
                    .input('venta_id', sql.Int, id)
                    .input('producto_id', sql.Int, prod.id)
                    .input('cantidad', sql.Int, prod.cantidad)
                    .input('precio_unitario', sql.Decimal(10,2), prod.precio)
                    .input('subtotal', sql.Decimal(10,2), prod.subtotal)
                    .input('usuario', sql.VarChar, req.userName)
                    .query('INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal, UsuarioCreacion) VALUES (@venta_id, @producto_id, @cantidad, @precio_unitario, @subtotal, @usuario)');

                await transaction.request()
                    .input('producto_id', sql.Int, prod.id)
                    .input('cantidad', sql.Int, prod.cantidad)
                    .input('usuario', sql.VarChar, req.userName)
                    .query('UPDATE productos SET stock = stock - @cantidad, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @producto_id');
            }

            // 5. Actualizar venta principal
            await transaction.request()
                .input('id', sql.Int, id)
                .input('total', sql.Decimal(10,2), total)
                .input('medio_pago_id', sql.Int, medio_pago_id || null)
                .input('usuario', sql.VarChar, req.userName)
                .query('UPDATE ventas SET total = @total, medio_pago_id = @medio_pago_id, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @id');

            await transaction.commit();
            res.json({ message: 'Venta actualizada con éxito' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
