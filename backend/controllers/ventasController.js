const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Registro = require('../models/Registro');

exports.getVentas = async (req, res) => {
    try {
        const ventas = await Venta.find()
            .populate('empleado', 'nombre')
            .sort({ fecha: -1 });
        res.json(ventas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVentaDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const venta = await Venta.findById(id).populate('items.producto');
        if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
        res.json(venta.items);
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
                medioPago: medio_pago_id,
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

exports.createConsumoHabitacion = async (req, res) => {
    try {
        const { registro_id, productos } = req.body;
        // En MongoDB, los consumos pueden ir dentro de una colección 'Consumos' o dentro del mismo 'Registro'
        // Por compatibilidad con el front, creamos una "Venta" de tipo consumo asociada al registro
        const session = await Venta.startSession();
        session.startTransaction();
        try {
            const items = productos.map(p => ({
                producto: p.id,
                productoNombre: p.nombre,
                cantidad: p.cantidad,
                precioUnitario: p.precio,
                subtotal: p.cantidad * p.precio
            }));

            const total = items.reduce((acc, item) => acc + item.subtotal, 0);

            const newConsumo = new Venta({
                empleado: req.userId,
                registro: registro_id,
                items,
                total,
                medioPago: 'Cargo a Habitación',
                usuarioCreacion: req.userName
            });

            await newConsumo.save({ session });
            
            for (let p of productos) {
                await Producto.findByIdAndUpdate(p.id, { $inc: { stock: -p.cantidad } }).session(session);
            }

            await session.commitTransaction();
            res.status(201).json({ message: 'Consumo cargado a habitación con éxito' });
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

exports.getConsumosByRegistro = async (req, res) => {
    try {
        const { registro_id } = req.params;
        const ventas = await Venta.find({ registro: registro_id }).populate('items.producto');
        const consumos = [];
        ventas.forEach(v => {
            v.items.forEach(item => {
                consumos.push({
                    producto_id: item.producto ? item.producto._id : null,
                    producto_nombre: item.productoNombre,
                    cantidad: item.cantidad,
                    precio: item.precioUnitario,
                    fecha: v.fecha
                });
            });
        });
        res.json(consumos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
