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

exports.getResumenGeneral = async (req, res) => {
    try {
        const hab_disponibles = await Habitacion.countDocuments({ estado: { $regex: /disponible/i } });
        const hab_ocupadas = await Habitacion.countDocuments({ estado: { $regex: /ocupada/i } });
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

        const egresos_hoy_res = await Gasto.aggregate([
            { $match: { fecha: { $gte: hoy, $lt: mañana } } },
            { $group: { _id: null, total: { $sum: "$monto" } } }
        ]);
        const egresos_hoy = egresos_hoy_res[0] ? egresos_hoy_res[0].total : 0;

        const recientes_registros = await Registro.find().populate('cliente').populate('habitacion').sort({ fechaCreacion: -1 }).limit(5);
        const recientes_ventas = await Venta.find().populate('empleado').sort({ fecha: -1 }).limit(5);

        res.json({
            hab_disponibles,
            hab_ocupadas,
            alertas_stock,
            registros_hoy,
            ventas_hoy,
            ingresos_hoy: ventas_hoy, // Simplificado
            egresos_hoy,
            recientes: {
                registros: recientes_registros,
                ventas: recientes_ventas
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
