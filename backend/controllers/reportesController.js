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
const HotelConfig = require('../models/HotelConfig');
const Mantenimiento = require('../models/Mantenimiento');
const mongoose = require('mongoose');
const moment = require('moment-timezone');

// Configuración para la conexión al Hotel Colonial
const COLONIAL_URI = process.env.COLONIAL_MONGODB_URI || 'mongodb+srv://admin:HotelColonial2026@cluster0.d1nbr5v.mongodb.net/HotelColonialDB?retryWrites=true&w=majority';

let colonialConn = null;
const getColonialConnection = async () => {
    if (colonialConn && colonialConn.readyState === 1) return colonialConn;
    colonialConn = await mongoose.createConnection(COLONIAL_URI).asPromise();
    return colonialConn;
};

let plazaConn = null;
const getPlazaConnection = async () => {
    if (plazaConn && plazaConn.readyState === 1) return plazaConn;
    const PLAZA_URI = process.env.MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';
    plazaConn = await mongoose.createConnection(PLAZA_URI).asPromise();
    return plazaConn;
};

const getColonialModels = async () => {
    const conn = await getColonialConnection();
    return {
        CierreCaja: conn.model('CierreCaja', require('../models/CierreCaja').schema),
        Venta: conn.model('Venta', require('../models/Venta').schema),
        Registro: conn.model('Registro', require('../models/Registro').schema),
        Gasto: conn.model('Gasto', require('../models/Gasto').schema),
        CategoriaGasto: conn.model('CategoriaGasto', require('../models/CategoriaGasto').schema),
        Habitacion: conn.model('Habitacion', require('../models/Habitacion').schema),
        EstadoHabitacion: conn.model('EstadoHabitacion', require('../models/EstadoHabitacion').schema),
        TipoHabitacion: conn.model('TipoHabitacion', require('../models/TipoHabitacion').schema),
        Reserva: conn.model('Reserva', require('../models/Reserva').schema),
        Cliente: conn.model('Cliente', require('../models/Cliente').schema),
        Producto: conn.model('Producto', require('../models/Producto').schema),
        HotelConfig: conn.model('HotelConfig', require('../models/HotelConfig').schema),
        Usuario: conn.model('Usuario', require('../models/Usuario').schema),
        Municipio: conn.model('Municipio', require('../models/Municipio').schema),
        TipoRegistro: conn.model('TipoRegistro', require('../models/TipoRegistro').schema),
        Empresa: conn.model('Empresa', require('../models/Empresa').schema)
    };
};

const getPlazaModels = async () => {
    const conn = await getPlazaConnection();
    return {
        CierreCaja: conn.model('CierreCaja', require('../models/CierreCaja').schema),
        Venta: conn.model('Venta', require('../models/Venta').schema),
        Registro: conn.model('Registro', require('../models/Registro').schema),
        Gasto: conn.model('Gasto', require('../models/Gasto').schema),
        CategoriaGasto: conn.model('CategoriaGasto', require('../models/CategoriaGasto').schema),
        Habitacion: conn.model('Habitacion', require('../models/Habitacion').schema),
        EstadoHabitacion: conn.model('EstadoHabitacion', require('../models/EstadoHabitacion').schema),
        TipoHabitacion: conn.model('TipoHabitacion', require('../models/TipoHabitacion').schema),
        Reserva: conn.model('Reserva', require('../models/Reserva').schema),
        Cliente: conn.model('Cliente', require('../models/Cliente').schema),
        Producto: conn.model('Producto', require('../models/Producto').schema),
        HotelConfig: conn.model('HotelConfig', require('../models/HotelConfig').schema),
        Usuario: conn.model('Usuario', require('../models/Usuario').schema),
        Municipio: conn.model('Municipio', require('../models/Municipio').schema),
        TipoRegistro: conn.model('TipoRegistro', require('../models/TipoRegistro').schema),
        Empresa: conn.model('Empresa', require('../models/Empresa').schema)
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
        const hoy = moment.tz("America/Bogota").startOf('day').toDate();
        const mañana = moment.tz("America/Bogota").endOf('day').toDate();

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

        // 5. Historial financiero (últimos 7 días)
        const sieteDiasAtras = moment.tz("America/Bogota").subtract(7, 'days').startOf('day').toDate();
        const finDeHoy = moment.tz("America/Bogota").endOf('day').toDate();
        
        const historial_ingresos = await Registro.aggregate([
            { $unwind: "$pagos" },
            { $match: { "pagos.fecha": { $gte: sieteDiasAtras, $lte: finDeHoy } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$pagos.fecha", timezone: "-05:00" } },
                    total: { $sum: "$pagos.monto" }
                }
            }
        ]);

        const historial_ventas = await Venta.aggregate([
            { $match: { fecha: { $gte: sieteDiasAtras, $lte: finDeHoy } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: "-05:00" } },
                    total: { $sum: "$total" }
                }
            }
        ]);

        const historial_egresos = await Gasto.aggregate([
            { $match: { fecha: { $gte: sieteDiasAtras, $lte: finDeHoy } } },
            {
                $lookup: {
                    from: 'categoriagastos',
                    localField: 'categoria',
                    foreignField: '_id',
                    as: 'cat'
                }
            },
            { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
            { $match: { $or: [{ "cat.tipo": "Gasto" }, { "cat": { $exists: false } }] } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: "-05:00" } },
                    total: { $sum: "$monto" }
                }
            }
        ]);

        // Unificar historial por día asegurando que no falte ningún día
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const dateStr = moment.tz("America/Bogota").subtract(i, 'days').format('YYYY-MM-DD');
            const ing = (historial_ingresos.find(h => h._id === dateStr)?.total || 0) + (historial_ventas.find(h => h._id === dateStr)?.total || 0);
            const egr = historial_egresos.find(h => h._id === dateStr)?.total || 0;
            chartData.push({ fecha: dateStr, ingresos: ing, egresos: egr });
        }

        // 6. Top productos vendidos (Simplificado para asegurar que traiga datos)
        const top_productos = await Venta.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.producto",
                    nombre: { $first: "$items.productoNombre" },
                    total: { $sum: "$items.cantidad" }
                }
            },
            { $match: { total: { $gt: 0 } } },
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]);

        // 7. Mantenimientos y Llegadas (Rango corregido para próximos días)
        const mantenimientos_pendientes = await Mantenimiento.countDocuments({ estado: { $ne: 'Completado' } });
        const mananaInicio = moment.tz("America/Bogota").add(1, 'day').startOf('day').toDate();
        const pasadoMananaFin = moment.tz("America/Bogota").add(2, 'days').endOf('day').toDate();

        const llegadas_proximas = await Reserva.find({ 
            fechaEntrada: { $gte: mananaInicio, $lte: pasadoMananaFin },
            estado: { $ne: 'cancelado' }
        }).sort({ fechaEntrada: 1 }).limit(5);

        console.log(`[DASHBOARD] Stats calculadas: Ingresos Hoy: ${ingresos_hoy}, Top Prods: ${top_productos.length}, Historial: ${chartData.length}`);

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
            },
            historial: chartData,
            top_productos: top_productos.map(p => ({
                id: p._id,
                nombre: p.nombre || 'Producto sin nombre',
                total: p.total
            })),
            mantenimientos_pendientes,
            llegadas_proximas: llegadas_proximas.map(r => ({
                id: r._id,
                cliente: r.clienteNombre || 'Cliente',
                fecha: r.fechaEntrada,
                noches: r.noches
            }))
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
        let startDate = inicio ? (inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`)) : moment.tz("America/Bogota").startOf('day').toDate();
        let endDate = fin ? (fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`)) : moment.tz("America/Bogota").endOf('day').toDate();

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
                    ingresos.push({
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
            ingresos.push({
                fecha: venta.fecha,
                tipo: 'VENTA',
                descripcion: `Venta de productos`,
                detalle: venta.items?.map(i => `${i.cantidad}x ${i.producto?.nombre || 'Prod'}`).join(', ') || '-',
                usuario: venta.empleado?.nombre || venta.usuarioCreacion,
                medioPago: (venta.medioPago || 'EFECTIVO').toUpperCase(),
                monto: venta.total,
                id_ref: venta._id
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
                        monto: esIngreso ? mov.monto : -mov.monto,
                        id_ref: mov._id
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
        let startDate = inicio ? (inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`)) : moment.tz("America/Bogota").startOf('day').toDate();
        let endDate = fin ? (fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`)) : moment.tz("America/Bogota").endOf('day').toDate();

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

exports.getRegistrosConsolidado = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        let startDate = inicio ? (inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`)) : moment.tz("America/Bogota").startOf('day').toDate();
        let endDate = fin ? (fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`)) : moment.tz("America/Bogota").endOf('day').toDate();

        const fetchRegistros = async (models, hotelLabel) => {
            const { Registro } = models;
            const regs = await Registro.find({
                fechaEntrada: { $gte: startDate, $lte: endDate }
            })
            .populate('habitacion', 'numero')
            .populate('cliente', 'nombre documento telefono municipio_nombre')
            .sort({ fechaEntrada: -1 });

            return regs.map(r => ({
                ...r.toObject(),
                id: r._id,
                hotel: hotelLabel,
                nombre_cliente: r.cliente?.nombre || r.nombre_cliente || 'Huésped',
                documento_cliente: r.cliente?.documento || r.documento_cliente || 'N/A',
                numero_habitacion: r.habitacion?.numero || r.numero_habitacion || 'S/N'
            }));
        };

        const plazaRegs = await fetchRegistros({ Registro }, 'Hotel Plaza');
        
        const colonialModels = await getColonialModels();
        const colonialRegs = await fetchRegistros(colonialModels, 'Hotel Colonial');

        const allRegs = [...plazaRegs, ...colonialRegs].sort((a, b) => new Date(b.fechaEntrada) - new Date(a.fechaEntrada));

        res.json(allRegs);
    } catch (err) {
        console.error('[CONSOLIDADO REGISTROS] Error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.getCuadreCaja = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        let startDate = inicio ? (inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`)) : moment.tz("America/Bogota").startOf('day').toDate();
        let endDate = fin ? (fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`)) : moment.tz("America/Bogota").endOf('day').toDate();

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
        const start = inicio ? moment.tz(inicio, "America/Bogota").startOf('day').toDate() : moment.tz("America/Bogota").startOf('day').toDate();
        const end = fin ? moment.tz(fin, "America/Bogota").endOf('day').toDate() : moment.tz("America/Bogota").endOf('day').toDate();
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
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
        const year = parseInt(anio);
        const month = parseInt(mes);
        
        const startOfMonth = moment.tz([year, month - 1, 1], "America/Bogota").startOf('month');
        const endOfMonth = moment.tz([year, month - 1, 1], "America/Bogota").endOf('month');
        
        const startDate = startOfMonth.clone().startOf('week').toDate();
        const endDate = endOfMonth.clone().endOf('week').toDate();

        const [registros, reservas, ventas, gastos] = await Promise.all([
            Registro.find({ "pagos.fecha": { $gte: startDate, $lte: endDate } }),
            Reserva.find({ "abonos.fecha": { $gte: startDate, $lte: endDate } }),
            Venta.find({ fecha: { $gte: startDate, $lte: endDate } }),
            Gasto.find({ fecha: { $gte: startDate, $lte: endDate } }).populate('categoria')
        ]);

        const dailyData = {};

        const addToDay = (date, amount, source = 'otros') => {
            if (!date) return;
            const dayKey = moment(date).tz("America/Bogota").format('YYYY-MM-DD');
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = { 
                    ingresos: 0, 
                    egresos: 0, 
                    balance: 0,
                    fuentes: { hospedaje: 0, ventas: 0, otros: 0 }
                };
            }
            if (amount > 0) {
                dailyData[dayKey].ingresos += amount;
                if (source === 'hospedaje') dailyData[dayKey].fuentes.hospedaje += amount;
                else if (source === 'ventas') dailyData[dayKey].fuentes.ventas += amount;
                else dailyData[dayKey].fuentes.otros += amount;
            } else {
                dailyData[dayKey].egresos += Math.abs(amount);
            }
            dailyData[dayKey].balance += amount;
        };

        registros.forEach(reg => reg.pagos.forEach(p => {
            if (p.fecha >= startDate && p.fecha <= endDate) addToDay(p.fecha, p.monto, 'hospedaje');
        }));
        reservas.forEach(res => res.abonos.forEach(a => {
            if (a.fecha >= startDate && a.fecha <= endDate) addToDay(a.fecha, a.monto, 'hospedaje');
        }));
        ventas.forEach(v => addToDay(v.fecha, v.total, 'ventas'));
        gastos.forEach(g => {
            const esIngreso = g.categoria?.tipo === 'Ingreso';
            addToDay(g.fecha, esIngreso ? g.monto : -g.monto, esIngreso ? 'otros' : null);
        });

        res.json(dailyData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 1b. Detalle de un día específico para el calendario
exports.getDetalleDiaCalendario = async (req, res) => {
    try {
        const { fecha } = req.query; // YYYY-MM-DD
        const startDate = moment.tz(fecha, "America/Bogota").startOf('day').toDate();
        const endDate = moment.tz(fecha, "America/Bogota").endOf('day').toDate();

        const [registros, reservas, ventas, gastos] = await Promise.all([
            Registro.find({ "pagos.fecha": { $gte: startDate, $lte: endDate } }).populate('habitacion', 'numero'),
            Reserva.find({ "abonos.fecha": { $gte: startDate, $lte: endDate } }),
            Venta.find({ fecha: { $gte: startDate, $lte: endDate } }).populate('items.producto', 'nombre'),
            Gasto.find({ fecha: { $gte: startDate, $lte: endDate } }).populate('categoria')
        ]);

        const items = [];

        registros.forEach(reg => reg.pagos.forEach(p => {
            if (p.fecha >= startDate && p.fecha <= endDate) {
                items.push({
                    tipo: 'HOSPEDAJE',
                    monto: p.monto,
                    descripcion: `Pago Hab ${reg.habitacion?.numero || '-'} - ${reg.nombre_cliente || 'Cliente'}`,
                    medio: p.medio || 'EFECTIVO'
                });
            }
        }));

        reservas.forEach(res => res.abonos.forEach(a => {
            if (a.fecha >= startDate && a.fecha <= endDate) {
                items.push({
                    tipo: 'RESERVA',
                    monto: a.monto,
                    descripcion: `Abono Reserva ${res.codigoReserva || ''} - ${res.nombre_cliente}`,
                    medio: a.medio_pago || 'EFECTIVO'
                });
            }
        }));

        ventas.forEach(v => {
            items.push({
                tipo: 'VENTA',
                monto: v.total,
                descripcion: `Venta POS - ${v.items?.length || 0} productos`,
                medio: v.medioPago || 'EFECTIVO'
            });
        });

        gastos.forEach(g => {
            const esIngreso = g.categoria?.tipo === 'Ingreso';
            items.push({
                tipo: esIngreso ? 'INGRESO' : 'GASTO',
                monto: esIngreso ? g.monto : -g.monto,
                descripcion: `${g.categoria?.nombre}: ${g.descripcion}`,
                medio: g.medioPago || 'EFECTIVO'
            });
        });

        res.json(items.sort((a, b) => Math.abs(b.monto) - Math.abs(a.monto)));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 2. Rentabilidad por Habitación (Individual)
exports.getRentabilidadHabitaciones = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const startDate = inicio ? moment.tz(inicio, "America/Bogota").startOf('day').toDate() : moment.tz("America/Bogota").subtract(30, 'days').startOf('day').toDate();
        const endDate = fin ? moment.tz(fin, "America/Bogota").endOf('day').toDate() : moment.tz("America/Bogota").endOf('day').toDate();

        // Calcular das del periodo para promedio diario
        const diffDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

        const Habitacion = mongoose.model('Habitacion');
        const habitaciones = await Habitacion.find().populate('tipo', 'nombre');
        
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
            const regsHab = registros.filter(r => r.habitacion && r.habitacion.toString() === hab._id.toString());
            let ingresosHospedaje = 0;
            let ingresosVentas = 0;
            let nochesOcupadas = 0;

            regsHab.forEach(r => {
                // Cálculo de ingresos en el periodo
                r.pagos.forEach(p => {
                    if (p.fecha >= startDate && p.fecha <= endDate) ingresosHospedaje += p.monto;
                });
                const ventasReg = ventas.filter(v => v.registro?.toString() === r._id.toString());
                ventasReg.forEach(v => {
                    if (v.fecha >= startDate && v.fecha <= endDate) ingresosVentas += v.total;
                });

                // Cálculo de ocupación en el periodo (noches reales dentro del rango)
                const start = Math.max(moment(r.fechaEntrada).valueOf(), moment(startDate).valueOf());
                const end = Math.min(moment(r.fechaSalida || new Date()).valueOf(), moment(endDate).valueOf());
                const nights = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
                nochesOcupadas += nights;
            });

            return {
                _id: hab._id,
                numero: hab.numero,
                tipo: hab.tipo?.nombre || 'Sin tipo',
                ingresosHospedaje,
                ingresosVentas,
                total: ingresosHospedaje + ingresosVentas,
                promedioDia: (ingresosHospedaje + ingresosVentas) / diffDays,
                numReservas: regsHab.length,
                nochesOcupadas,
                porcentajeOcupacion: Math.min(100, Math.round((nochesOcupadas / diffDays) * 100))
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
        const year = parseInt(anio);
        const month = parseInt(mes);

        const startOfMonth = moment.tz([year, month - 1, 1], "America/Bogota").startOf('month');
        const endOfMonth = moment.tz([year, month - 1, 1], "America/Bogota").endOf('month');
        
        const startDate = startOfMonth.clone().startOf('week').toDate();
        const endDate = endOfMonth.clone().endOf('week').toDate();

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
        const startDate = inicio ? moment.tz(inicio, "America/Bogota").startOf('day').toDate() : moment.tz("America/Bogota").subtract(30, 'days').startOf('day').toDate();
        const endDate = fin ? moment.tz(fin, "America/Bogota").endOf('day').toDate() : moment.tz("America/Bogota").endOf('day').toDate();

        const diffDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

        const fetchRentabilidad = async (models, hotelLabel) => {
            const { Registro, Venta, Habitacion } = models;
            const habitaciones = await Habitacion.find().populate('tipo', 'nombre');
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
                let nochesOcupadas = 0;
                regsHab.forEach(r => {
                    r.pagos.forEach(p => { if (p.fecha >= startDate && p.fecha <= endDate) total += p.monto; });
                    const ventasReg = ventas.filter(v => v.registro?.toString() === r._id.toString());
                    ventasReg.forEach(v => { if (v.fecha >= startDate && v.fecha <= endDate) total += v.total; });

                    const start = Math.max(moment(r.fechaEntrada).valueOf(), moment(startDate).valueOf());
                    const end = Math.min(moment(r.fechaSalida || new Date()).valueOf(), moment(endDate).valueOf());
                    nochesOcupadas += Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
                });
                return {
                    hotel: hotelLabel,
                    numero: hab.numero,
                    tipo: hab.tipo?.nombre || 'Sin tipo',
                    ingresosHospedaje: regsHab.reduce((sum, r) => sum + r.pagos.reduce((pSum, p) => p.fecha >= startDate && p.fecha <= endDate ? pSum + p.monto : pSum, 0), 0),
                    ingresosVentas: ventas.filter(v => regsHab.some(r => r._id.toString() === v.registro?.toString())).reduce((vSum, v) => v.fecha >= startDate && v.fecha <= endDate ? vSum + v.total : vSum, 0),
                    total,
                    promedioDia: total / diffDays,
                    numReservas: regsHab.length,
                    nochesOcupadas,
                    porcentajeOcupacion: Math.min(100, Math.round((nochesOcupadas / diffDays) * 100))
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

exports.getMapaHabitacionesConsolidado = async (req, res) => {
    try {
        const fetchHotelData = async (models, hotelLabel) => {
            const { Habitacion, Registro, Reserva, Cliente, Venta } = models;
            console.log(`[DEBUG] Fetching data for ${hotelLabel}...`);
            
            const [habs, registrosActivos, todasVentas, reservasProximas] = await Promise.all([
                Habitacion.find().populate('tipo', 'nombre').populate('estado', 'nombre color').lean(),
                Registro.find({ estado: 'activo' }).populate('habitacion').populate('tipo_registro', 'nombre').lean(),
                Venta.find({ registro: { $exists: true } }).lean(),
                Reserva.find({ 
                    estado: 'Pendiente',
                    fecha_entrada: { $gte: moment.tz("America/Bogota").startOf('day').toDate() }
                }).sort({ fecha_entrada: 1 }).lean()
            ]);

            const clientIds = registrosActivos.map(r => r.cliente).filter(id => id);
            const clientes = await Cliente.find({ _id: { $in: clientIds } }).lean();
            const clientMap = new Map(clientes.map(c => [c._id.toString(), c]));

            return habs.map(hab => {
                const habId = hab._id.toString();
                const reg = registrosActivos.find(r => {
                    const rHabId = r.habitacion?._id ? r.habitacion._id.toString() : r.habitacion?.toString();
                    return rHabId === habId;
                });

                let registroInfo = null;
                if (reg) {
                    const titular = reg.cliente ? clientMap.get(reg.cliente.toString()) : null;
                    const pagos = reg.pagos || [];
                    const totalPagado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
                    const consumosReg = todasVentas.filter(v => v.registro?.toString() === reg._id.toString());
                    const totalConsumos = consumosReg.reduce((sum, v) => sum + (v.total || 0), 0);
                    
                    // Cálculo robusto del total de estancia (igual que en mapa local)
                    let totalEstancia = reg.total || 0;
                    if (totalEstancia <= 0 && reg.fechaEntrada && reg.fechaSalida) {
                        const inDate = new Date(reg.fechaEntrada);
                        const outDate = new Date(reg.fechaSalida);
                        if (!isNaN(inDate) && !isNaN(outDate)) {
                            const diffDays = Math.max(Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)), 1);
                            const numHuespedes = Math.min(Math.max((reg.huespedes || []).length, 1), 6);
                            const precioKey = `precio_${numHuespedes}`;
                            const precioBase = parseFloat(hab[precioKey]) || parseFloat(hab.precio_1) || 0;
                            totalEstancia = precioBase * diffDays;
                        }
                    }

                    const totalGeneral = totalEstancia + totalConsumos;

                    registroInfo = {
                        id: reg._id,
                        huesped: titular?.nombre || 'Huésped',
                        fecha_ingreso: reg.fechaEntrada || reg.fecha_ingreso,
                        fecha_salida: reg.fechaSalida || reg.fecha_salida,
                        totalGeneral,
                        pagado: totalPagado,
                        saldo: totalGeneral - totalPagado,
                        tipo_registro: reg.tipo_registro?.nombre || 'Particular'
                    };
                }

                const proximas = reservasProximas
                    .filter(res => {
                        if (res.habitaciones && res.habitaciones.length > 0) {
                            return res.habitaciones.some(rh => (rh.habitacion?._id || rh.habitacion).toString() === habId);
                        }
                        return res.habitacion?.toString() === habId;
                    })
                    .slice(0, 2)
                    .map(res => ({
                        id: res._id,
                        cliente: res.nombre_cliente || 'Reserva',
                        fecha_entrada: res.fecha_entrada,
                        fecha_salida: res.fecha_salida
                    }));

                return {
                    id: hab._id,
                    numero: hab.numero,
                    tipo: hab.tipo?.nombre || 'General',
                    estado: hab.estado?.nombre || 'Disponible',
                    color: hab.estado?.color || '#10b981',
                    estadoLimpieza: hab.estadoLimpieza?.toUpperCase() || 'LIMPIA',
                    hotel: hotelLabel,
                    registroActual: registroInfo,
                    reservasProximas: proximas
                };
            });
        };

        const plazaModels = await getPlazaModels();
        const plazaRooms = await fetchHotelData(plazaModels, 'Hotel Plaza');
        
        const colonialModels = await getColonialModels();
        const colonialRooms = await fetchHotelData(colonialModels, 'Hotel Colonial');

        res.json([...plazaRooms, ...colonialRooms]);
    } catch (err) {
        console.error('[MAPA CONSOLIDADO ERROR]', err);
        res.status(500).json({ 
            message: 'Error al generar el mapa consolidado',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

exports.getStatsConsolidadas = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const startDate = inicio ? moment.tz(inicio, "America/Bogota").startOf('day').toDate() : moment.tz("America/Bogota").subtract(30, 'days').startOf('day').toDate();
        const endDate = fin ? moment.tz(fin, "America/Bogota").endOf('day').toDate() : moment.tz("America/Bogota").endOf('day').toDate();
        const next7Days = moment.tz("America/Bogota").add(7, 'days').endOf('day').toDate();

        const fetchHotelStats = async (models, hotelLabel) => {
            const { Registro, Venta, Habitacion, Producto, Reserva, Cliente, HotelConfig: HotelConfigModel } = models;
            
            // 1. Alertas
            const lowStock = await Producto.find({ $expr: { $lte: ["$stock", "$stockMinimo"] } }).lean();
            const longStayNoPayment = await Registro.find({ 
                estado: 'activo',
                fechaEntrada: { $lte: moment.tz("America/Bogota").subtract(3, 'days').toDate() }
            }).lean();
            // Filtrar los que de verdad no tienen pagos significativos (ej: pagos sum < total*0.1 o algo simple)
            const alertsLongStay = longStayNoPayment.filter(r => {
                const totalPagado = (r.pagos || []).reduce((sum, p) => sum + p.monto, 0);
                return totalPagado === 0; // Alerta si no ha pagado nada
            });

            const lateCheckouts = await Registro.find({
                estado: 'activo',
                fechaSalida: { $lt: moment.tz("America/Bogota").toDate() }
            }).populate('habitacion', 'numero')
              .populate({ path: 'cliente', populate: { path: 'empresa_id' } })
              .lean();

            // 2. Ranking Habitaciones
            const registrosPeriodo = await Registro.find({
                $or: [
                    { fechaEntrada: { $gte: startDate, $lte: endDate } },
                    { fechaSalida: { $gte: startDate, $lte: endDate } }
                ]
            }).populate({ 
                path: 'cliente', 
                select: 'nombre empresa_id', 
                populate: { path: 'empresa_id', select: 'nombre' } 
            }).lean();
            const regIds = registrosPeriodo.map(r => r._id);
            const ventasPeriodo = await Venta.find({ registro: { $in: regIds } }).lean();

            const habs = await Habitacion.find().lean();
            const rankingHabs = habs.map(h => {
                const regs = registrosPeriodo.filter(r => r.habitacion?.toString() === h._id.toString());
                let income = regs.reduce((sum, r) => sum + (r.total || 0), 0);
                const vts = ventasPeriodo.filter(v => regs.some(r => r._id.toString() === v.registro?.toString()));
                income += vts.reduce((sum, v) => sum + (v.total || 0), 0);
                return { numero: h.numero, income, hotel: hotelLabel };
            });

            // 3. Pronóstico
            const reservasFuturas = await Reserva.find({
                estado: 'Pendiente',
                fecha_entrada: { $gte: moment.tz("America/Bogota").toDate(), $lte: next7Days }
            }).lean();
            const forecastReservas = reservasFuturas.reduce((sum, r) => sum + (r.valor_total || 0), 0);
            
            const checkoutsProximos = await Registro.find({
                estado: 'activo',
                fechaSalida: { $gte: moment.tz("America/Bogota").toDate(), $lte: next7Days }
            }).lean();
            const forecastCheckouts = checkoutsProximos.reduce((sum, r) => {
                const totalPagado = (r.pagos || []).reduce((s, p) => s + p.monto, 0);
                return sum + Math.max(0, (r.total || 0) - totalPagado);
            }, 0);

            // 4. Fidelidad (Registros por cliente)
            const allRegs = await Registro.find().lean();
            const clientCounts = {};
            const originCounts = {};
            
            const clientIdsForOrigins = [...new Set(allRegs.map(r => r.cliente?.toString()).filter(id => id))];
            const clientsWithOrigin = await Cliente.find({ _id: { $in: clientIdsForOrigins } }).select('municipio_origen_id').lean();
            const clientOriginMap = new Map(clientsWithOrigin.map(c => [c._id.toString(), c.municipio_origen_id?.toString()]));

            allRegs.forEach(r => {
                if (r.cliente) {
                    const cid = r.cliente.toString();
                    clientCounts[cid] = (clientCounts[cid] || 0) + 1;
                    
                    const oid = clientOriginMap.get(cid);
                    if (oid) {
                        originCounts[oid] = (originCounts[oid] || 0) + 1;
                    }
                }
            });

            // 5. Alertas de Precio
            const hotelConfig = await HotelConfigModel.findOne();
            const tolerance = (hotelConfig?.toleranciaPrecio || 10) / 100;

            const priceAnomalies = [];
            for (const r of registrosPeriodo) {
                const hab = habs.find(h => h._id.toString() === r.habitacion?.toString());
                if (!hab) continue;

                const numHuespedes = (r.huespedes?.length || 0) + 1;
                const recommendedPrice = hab[`precio_${Math.min(numHuespedes, 6)}`] || hab.precio_1 || 0;

                if (recommendedPrice > 0 && r.total < recommendedPrice * (1 - tolerance)) {
                    const diff = recommendedPrice - r.total;
                    const pct = Math.round((diff / recommendedPrice) * 100);
                    
                    priceAnomalies.push({
                        id: r._id,
                        habitacion: hab.numero,
                        precioCobrado: r.total,
                        precioRecomendado: recommendedPrice,
                        huespedes: numHuespedes,
                        hotel: hotelLabel,
                        huespedTitular: r.cliente?.nombre || 'Desconocido',
                        nombreEmpresa: r.cliente?.empresa_id?.nombre || null,
                        esEmpresa: !!r.cliente?.empresa_id,
                        diferenciaPct: pct,
                        fecha: r.fechaEntrada
                    });
                }
            }

            return {
                alerts: {
                    lowStock: lowStock.map(p => ({ nombre: p.nombre, stock: p.stock, hotel: hotelLabel })),
                    longStay: alertsLongStay.map(r => ({ id: r._id, habitacion: r.numero_habitacion, hotel: hotelLabel })),
                    lateCheckouts: lateCheckouts.map(r => ({ 
                        id: r._id, 
                        habitacion: r.habitacion?.numero, 
                        hotel: hotelLabel,
                        details: {
                            id: r._id,
                            habitacion: r.habitacion?.numero,
                            fechaSalidaProgramada: r.fechaSalida,
                            huespedTitular: r.cliente?.nombre || 'Desconocido',
                            nombreEmpresa: r.cliente?.empresa_id?.nombre || null,
                            esEmpresa: !!r.cliente?.empresa_id
                        }
                    })),
                    priceAnomalies
                },
                rankingHabs,
                forecast: forecastReservas + forecastCheckouts,
                clientCounts,
                originCounts
            };
        };

        const plaza = await fetchHotelStats({ Registro, Venta, Habitacion, Producto, Reserva, Cliente, HotelConfig: HotelConfig }, 'Plaza');
        const colonialModels = await getColonialModels();
        const colonial = await fetchHotelStats(colonialModels, 'Colonial');

        // Combinar Alertas
        const allAlerts = [
            ...plaza.alerts.lowStock.map(a => ({ type: 'STOCK', msg: `Bajo stock: ${a.nombre} (${a.stock})`, hotel: a.hotel })),
            ...plaza.alerts.longStay.map(a => ({ type: 'PAGO', msg: `Hab #${a.habitacion} ocupada > 3 días sin pagos`, hotel: a.hotel })),
            ...plaza.alerts.lateCheckouts.map(a => ({ type: 'TIME', msg: `Check-out vencido: Hab #${a.habitacion}`, hotel: a.hotel, details: a.details })),
            ...plaza.alerts.priceAnomalies.map(a => ({ 
                type: 'PRICE', 
                msg: `Hab #${a.habitacion}: Cobrado $${new Intl.NumberFormat().format(a.precioCobrado)} (Ref: $${new Intl.NumberFormat().format(a.precioRecomendado)})`, 
                hotel: a.hotel,
                details: a 
            })),
            ...colonial.alerts.lowStock.map(a => ({ type: 'STOCK', msg: `Bajo stock: ${a.nombre} (${a.stock})`, hotel: a.hotel })),
            ...colonial.alerts.longStay.map(a => ({ type: 'PAGO', msg: `Hab #${a.habitacion} ocupada > 3 días sin pagos`, hotel: a.hotel })),
            ...colonial.alerts.lateCheckouts.map(a => ({ type: 'TIME', msg: `Check-out vencido: Hab #${a.habitacion}`, hotel: a.hotel, details: a.details })),
            ...colonial.alerts.priceAnomalies.map(a => ({ 
                type: 'PRICE', 
                msg: `Hab #${a.habitacion}: Cobrado $${new Intl.NumberFormat().format(a.precioCobrado)} (Ref: $${new Intl.NumberFormat().format(a.precioRecomendado)})`, 
                hotel: a.hotel,
                details: a
            }))
        ];

        // Combinar Ranking
        const combinedRanking = [...plaza.rankingHabs, ...colonial.rankingHabs]
            .sort((a, b) => b.income - a.income)
            .slice(0, 10);

        // Pronóstico Total
        const totalForecast = plaza.forecast + colonial.forecast;

        // Fidelidad Consolidada
        // Fidelidad Consolidada
        const combinedClients = {};
        Object.keys(plaza.clientCounts).forEach(cid => { combinedClients[cid] = (combinedClients[cid] || 0) + plaza.clientCounts[cid]; });
        Object.keys(colonial.clientCounts).forEach(cid => { combinedClients[cid] = (combinedClients[cid] || 0) + colonial.clientCounts[cid]; });
        
        const topClientIds = Object.keys(combinedClients)
            .sort((a, b) => combinedClients[b] - combinedClients[a])
            .slice(0, 10);
        
        // Fetch clients from both DBs
        const plazaClients = await Cliente.find({ _id: { $in: topClientIds } }).lean();
        const colonialClients = await colonialModels.Cliente.find({ _id: { $in: topClientIds } }).lean();
        const allClientsInfo = [...plazaClients, ...colonialClients];

        const topClients = topClientIds.map(cid => {
            const c = allClientsInfo.find(x => x._id.toString() === cid);
            return {
                nombre: c?.nombre || 'Cliente Desconocido',
                documento: c?.documento || '-',
                count: combinedClients[cid]
            };
        });

        // Orígenes Consolidados
        const combinedOrigins = {};
        Object.keys(plaza.originCounts).forEach(oid => { combinedOrigins[oid] = (combinedOrigins[oid] || 0) + plaza.originCounts[oid]; });
        Object.keys(colonial.originCounts).forEach(oid => { combinedOrigins[oid] = (combinedOrigins[oid] || 0) + colonial.originCounts[oid]; });

        const topOriginIds = Object.keys(combinedOrigins)
            .sort((a, b) => combinedOrigins[b] - combinedOrigins[a])
            .slice(0, 10);
        
        const Municipio = require('../models/Municipio');
        const originsInfo = await Municipio.find({ _id: { $in: topOriginIds } }).lean();
        const topOrigins = topOriginIds.map(oid => {
            const m = originsInfo.find(x => x._id.toString() === oid);
            return {
                nombre: m?.nombre || 'Desconocido',
                count: combinedOrigins[oid]
            };
        });

        res.json({
            alerts: allAlerts,
            rankingHabs: combinedRanking,
            forecast: totalForecast,
            topClients,
            topOrigins
        });

    } catch (err) {
        console.error('[STATS CONSOLIDADAS ERROR]', err);
        res.status(500).json({ message: err.message });
    }
};

