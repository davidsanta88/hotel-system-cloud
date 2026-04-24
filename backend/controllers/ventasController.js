const mongoose = require('mongoose');
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Registro = require('../models/Registro');
const Cliente = require('../models/Cliente');

exports.getVentas = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const filter = {};
        
        if (inicio || fin) {
            filter.fecha = {};
            if (inicio) filter.fecha.$gte = inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`);
            if (fin) filter.fecha.$lte = fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`);
        }

        const ventas = await Venta.find(filter)
            .populate('empleado', 'nombre')
            .sort({ fecha: -1 });
        res.json(ventas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVentaById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificación robusta del ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de venta no válido' });
        }

        const venta = await Venta.findById(id)
            .populate('items.producto')
            .populate('empleado', 'nombre');
        
        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada en la base de datos' });
        }
        
        // Población manual de cliente (desde sharedConn)
        let clienteObj = null;
        if (venta.cliente) {
            clienteObj = await Cliente.findById(venta.cliente);
        }

        // Formatear para compatibilidad
        const mappedVenta = venta.toObject();
        mappedVenta.cliente = clienteObj;

        if (!mappedVenta.items || mappedVenta.items.length === 0) {
            console.warn(`[GET VENTA BY ID WARNING] Venta ${id} no tiene items en el array.`);
        }
        
        res.json(mappedVenta);
    } catch (err) {
        console.error('[GET VENTA BY ID ERROR]', err);
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

exports.updateVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Venta.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteVenta = async (req, res) => {
    try {
        const { id } = req.params;
        await Venta.findByIdAndDelete(id);
        res.json({ message: 'Venta eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

