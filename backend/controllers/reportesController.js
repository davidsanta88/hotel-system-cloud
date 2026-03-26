const Venta = require('../models/Venta');
const Registro = require('../models/Registro');
const Gasto = require('../models/Gasto');
const Habitacion = require('../models/Habitacion');
const Producto = require('../models/Producto');

exports.getReporteVentas = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const filter = {};
        if (inicio || fin) {
            filter.fecha = {};
            if (inicio) filter.fecha.$gte = new Date(inicio);
            if (fin) filter.fecha.$lte = new Date(fin + 'T23:59:59');
        }

        const report = await Venta.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
                    gran_total: { $sum: "$total" },
                    num_ventas: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { fecha: "$_id", gran_total: 1, num_ventas: 1, _id: 0 } }
        ]);

        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductosMasVendidos = async (req, res) => {
    try {
        const result = await Venta.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.producto",
                    nombre: { $first: "$items.productoNombre" },
                    total_vendido: { $sum: "$items.cantidad" },
                    total_recaudado: { $sum: "$items.subtotal" }
                }
            },
            { $sort: { total_vendido: -1 } },
            { $limit: 10 }
        ]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const EstadoHabitacion = require('../models/EstadoHabitacion');

exports.getResumenGeneral = async (req, res) => {
    try {
        // Resolver IDs de estados para conteo preciso
        const estadoLimpia = await EstadoHabitacion.findOne({ nombre: { $regex: /limpia|disponible/i } });
        const estadoOcupada = await EstadoHabitacion.findOne({ nombre: { $regex: /ocupada/i } });

        const hab_disponibles = estadoLimpia ? await Habitacion.countDocuments({ estado: estadoLimpia._id }) : 0;
        const hab_ocupadas = estadoOcupada ? await Habitacion.countDocuments({ estado: estadoOcupada._id }) : 0;
        const alertas_stock = await Producto.countDocuments({ $expr: { $lte: ["$stock", "$stockMinimo"] } });
        
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        const mañana = new Date(hoy);
        mañana.setDate(hoy.getDate() + 1);

        const registros_hoy = await Registro.countDocuments({ fechaCreacion: { $gte: hoy, $lt: mañana } });
        
        const ventas_hoy_res = await Venta.aggregate([
            { $match: { fecha: { $gte: hoy, $lt: mañana } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        const ventas_hoy = ventas_hoy_res[0] ? ventas_hoy_res[0].total : 0;

        // Sumar pagos de registros realizados hoy
        const pagos_hospedaje_hoy = await Registro.aggregate([
            { $unwind: "$pagos" },
            { $match: { "pagos.fecha": { $gte: hoy, $lt: mañana } } },
            { $group: { _id: null, total: { $sum: "$pagos.monto" } } }
        ]);
        const pagos_hoy = pagos_hospedaje_hoy[0] ? pagos_hospedaje_hoy[0].total : 0;

        const egresos_hoy_res = await Gasto.aggregate([
            { $match: { fecha: { $gte: hoy, $lt: mañana } } },
            { $group: { _id: null, total: { $sum: "$monto" } } }
        ]);
        const egresos_hoy = egresos_hoy_res[0] ? egresos_hoy_res[0].total : 0;

        const recientes_registros = await Registro.find()
            .populate('cliente')
            .populate('habitacion')
            .sort({ fechaCreacion: -1 })
            .limit(5);

        const recientes_ventas = await Venta.find()
            .populate('empleado')
            .sort({ fecha: -1 })
            .limit(5);

        // Mapeo para el frontend del dashboard
        const mapped_registros = recientes_registros.map(r => ({
            id: r._id,
            cliente: r.cliente?.nombre || 'Huésped',
            habitacion: r.habitacion?.numero || 'S/N',
            fecha: r.fechaCreacion || r.fechaEntrada,
            estado: r.estado === 'activo' ? 'CHECK-IN' : r.estado.toUpperCase()
        }));

        const mapped_ventas = recientes_ventas.map(v => ({
            id: v._id,
            empleado: v.empleado?.nombre || v.usuarioCreacion || 'Personal',
            total: v.total,
            fecha: v.fecha
        }));

        res.json({
            hab_disponibles,
            hab_ocupadas,
            alertas_stock,
            registros_hoy,
            ventas_hoy,
            ingresos_hoy: ventas_hoy + pagos_hoy,
            egresos_hoy,
            recientes: {
                registros: mapped_registros,
                ventas: mapped_ventas
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getGastosPorPeriodo = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const filter = {};
        if (inicio || fin) {
            filter.fecha = {};
            if (inicio) filter.fecha.$gte = new Date(inicio);
            if (fin) filter.fecha.$lte = new Date(fin + 'T23:59:59');
        }

        const report = await Gasto.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
                    total: { $sum: "$monto" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getGastosPorCategoria = async (req, res) => {
    try {
        const report = await Gasto.aggregate([
            {
                $group: {
                    _id: "$categoria",
                    total: { $sum: "$monto" }
                }
            },
            { $sort: { total: -1 } }
        ]);
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVentasMensuales = async (req, res) => {
    try {
        const report = await Venta.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$fecha" } },
                    total: { $sum: "$total" }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getIngresosHospedaje = async (req, res) => {
    try {
        const report = await Registro.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$fechaCreacion" } },
                    total: { $sum: "$total" }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

