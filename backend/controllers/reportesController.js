const Venta = require('../models/Venta');
const Registro = require('../models/Registro');
const Gasto = require('../models/Gasto');
const Habitacion = require('../models/Habitacion');
const Producto = require('../models/Producto');
const Reserva = require('../models/Reserva');
const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const CierreCaja = require('../models/CierreCaja');
const CategoriaGasto = require('../models/CategoriaGasto');
const mongoose = require('mongoose');
const moment = require('moment-timezone');

// Configuración para la conexión al Hotel Colonial
const COLONIAL_URI = 'mongodb+srv://admin:HotelColonial2026@cluster0.d1nbr5v.mongodb.net/HotelColonialDB?retryWrites=true&w=majority';

let colonialConn = null;

const getColonialConnection = async () => {
    if (colonialConn && colonialConn.readyState === 1) return colonialConn;
    colonialConn = await mongoose.createConnection(COLONIAL_URI).asPromise();
    return colonialConn;
};

const getColonialModels = async () => {
    const conn = await getColonialConnection();
    return {
        Venta: conn.models.Venta || conn.model('Venta', Venta.schema),
        Registro: conn.models.Registro || conn.model('Registro', Registro.schema),
        Gasto: conn.models.Gasto || conn.model('Gasto', Gasto.schema),
        Reserva: conn.models.Reserva || conn.model('Reserva', Reserva.schema),
        Cliente: conn.models.Cliente || conn.model('Cliente', Cliente.schema),
        Habitacion: conn.models.Habitacion || conn.model('Habitacion', Habitacion.schema),
        Usuario: conn.models.Usuario || conn.model('Usuario', Usuario.schema),
        CategoriaGasto: conn.models.CategoriaGasto || conn.model('CategoriaGasto', CategoriaGasto.schema)
    };
};

exports.getReporteVentas = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const filter = {};
        if (inicio || fin) {
            filter.fecha = {};
            if (inicio) filter.fecha.$gte = inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`);
            if (fin) filter.fecha.$lte = fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`);
        }

        const report = await Venta.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: "-05:00" } },
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
        
        // Calcular límites de hoy en hora local (Colombia -05:00)
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }); // Formato YYYY-MM-DD
        const hoy = new Date(`${dateStr}T00:00:00-05:00`);
        const mañana = new Date(`${dateStr}T23:59:59.999-05:00`);

        const registros_hoy = await Registro.countDocuments({ fechaCreacion: { $gte: hoy, $lte: mañana } });
        
        // 1. Egresos e Ingresos manuales del día (desde la colección Gasto)
        const movimientos_manuales = await Gasto.aggregate([
            { $match: { fecha: { $gte: hoy, $lte: mañana } } },
            {
                $lookup: {
                    from: 'categoriagastos',
                    localField: 'categoria',
                    foreignField: '_id',
                    as: 'catInfo'
                }
            },
            { $unwind: { path: '$catInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$catInfo.tipo',
                    total: { $sum: "$monto" }
                }
            }
        ]);

        const egresos_hoy = movimientos_manuales.find(m => m._id === 'Gasto')?.total || 0;
        const ingresos_manuales_hoy = movimientos_manuales.find(m => m._id === 'Ingreso')?.total || 0;

        const ventas_hoy_res = await Venta.aggregate([
            { $match: { fecha: { $gte: hoy, $lt: mañana } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        const ventas_hoy = ventas_hoy_res[0] ? ventas_hoy_res[0].total : 0;

        // Sumar pagos de registros recibidos hoy (Caja Real)
        const pagos_hospedaje_hoy = await Registro.aggregate([
            { $unwind: "$pagos" },
            { $match: { "pagos.fecha": { $gte: hoy, $lt: mañana } } },
            { $group: { _id: null, total: { $sum: "$pagos.monto" } } }
        ]);
        const pagos_hoy = pagos_hospedaje_hoy[0] ? pagos_hospedaje_hoy[0].total : 0;

        const ingresos_hoy = ventas_hoy + pagos_hoy + ingresos_manuales_hoy;

        const recientes_registros = await Registro.find()
            .populate('habitacion')
            .sort({ fechaCreacion: -1 })
            .limit(5);

        // Población manual de clientes para registros recientes
        const clienteIdsRecientes = [...new Set(recientes_registros.map(r => r.cliente).filter(id => id))];
        const clientesRecientes = await Cliente.find({ _id: { $in: clienteIdsRecientes } });
        const clienteMapRecientes = new Map(clientesRecientes.map(c => [c._id.toString(), c]));

        const recientes_ventas = await Venta.find()
            .populate('empleado')
            .sort({ fecha: -1 })
            .limit(5);

        // Mapeo para el frontend del dashboard
        const mapped_registros = recientes_registros.map(r => {
            const clienteObj = r.cliente ? clienteMapRecientes.get(r.cliente.toString()) : null;
            return {
                id: r._id,
                cliente: clienteObj?.nombre || 'Huésped',
                habitacion: r.habitacion?.numero || 'S/N',
                fecha: r.fechaCreacion || r.fechaEntrada,
                estado: r.estado === 'activo' ? 'CHECK-IN' : r.estado.toUpperCase()
            };
        });

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
            ingresos_hoy,
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
            if (inicio) filter.fecha.$gte = inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`);
            if (fin) filter.fecha.$lte = fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`);
        }

        const report = await Gasto.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'categoriagastos',
                    localField: 'categoria',
                    foreignField: '_id',
                    as: 'catInfo'
                }
            },
            { $unwind: { path: '$catInfo', preserveNullAndEmptyArrays: true } },
            { $match: { 'catInfo.tipo': { $ne: 'Ingreso' } } }, // Por defecto si no hay tipo se asume Gasto o se filtra Ingreso
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: "-05:00" } },
                    total_gastos: { $sum: "$monto" },
                    num_gastos: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { fecha: "$_id", total_gastos: 1, num_gastos: 1, _id: 0 } }
        ]);
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getIngresosManualesPorPeriodo = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const filter = {};
        if (inicio || fin) {
            filter.fecha = {};
            if (inicio) filter.fecha.$gte = inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`);
            if (fin) filter.fecha.$lte = fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`);
        }

        const report = await Gasto.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'categoriagastos',
                    localField: 'categoria',
                    foreignField: '_id',
                    as: 'catInfo'
                }
            },
            { $unwind: { path: '$catInfo', preserveNullAndEmptyArrays: true } },
            { $match: { 'catInfo.tipo': 'Ingreso' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: "-05:00" } },
                    total_ingresos: { $sum: "$monto" },
                    num_ingresos: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { fecha: "$_id", total_ingresos: 1, num_ingresos: 1, _id: 0 } }
        ]);
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getGastosPorCategoria = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const filter = {};
        if (inicio || fin) {
            filter.fecha = {};
            if (inicio) filter.fecha.$gte = inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`);
            if (fin) filter.fecha.$lte = fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`);
        }

        const report = await Gasto.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'categoriagastos',
                    localField: 'categoria',
                    foreignField: '_id',
                    as: 'catInfo'
                }
            },
            { $unwind: { path: '$catInfo', preserveNullAndEmptyArrays: true } },
            { $match: { 'catInfo.tipo': { $ne: 'Ingreso' } } },
            {
                $group: {
                    _id: { $ifNull: ["$catInfo.nombre", "Sin Categoría"] },
                    total: { $sum: "$monto" },
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } },
            { $project: { categoria: "$_id", total: 1, cantidad: 1, _id: 0 } }
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
                    _id: { $dateToString: { format: "%Y-%m", date: "$fecha", timezone: "-05:00" } },
                    total_ventas: { $sum: "$total" }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 6 }
        ]);

        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const mapped = report.map(r => {
            const [year, month] = r._id.split('-');
            return {
                mes: r._id,
                mes_nombre: `${meses[parseInt(month)-1]} ${year.slice(2)}`,
                total_ventas: r.total_ventas
            };
        });

        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getIngresosHospedaje = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const filter = {};
        if (inicio || fin) {
            filter["pagos.fecha"] = {};
            if (inicio) filter["pagos.fecha"].$gte = inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`);
            if (fin) filter["pagos.fecha"].$lte = fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`);
        }

        const report = await Registro.aggregate([
            { $unwind: "$pagos" },
            { $match: filter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$pagos.fecha", timezone: "-05:00" } },
                    total_hospedaje: { $sum: "$pagos.monto" }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { fecha: "$_id", total_hospedaje: 1, _id: 0 } }
        ]);
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getDetalleIngresos = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        let startDate = inicio ? (inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`)) : new Date();
        if (!inicio) startDate.setHours(0,0,0,0);
        
        let endDate = fin ? (fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`)) : new Date();
        if (!fin) endDate.setHours(23,59,59,999);

        // 1. Pagos de Registros (Hospedajes)
        const pagosRegistros = await Registro.find({
            "pagos.fecha": { $gte: startDate, $lte: endDate }
        }).populate('habitacion', 'numero');

        // 2. Abonos de Reservas
        const abonosReservas = await Reserva.find({
            "abonos.fecha": { $gte: startDate, $lte: endDate }
        });

        // Población manual de clientes
        const allClienteIds = [
            ...pagosRegistros.map(r => r.cliente),
            ...abonosReservas.map(r => r.cliente)
        ].filter(id => id);
        const uniqueClienteIds = [...new Set(allClienteIds.map(id => id.toString()))];
        const clientesCuadre = await Cliente.find({ _id: { $in: uniqueClienteIds } });
        const clienteMapCuadre = new Map(clientesCuadre.map(c => [c._id.toString(), c]));

        let ingresos = [];

        pagosRegistros.forEach(reg => {
            const clienteObj = reg.cliente ? clienteMapCuadre.get(reg.cliente.toString()) : null;
            reg.pagos.forEach(pago => {
                if (pago.fecha >= startDate && pago.fecha <= endDate) {
                    ingresos.push({
                        fecha: pago.fecha,
                        tipo: 'HOSPEDAJE',
                        descripcion: `Pago Hab ${reg.habitacion?.numero || '-'} - ${clienteObj?.nombre || 'PARTICULAR'}`,
                        detalle: `Folio: ${reg.folio || '-'} | Hab: ${reg.habitacion?.numero || '-'}`,
                        usuario: pago.usuario_nombre || reg.usuarioCreacion,
                        medioPago: (pago.medio || 'EFECTIVO').toUpperCase(),
                        monto: pago.monto
                    });
                }
            });
        });

        abonosReservas.forEach(reserva => {
            const clienteObj = reserva.cliente ? clienteMapCuadre.get(reserva.cliente.toString()) : null;
            reserva.abonos.forEach(abono => {
                if (abono.fecha >= startDate && abono.fecha <= endDate) {
                    ingresos.push({
                        fecha: abono.fecha,
                        tipo: 'RESERVA',
                        descripcion: `Abono Reserva - ${clienteObj?.nombre || 'Cliente'}`,
                        detalle: `Referencia: ${reserva.codigoReserva || '-'}`,
                        usuario: abono.usuario_nombre || reserva.usuarioCreacion,
                        medioPago: (abono.medio_pago || 'EFECTIVO').toUpperCase(),
                        monto: abono.monto
                    });
                }
            });
        });

        // 3. Ventas de Productos
        const ventas = await Venta.find({
            fecha: { $gte: startDate, $lte: endDate }
        }).populate('items.producto', 'nombre').populate('empleado', 'nombre');

        ventas.forEach(venta => {
            ingresos.push({
                fecha: venta.fecha,
                tipo: 'VENTA',
                descripcion: `Venta de productos`,
                detalle: venta.items?.map(i => `${i.cantidad}x ${i.producto?.nombre || 'Prod'}`).join(', ') || '-',
                usuario: venta.empleado?.nombre || venta.usuarioCreacion,
                medioPago: (venta.medioPago || 'EFECTIVO').toUpperCase(),
                monto: venta.total
            });
        });

        // 4. Gastos e Ingresos manuales
        const movimientos = await Gasto.find({
            fecha: { $gte: startDate, $lte: endDate }
        }).populate('categoria').populate('usuario', 'nombre');

        movimientos.forEach(mov => {
            const esIngreso = mov.categoria?.tipo === 'Ingreso';
            ingresos.push({
                fecha: mov.fecha,
                tipo: esIngreso ? 'INGRESO MANUAL' : 'GASTO',
                descripcion: mov.descripcion,
                detalle: `${mov.categoria?.nombre || 'General'}${mov.nota ? ' - ' + mov.nota : ''}`,
                usuario: mov.usuario?.nombre || 'Sistema',
                medioPago: (mov.medioPago || 'EFECTIVO').toUpperCase(),
                monto: esIngreso ? mov.monto : -mov.monto
            });
        });

        // Ordenar por fecha desc
        ingresos.sort((a, b) => b.fecha - a.fecha);

        res.json(ingresos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getDetalleIngresosConsolidado = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        let startDate = inicio ? (inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`)) : new Date();
        if (!inicio) startDate.setHours(0,0,0,0);
        
        let endDate = fin ? (fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`)) : new Date();
        if (!fin) endDate.setHours(23,59,59,999);

        // Helper function to fetch from a set of models
        const fetchFromModels = async (models, hotelLabel) => {
            const { Registro, Reserva, Venta, Gasto, Cliente } = models;

            // 1. Pagos de Registros
            const pagosRegistros = await Registro.find({
                "pagos.fecha": { $gte: startDate, $lte: endDate }
            }).populate('habitacion', 'numero');

            // 2. Abonos de Reservas
            const abonosReservas = await Reserva.find({
                "abonos.fecha": { $gte: startDate, $lte: endDate }
            });

            // Clientes
            const allClienteIds = [
                ...pagosRegistros.map(r => r.cliente),
                ...abonosReservas.map(r => r.cliente)
            ].filter(id => id);
            const uniqueClienteIds = [...new Set(allClienteIds.map(id => id.toString()))];
            const clientes = await Cliente.find({ _id: { $in: uniqueClienteIds } });
            const clienteMap = new Map(clientes.map(c => [c._id.toString(), c]));

            let localIngresos = [];

            pagosRegistros.forEach(reg => {
                const clienteObj = reg.cliente ? clienteMap.get(reg.cliente.toString()) : null;
                reg.pagos.forEach(pago => {
                    if (pago.fecha >= startDate && pago.fecha <= endDate) {
                        localIngresos.push({
                            fecha: pago.fecha,
                            tipo: 'HOSPEDAJE',
                            descripcion: `Pago Hab ${reg.habitacion?.numero || '-'} - ${clienteObj?.nombre || 'PARTICULAR'}`,
                            detalle: `Folio: ${reg.folio || '-'} | Hab: ${reg.habitacion?.numero || '-'}`,
                            usuario: pago.usuario_nombre || reg.usuarioCreacion,
                            medioPago: (pago.medio || 'EFECTIVO').toUpperCase(),
                            monto: pago.monto,
                            hotel: hotelLabel,
                            id_ref: reg._id
                        });
                    }
                });
            });

            abonosReservas.forEach(reserva => {
                const clienteObj = reserva.cliente ? clienteMap.get(reserva.cliente.toString()) : null;
                reserva.abonos.forEach(abono => {
                    if (abono.fecha >= startDate && abono.fecha <= endDate) {
                        localIngresos.push({
                            fecha: abono.fecha,
                            tipo: 'RESERVA',
                            descripcion: `Abono Reserva - ${clienteObj?.nombre || 'Cliente'}`,
                            detalle: `Referencia: ${reserva.codigoReserva || '-'}`,
                            usuario: abono.usuario_nombre || reserva.usuarioCreacion,
                            medioPago: (abono.medio_pago || 'EFECTIVO').toUpperCase(),
                            monto: abono.monto,
                            hotel: hotelLabel,
                            id_ref: reserva._id
                        });
                    }
                });
            });

            // 3. Ventas
            const ventas = await Venta.find({
                fecha: { $gte: startDate, $lte: endDate }
            }).populate('empleado', 'nombre').populate('items.producto', 'nombre');

            ventas.forEach(venta => {
                localIngresos.push({
                    fecha: venta.fecha,
                    tipo: 'VENTA',
                    descripcion: `Venta de productos`,
                    detalle: venta.items?.map(i => `${i.cantidad}x ${i.producto?.nombre || 'Prod'}`).join(', ') || '-',
                    usuario: venta.empleado?.nombre || venta.usuarioCreacion,
                    medioPago: (venta.medioPago || 'EFECTIVO').toUpperCase(),
                    monto: venta.total,
                    hotel: hotelLabel
                });
            });

            // 4. Gastos e Ingresos manuales
            const movimientos = await Gasto.find({
                fecha: { $gte: startDate, $lte: endDate }
            }).populate('categoria').populate('usuario', 'nombre');

            movimientos.forEach(mov => {
                const esIngreso = mov.categoria?.tipo === 'Ingreso';
                localIngresos.push({
                    fecha: mov.fecha,
                    tipo: esIngreso ? 'INGRESO MANUAL' : 'GASTO',
                    descripcion: mov.descripcion,
                    detalle: `${mov.categoria?.nombre || 'General'}${mov.nota ? ' - ' + mov.nota : ''}`,
                    usuario: mov.usuario?.nombre || 'Sistema',
                    medioPago: (mov.medioPago || 'EFECTIVO').toUpperCase(),
                    monto: esIngreso ? mov.monto : -mov.monto,
                    hotel: hotelLabel
                });
            });

            return localIngresos;
        };

        // Fetch Plaza
        const plazaIngresos = await fetchFromModels({ Registro, Reserva, Venta, Gasto, Cliente }, 'Hotel Plaza');

        // Fetch Colonial
        const colonialModels = await getColonialModels();
        const colonialIngresos = await fetchFromModels(colonialModels, 'Hotel Colonial');

        // Combine and sort
        const allIngresos = [...plazaIngresos, ...colonialIngresos].sort((a, b) => b.fecha - a.fecha);

        res.json(allIngresos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCuadreCaja = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        // Map string to exact local boundaries to prevent UTC mismatch
        let startDate = inicio ? (inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`)) : new Date();
        if (!inicio) startDate.setHours(0,0,0,0);
        
        let endDate = fin ? (fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`)) : new Date();
        if (!fin) endDate.setHours(23,59,59,999);

        // 1. Pagos de Registros (Hospedajes)
        const pagosRegistros = await Registro.find({
            "pagos.fecha": { $gte: startDate, $lte: endDate }
        }).populate('habitacion', 'numero');

        // 2. Abonos de Reservas
        const abonosReservas = await Reserva.find({
            "abonos.fecha": { $gte: startDate, $lte: endDate }
        });

        // Población manual de clientes para Cuadre
        const allClienteIds = [
            ...pagosRegistros.map(r => r.cliente),
            ...abonosReservas.map(r => r.cliente)
        ].filter(id => id);
        const uniqueClienteIds = [...new Set(allClienteIds.map(id => id.toString()))];
        const clientesCuadre = await Cliente.find({ _id: { $in: uniqueClienteIds } });
        const clienteMapCuadre = new Map(clientesCuadre.map(c => [c._id.toString(), c]));

        let transacciones = [];

        pagosRegistros.forEach(reg => {
            const clienteObj = reg.cliente ? clienteMapCuadre.get(reg.cliente.toString()) : null;
            reg.pagos.forEach(pago => {
                if (pago.fecha >= startDate && pago.fecha <= endDate) {
                    transacciones.push({
                        fecha: pago.fecha,
                        tipo: 'HOSPEDAJE',
                        descripcion: `Pago Hab ${reg.habitacion?.numero || '-'} - ${clienteObj?.nombre || 'PARTICULAR'}`,
                        detalle: `Folio: ${reg.folio || '-'} | Hab: ${reg.habitacion?.numero || '-'}`,
                        usuario: pago.usuario_nombre || reg.usuarioCreacion,
                        medioPago: (pago.medio || 'EFECTIVO').toUpperCase(),
                        monto: pago.monto,
                        id_ref: reg._id
                    });
                }
            });
        });

        abonosReservas.forEach(reserva => {
            const clienteObj = reserva.cliente ? clienteMapCuadre.get(reserva.cliente.toString()) : null;
            reserva.abonos.forEach(abono => {
                if (abono.fecha >= startDate && abono.fecha <= endDate) {
                    transacciones.push({
                        fecha: abono.fecha,
                        tipo: 'RESERVA',
                        descripcion: `Abono Reserva - ${clienteObj?.nombre || 'Cliente'}`,
                        detalle: `Referencia: ${reserva.codigoReserva || '-'}`,
                        usuario: abono.usuario_nombre || reserva.usuarioCreacion,
                        medioPago: (abono.medio_pago || 'EFECTIVO').toUpperCase(),
                        monto: abono.monto,
                        id_ref: reserva._id
                    });
                }
            });
        });

        // 3. Ventas de Productos
        const ventas = await Venta.find({
            fecha: { $gte: startDate, $lte: endDate }
        }).populate('items.producto', 'nombre').populate('empleado', 'nombre');

        ventas.forEach(venta => {
            transacciones.push({
                fecha: venta.fecha,
                tipo: 'VENTA',
                descripcion: `Venta de productos`,
                usuario: venta.empleado?.nombre || venta.usuarioCreacion,
                medioPago: (venta.medioPago || 'EFECTIVO').toUpperCase(),
                monto: venta.total,
                id_ref: venta._id
            });
        });

        // 4. Gastos e Ingresos manuales
        const gastos = await Gasto.find({
            fecha: { $gte: startDate, $lte: endDate }
        }).populate('categoria').populate('usuario', 'nombre');

        gastos.forEach(gasto => {
            const esIngreso = gasto.categoria?.tipo === 'Ingreso';
            transacciones.push({
                fecha: gasto.fecha,
                tipo: esIngreso ? 'INGRESO MANUAL' : 'GASTO',
                descripcion: gasto.descripcion,
                usuario: gasto.usuario?.nombre || 'Sistema',
                medioPago: (gasto.medioPago || 'EFECTIVO').toUpperCase(),
                monto: esIngreso ? gasto.monto : -gasto.monto,
                id_ref: gasto._id
            });
        });

        // Estandarizar nombres de medios de pago según pedido del usuario
        transacciones = transacciones.map(t => {
            let medio = t.medioPago;
            if (medio.includes('BANCOLOMBIA') || medio === 'TRANSFERENCIA') medio = 'TRANSFERENCIA BANCOLOMBIA';
            if (medio.includes('NEQUI')) medio = 'NEQUI';
            if (medio.includes('EFECTIVO') || medio === 'CASH') medio = 'EFECTIVO';
            return { ...t, medioPago: medio };
        });

        // Ordenar por fecha desc
        transacciones.sort((a, b) => b.fecha - a.fecha);

        // Calcular Resumen
        const resumen = {
            total_nequi: 0,
            total_bancolombia: 0,
            total_efectivo: 0,
            total_otros: 0,
            ingresos_totales: 0,
            egresos_totales: 0,
            balance_final: 0
        };

        transacciones.forEach(t => {
            if (t.monto > 0) {
                resumen.ingresos_totales += t.monto;
                if (t.medioPago === 'NEQUI') resumen.total_nequi += t.monto;
                else if (t.medioPago === 'TRANSFERENCIA BANCOLOMBIA') resumen.total_bancolombia += t.monto;
                else if (t.medioPago === 'EFECTIVO') resumen.total_efectivo += t.monto;
                else resumen.total_otros += t.monto;
            } else {
                resumen.egresos_totales += Math.abs(t.monto);
                // Los gastos restan del efectivo por defecto si no se especifica? 
                // En realidad dependen del medio de pago del gasto.
                if (t.medioPago === 'NEQUI') resumen.total_nequi += t.monto;
                else if (t.medioPago === 'TRANSFERENCIA BANCOLOMBIA') resumen.total_bancolombia += t.monto;
                else if (t.medioPago === 'EFECTIVO') resumen.total_efectivo += t.monto;
                else resumen.total_otros += t.monto;
            }
        });

        resumen.balance_final = resumen.ingresos_totales - resumen.egresos_totales;

        res.json({
            filtros: { inicio: startDate, fin: endDate },
            transacciones,
            resumen
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getReporteHuespedes = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const filter = { estado: { $ne: 'cancelado' } };
        
        if (inicio || fin) {
            filter.fechaEntrada = {};
            if (inicio) filter.fechaEntrada.$gte = inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`);
            if (fin) filter.fechaEntrada.$lte = fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`);
        }

        const report = await Registro.aggregate([
            { $match: filter },
            {
                $project: {
                    count: { $size: { $ifNull: ["$huespedes", []] } }
                }
            },
            {
                $group: {
                    _id: null,
                    totalHuespedes: { $sum: "$count" },
                    numRegistros: { $sum: 1 }
                }
            }
        ]);

        const totalHuespedes = report[0]?.totalHuespedes || 0;
        
        // Calcular número de días para el promedio
        const start = inicio ? new Date(`${inicio}T00:00:00`) : new Date();
        const end = fin ? new Date(`${fin}T00:00:00`) : new Date();
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        const promedioHuespedes = diffDays > 0 ? (totalHuespedes / diffDays) : totalHuespedes;

        res.json({
            totalHuespedes,
            promedioHuespedes,
            numDias: diffDays
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- NUEVOS REPORTES SOLICITADOS ---

// 1. Calendario de Ingresos (Individual)
exports.getIngresosCalendario = async (req, res) => {
    try {
        const { anio, mes } = req.query; // mes es 1-12
        const startDate = moment.tz(`${anio}-${mes}-01`, "America/Bogota").startOf('month').toDate();
        const endDate = moment.tz(`${anio}-${mes}-01`, "America/Bogota").endOf('month').toDate();

        const [registros, reservas, ventas, gastos] = await Promise.all([
            Registro.find({ "pagos.fecha": { $gte: startDate, $lte: endDate } }),
            Reserva.find({ "abonos.fecha": { $gte: startDate, $lte: endDate } }),
            Venta.find({ fecha: { $gte: startDate, $lte: endDate } }),
            Gasto.find({ fecha: { $gte: startDate, $lte: endDate } }).populate('categoria')
        ]);

        const dailyData = {};

        const addToDay = (date, amount) => {
            const dayKey = moment(date).tz("America/Bogota").format('YYYY-MM-DD');
            if (!dailyData[dayKey]) dailyData[dayKey] = { ingresos: 0, egresos: 0, balance: 0 };
            if (amount > 0) dailyData[dayKey].ingresos += amount;
            else dailyData[dayKey].egresos += Math.abs(amount);
            dailyData[dayKey].balance += amount;
        };

        registros.forEach(reg => reg.pagos.forEach(p => {
            if (p.fecha >= startDate && p.fecha <= endDate) addToDay(p.fecha, p.monto);
        }));
        reservas.forEach(res => res.abonos.forEach(a => {
            if (a.fecha >= startDate && a.fecha <= endDate) addToDay(a.fecha, a.monto);
        }));
        ventas.forEach(v => addToDay(v.fecha, v.total));
        gastos.forEach(g => {
            const esIngreso = g.categoria?.tipo === 'Ingreso';
            addToDay(g.fecha, esIngreso ? g.monto : -g.monto);
        });

        res.json(dailyData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 2. Rentabilidad por Habitación (Individual)
exports.getRentabilidadHabitaciones = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const startDate = inicio ? moment.tz(`${inicio}T00:00:00`, "America/Bogota").toDate() : moment().subtract(30, 'days').startOf('day').toDate();
        const endDate = fin ? moment.tz(`${fin}T23:59:59`, "America/Bogota").toDate() : moment().endOf('day').toDate();

        const Habitacion = mongoose.model('Habitacion');
        const habitaciones = await Habitacion.find();
        
        const registros = await Registro.find({
            $or: [
                { fechaEntrada: { $gte: startDate, $lte: endDate } },
                { fechaSalida: { $gte: startDate, $lte: endDate } },
                { estado: 'activo' }
            ]
        });

        const registroIds = registros.map(r => r._id);
        const ventas = await Venta.find({ registro: { $in: registroIds } });

        const stats = habitaciones.map(hab => {
            const regsHab = registros.filter(r => r.habitacion.toString() === hab._id.toString());
            let ingresosHospedaje = 0;
            let ingresosVentas = 0;

            regsHab.forEach(r => {
                r.pagos.forEach(p => {
                    if (p.fecha >= startDate && p.fecha <= endDate) ingresosHospedaje += p.monto;
                });
                const ventasReg = ventas.filter(v => v.registro?.toString() === r._id.toString());
                ventasReg.forEach(v => {
                    if (v.fecha >= startDate && v.fecha <= endDate) ingresosVentas += v.total;
                });
            });

            return {
                _id: hab._id,
                numero: hab.numero,
                tipo: hab.tipo,
                ingresosHospedaje,
                ingresosVentas,
                total: ingresosHospedaje + ingresosVentas,
                numReservas: regsHab.length
            };
        });

        res.json(stats.sort((a, b) => b.total - a.total));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. Calendario Consolidado
exports.getIngresosCalendarioConsolidado = async (req, res) => {
    try {
        const { anio, mes } = req.query;
        const startDate = new Date(anio, mes - 1, 1);
        const endDate = new Date(anio, mes, 0, 23, 59, 59);

        const fetchDaily = async (models) => {
            const { Registro, Reserva, Venta, Gasto } = models;
            const [registros, reservas, ventas, gastos] = await Promise.all([
                Registro.find({ "pagos.fecha": { $gte: startDate, $lte: endDate } }),
                Reserva.find({ "abonos.fecha": { $gte: startDate, $lte: endDate } }),
                Venta.find({ fecha: { $gte: startDate, $lte: endDate } }),
                Gasto.find({ fecha: { $gte: startDate, $lte: endDate } }).populate('categoria')
            ]);

            const daily = {};
            const add = (date, amount) => {
                const dayKey = moment(date).tz("America/Bogota").format('YYYY-MM-DD');
                if (!daily[dayKey]) daily[dayKey] = 0;
                daily[dayKey] += amount;
            };

            registros.forEach(reg => reg.pagos.forEach(p => { if (p.fecha >= startDate && p.fecha <= endDate) add(p.fecha, p.monto); }));
            reservas.forEach(res => res.abonos.forEach(a => { if (a.fecha >= startDate && a.fecha <= endDate) add(a.fecha, a.monto); }));
            ventas.forEach(v => add(v.fecha, v.total));
            gastos.forEach(g => { const esIngreso = g.categoria?.tipo === 'Ingreso'; add(g.fecha, esIngreso ? g.monto : -g.monto); });
            return daily;
        };

        const plazaData = await fetchDaily({ Registro, Reserva, Venta, Gasto });
        const colonialModels = await getColonialModels();
        const colonialData = await fetchDaily(colonialModels);

        const consolidated = {};
        const allKeys = new Set([...Object.keys(plazaData), ...Object.keys(colonialData)]);
        allKeys.forEach(key => {
            consolidated[key] = {
                plaza: plazaData[key] || 0,
                colonial: colonialData[key] || 0,
                total: (plazaData[key] || 0) + (colonialData[key] || 0)
            };
        });

        res.json(consolidated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 4. Rentabilidad Consolidada
exports.getRentabilidadConsolidada = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const startDate = inicio ? moment.tz(`${inicio}T00:00:00`, "America/Bogota").toDate() : moment().subtract(30, 'days').startOf('day').toDate();
        const endDate = fin ? moment.tz(`${fin}T23:59:59`, "America/Bogota").toDate() : moment().endOf('day').toDate();

        const fetchRentabilidad = async (models, hotelLabel) => {
            const { Registro, Venta, Habitacion } = models;
            const habitaciones = await Habitacion.find();
            const registros = await Registro.find({
                $or: [
                    { fechaEntrada: { $gte: startDate, $lte: endDate } },
                    { fechaSalida: { $gte: startDate, $lte: endDate } },
                    { estado: 'activo' }
                ]
            });
            const registroIds = registros.map(r => r._id);
            const ventas = await Venta.find({ registro: { $in: registroIds } });

            return habitaciones.map(hab => {
                const regsHab = registros.filter(r => r.habitacion && r.habitacion.toString() === hab._id.toString());
                let total = 0;
                regsHab.forEach(r => {
                    r.pagos.forEach(p => { if (p.fecha >= startDate && p.fecha <= endDate) total += p.monto; });
                    const ventasReg = ventas.filter(v => v.registro?.toString() === r._id.toString());
                    ventasReg.forEach(v => { if (v.fecha >= startDate && v.fecha <= endDate) total += v.total; });
                });
                return {
                    hotel: hotelLabel,
                    numero: hab.numero,
                    tipo: hab.tipo,
                    ingresosHospedaje: regsHab.reduce((sum, r) => sum + r.pagos.reduce((pSum, p) => p.fecha >= startDate && p.fecha <= endDate ? pSum + p.monto : pSum, 0), 0),
                    ingresosVentas: ventas.filter(v => regsHab.some(r => r._id.toString() === v.registro?.toString())).reduce((vSum, v) => v.fecha >= startDate && v.fecha <= endDate ? vSum + v.total : vSum, 0),
                    total,
                    numReservas: regsHab.length
                };
            });
        };

        const plazaStats = await fetchRentabilidad({ Registro, Venta, Habitacion }, 'Plaza');
        const colonialModels = await getColonialModels();
        const colonialStats = await fetchRentabilidad(colonialModels, 'Colonial');

        const allStats = [...plazaStats, ...colonialStats].sort((a, b) => b.total - a.total);
        res.json(allStats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
