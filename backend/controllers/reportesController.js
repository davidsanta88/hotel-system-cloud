const Venta = require('../models/Venta');
const Registro = require('../models/Registro');
const Gasto = require('../models/Gasto');
const Habitacion = require('../models/Habitacion');
const Producto = require('../models/Producto');
const Reserva = require('../models/Reserva');
const Usuario = require('../models/Usuario');

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
        
        const hoy = new Date(Date.now() - (5 * 60 * 60 * 1000));
        hoy.setUTCHours(0, 0, 0, 0);
        const mañana = new Date(hoy);
        mañana.setUTCDate(hoy.getUTCDate() + 1);

        const registros_hoy = await Registro.countDocuments({ fechaCreacion: { $gte: hoy, $lt: mañana } });
        
        // 1. Egresos e Ingresos manuales del día (desde la colección Gasto)
        const movimientos_manuales = await Gasto.aggregate([
            { $match: { fecha: { $gte: hoy, $lt: mañana } } },
            {
                $lookup: {
                    from: 'categoriagastos',
                    localField: 'categoria',
                    foreignField: '_id',
                    as: 'catInfo'
                }
            },
            { $unwind: '$catInfo' },
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
            { $unwind: '$catInfo' },
            { $match: { 'catInfo.tipo': 'Gasto' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
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
            { $unwind: '$catInfo' },
            { $match: { 'catInfo.tipo': 'Ingreso' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
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
            { $unwind: '$catInfo' },
            { $match: { 'catInfo.tipo': 'Gasto' } },
            {
                $group: {
                    _id: "$catInfo.nombre",
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
                    _id: { $dateToString: { format: "%Y-%m", date: "$fecha" } },
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
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$pagos.fecha" } },
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

exports.getCuadreCaja = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        // Map string to exact local boundaries to prevent UTC mismatch
        let startDate = inicio ? (inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T00:00:00-05:00`)) : new Date();
        if (!inicio) startDate.setHours(0,0,0,0);
        
        let endDate = fin ? (fin.includes('T') ? new Date(fin) : new Date(`${fin}T23:59:59-05:00`)) : new Date();
        if (!fin) endDate.setHours(23,59,59,999);

        console.log(`[DEBUG CUADRE] inicio=${inicio} | fin=${fin}`);
        console.log(`[DEBUG CUADRE] Parsed startDate=${startDate.toISOString()} | endDate=${endDate.toISOString()}`);

        // 1. Pagos de Registros (Hospedajes)
        const pagosRegistros = await Registro.find({
            "pagos.fecha": { $gte: startDate, $lte: endDate }
        }).populate('cliente', 'nombre').populate('habitacion', 'numero');

        let transacciones = [];

        pagosRegistros.forEach(reg => {
            reg.pagos.forEach(pago => {
                if (pago.fecha >= startDate && pago.fecha <= endDate) {
                    transacciones.push({
                        fecha: pago.fecha,
                        tipo: 'HOSPEDAJE',
                        descripcion: `Pago Hab ${reg.habitacion?.numero || 'S/N'} - ${reg.cliente?.nombre || 'Huésped'}`,
                        usuario: pago.usuario_nombre || reg.usuarioCreacion,
                        medioPago: (pago.medio || 'EFECTIVO').toUpperCase(),
                        monto: pago.monto,
                        id_ref: reg._id
                    });
                }
            });
        });

        // 2. Abonos de Reservas
        const abonosReservas = await Reserva.find({
            "abonos.fecha": { $gte: startDate, $lte: endDate }
        }).populate('cliente', 'nombre');

        abonosReservas.forEach(reserva => {
            reserva.abonos.forEach(abono => {
                if (abono.fecha >= startDate && abono.fecha <= endDate) {
                    transacciones.push({
                        fecha: abono.fecha,
                        tipo: 'RESERVA',
                        descripcion: `Abono Reserva - ${reserva.cliente?.nombre || 'Cliente'}`,
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
        }).populate('empleado', 'nombre');

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

        console.log(`[DEBUG CUADRE] Found: pagosRegistros=${pagosRegistros.length}, abonosReservas=${abonosReservas.length}, ventas=${ventas.length}, gastos=${gastos.length}`);

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
