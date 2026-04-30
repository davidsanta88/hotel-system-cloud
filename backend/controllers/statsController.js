const mongoose = require('mongoose');
const CierreCaja = require('../models/CierreCaja');
const Venta = require('../models/Venta');
const Registro = require('../models/Registro');
const Gasto = require('../models/Gasto');
const CategoriaGasto = require('../models/CategoriaGasto');
const Habitacion = require('../models/Habitacion');
const EstadoHabitacion = require('../models/EstadoHabitacion');
const Reserva = require('../models/Reserva');
const Cliente = require('../models/Cliente');

// Configuración para la conexión al Hotel Colonial
const COLONIAL_URI = process.env.COLONIAL_MONGODB_URI || 'mongodb+srv://admin:HotelColonial2026@cluster0.d1nbr5v.mongodb.net/HotelColonialDB?retryWrites=true&w=majority';

// Variable para mantener la conexión
let colonialConn = null;

const getColonialConnection = async () => {
    if (colonialConn && colonialConn.readyState === 1) return colonialConn;
    colonialConn = await mongoose.createConnection(COLONIAL_URI).asPromise();
    return colonialConn;
};

// Modelos para la conexión Colonial (usando los mismos esquemas)
const getColonialModels = async () => {
    const conn = await getColonialConnection();
    return {
        CierreCaja: conn.model('CierreCaja', CierreCaja.schema),
        Venta: conn.model('Venta', Venta.schema),
        Registro: conn.model('Registro', Registro.schema),
        Gasto: conn.model('Gasto', Gasto.schema),
        CategoriaGasto: conn.model('CategoriaGasto', CategoriaGasto.schema),
        Habitacion: conn.model('Habitacion', Habitacion.schema),
        EstadoHabitacion: conn.model('EstadoHabitacion', EstadoHabitacion.schema),
        Reserva: conn.model('Reserva', Reserva.schema),
        Cliente: conn.model('Cliente', Cliente.schema)
    };
};

exports.getComparativeStats = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        
        // Plaza Stats (Current DB)
        const plazaRooms = await getRoomCounts(Habitacion);
        const plazaData = await getStatsFromDB({
            Venta, Registro, Gasto
        }, inicio, fin, plazaRooms.total);

        // Cash Balances (From last closure to now)
        const plazaCash = await getCashBalance({
            CierreCaja, Venta, Registro, Gasto, Reserva
        });

        // Colonial Stats
        const colonialModels = await getColonialModels();
        const colonialRooms = await getRoomCounts(colonialModels.Habitacion);
        const colonialData = await getStatsFromDB(colonialModels, inicio, fin, colonialRooms.total);
        const colonialCash = await getCashBalance(colonialModels);

        res.json({
            plaza: {
                history: plazaData,
                rooms: plazaRooms,
                cash: plazaCash
            },
            colonial: {
                history: colonialData,
                rooms: colonialRooms,
                cash: colonialCash
            }
        });
    } catch (error) {
        console.error('Error fetching comparative stats:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas comparativas', error: error.message });
    }
};

exports.getConsolidatedReservations = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const moment = require('moment-timezone');
        
        let query = {
            estado: { $in: ['Confirmada', 'Pendiente'] }
        };

        if (inicio && fin) {
            query.fecha_entrada = {
                $gte: moment.tz(inicio, "America/Bogota").startOf('day').toDate(),
                $lte: moment.tz(fin, "America/Bogota").endOf('day').toDate()
            };
        } else {
            // Por defecto, traer desde hoy en adelante
            query.fecha_entrada = { $gte: moment.tz("America/Bogota").startOf('day').toDate() };
        }

        // Fetch Plaza Reservations
        const plazaReservas = await Reserva.find(query)
            .populate('cliente', 'nombre documento telefono')
            .sort({ fecha_entrada: 1 })
            .lean();

        const plazaFormatted = plazaReservas.map(r => ({
            ...r,
            hotel: 'Hotel Balcón Plaza',
            hotel_id: 'plaza',
            cliente_nombre: r.cliente?.nombre || 'Particular',
            documento: r.cliente?.documento || '-',
            habitaciones_desc: r.habitaciones?.map(h => h.numero).join(', ') || r.numero || '-'
        }));

        // Fetch Colonial Reservations
        const colonialModels = await getColonialModels();
        const colonialReservas = await colonialModels.Reserva.find(query)
            .populate('cliente', 'nombre documento telefono')
            .sort({ fecha_entrada: 1 })
            .lean();

        const colonialFormatted = colonialReservas.map(r => ({
            ...r,
            hotel: 'Hotel Balcón Colonial',
            hotel_id: 'colonial',
            cliente_nombre: r.cliente?.nombre || 'Particular',
            documento: r.cliente?.documento || '-',
            habitaciones_desc: r.habitaciones?.map(h => h.numero).join(', ') || r.numero || '-'
        }));

        // Combine and Sort
        const allReservas = [...plazaFormatted, ...colonialFormatted].sort((a, b) => 
            new Date(a.fecha_entrada) - new Date(b.fecha_entrada)
        );

        res.json(allReservas);
    } catch (error) {
        console.error('Error fetching consolidated reservations:', error);
        res.status(500).json({ message: 'Error al obtener reservaciones consolidadas', error: error.message });
    }
};

async function getRoomCounts(HabitacionModel) {
    try {
        const stats = await HabitacionModel.aggregate([
            {
                $lookup: {
                    from: 'estadohabitacions',
                    localField: 'estado',
                    foreignField: '_id',
                    as: 'estadoInfo'
                }
            },
            { $unwind: { path: '$estadoInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    nombreEstado: '$estadoInfo.nombre',
                    estadoLimpieza: 1
                }
            }
        ]);
        
        const result = { disponibles: 0, ocupadas: 0, aseo: 0, total: 0 };
        stats.forEach(s => {
            const nombre = (s.nombreEstado || '').toLowerCase();
            const limpieza = (s.estadoLimpieza || '').toLowerCase();
            
            if (limpieza === 'sucia') {
                result.aseo++;
            } else if (nombre.includes('disponible')) {
                result.disponibles++;
            } else if (nombre.includes('ocupada')) {
                result.ocupadas++;
            } else if (nombre.includes('aseo') || nombre.includes('limpieza') || nombre.includes('asear')) {
                result.aseo++;
            }
            result.total++;
        });
        return result;
    } catch (error) {
        console.error('Error counting rooms:', error);
        return { disponibles: 0, ocupadas: 0, total: 0 };
    }
}

async function getStatsFromDB(models, startDateStr, endDateStr, totalRooms = 1) {
    const { Venta, Registro, Gasto } = models;
    
    const moment = require('moment-timezone');
    const startDate = moment.tz(startDateStr, "America/Bogota").startOf('day').toDate();
    const endDate = moment.tz(endDateStr, "America/Bogota").endOf('day').toDate();

    // Determinar si debemos agrupar por mes o por día basándonos en el rango
    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const useMonthly = diffDays > 60;

    // 1. Aggregation for Venta (Income)
    const ventaStats = await Venta.aggregate([
        { $match: { fecha: { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: useMonthly ? { $month: { date: "$fecha", timezone: "America/Bogota" } } : { $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: "America/Bogota" } },
                total: { $sum: "$total" }
            }
        }
    ]);

    // 2. Aggregation for Registro (Income from pagos)
    const registroStats = await Registro.aggregate([
        { $unwind: "$pagos" },
        { $match: { "pagos.fecha": { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: useMonthly ? { $month: { date: "$pagos.fecha", timezone: "America/Bogota" } } : { $dateToString: { format: "%Y-%m-%d", date: "$pagos.fecha", timezone: "America/Bogota" } },
                total: { $sum: "$pagos.monto" }
            }
        }
    ]);

    // 3. Aggregation for Gasto (Expenses AND Manual Incomes)
    const gastoStats = await Gasto.aggregate([
        { $match: { fecha: { $gte: startDate, $lte: endDate } } },
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
                _id: useMonthly ? { $month: { date: "$fecha", timezone: "America/Bogota" } } : { $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: "America/Bogota" } },
                totalGasto: {
                    $sum: { $cond: [{ $eq: ["$catInfo.tipo", "Ingreso"] }, 0, "$monto"] }
                },
                totalIngreso: {
                    $sum: { $cond: [{ $eq: ["$catInfo.tipo", "Ingreso"] }, "$monto", 0] }
                }
            }
        }
    ]);

    // 4. Ocupación (Cálculo por día/mes)
    let occupancyMap = new Map();
    
    const registrosParaOcupacion = await Registro.find({
        $or: [
            { fechaEntrada: { $lte: endDate }, fechaSalida: { $gte: startDate } },
            { estado: 'activo' }
        ]
    }).select('fechaEntrada fechaSalida').lean();

    let current = moment.tz(startDate, "America/Bogota").startOf('day');
    const endRange = moment.tz(endDate, "America/Bogota").endOf('day');

    if (!useMonthly) {
        while (current.isBefore(endRange)) {
            const dateKey = current.format('YYYY-MM-DD');
            const dS = current.toDate();
            const dE = moment(current).endOf('day').toDate();

            const count = registrosParaOcupacion.filter(r => {
                const inD = r.fechaEntrada;
                const outD = r.fechaSalida || new Date();
                return inD <= dE && outD >= dS;
            }).length;

            occupancyMap.set(dateKey, (count / (totalRooms || 1)) * 100);
            current.add(1, 'day');
        }
    } else {
        // Modo Mensual: Calcular promedio de ocupación por mes
        const monthCounts = new Map(); // monthKey -> { sum: 0, count: 0 }
        
        while (current.isBefore(endRange)) {
            const monthKey = current.month() + 1; // 1-12
            const dS = current.toDate();
            const dE = moment(current).endOf('day').toDate();

            const count = registrosParaOcupacion.filter(r => {
                const inD = r.fechaEntrada;
                const outD = r.fechaSalida || new Date();
                return inD <= dE && outD >= dS;
            }).length;

            const existing = monthCounts.get(monthKey) || { sum: 0, days: 0 };
            existing.sum += (count / (totalRooms || 1)) * 100;
            existing.days += 1;
            monthCounts.set(monthKey, existing);
            
            current.add(1, 'day');
        }

        monthCounts.forEach((val, key) => {
            occupancyMap.set(key, val.sum / val.days);
        });
    }

    // Merge results
    const resultsMap = new Map();

    const addToMap = (stats, key) => {
        stats.forEach(s => {
            const entry = resultsMap.get(s._id) || { ingresos: 0, egresos: 0, hospedaje: 0, tienda: 0, otros: 0 };
            if (key === 'tienda') {
                entry.ingresos += s.total;
                entry.tienda += s.total;
            }
            else if (key === 'hospedaje') {
                entry.ingresos += s.total;
                entry.hospedaje += s.total;
            }
            else if (key === 'gastos_mixed') {
                entry.ingresos += s.totalIngreso || 0;
                entry.otros += s.totalIngreso || 0;
                entry.egresos += s.totalGasto || 0;
            }
            resultsMap.set(s._id, entry);
        });
    };

    addToMap(ventaStats, 'tienda');
    addToMap(registroStats, 'hospedaje');
    addToMap(gastoStats, 'gastos_mixed');

    // Convert to sorted array
    const sortedKeys = Array.from(resultsMap.keys()).sort();
    
    return sortedKeys.map(k => {
        const data = resultsMap.get(k);
        let label = k;
        let sortKey = k;
        if (useMonthly) {
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            label = months[parseInt(k) - 1];
            sortKey = parseInt(k);
        } else {
            // Formatear fecha para mostrar (DD/MM)
            try {
                const [y, m, d] = k.split('-');
                label = `${d}/${m}`;
                sortKey = k; // "YYYY-MM-DD" is sortable
            } catch (e) {
                label = k;
                sortKey = k;
            }
        }
        
        return {
            label,
            sortKey,
            fullDate: k,
            ingresos: data.ingresos,
            hospedaje: data.hospedaje,
            tienda: data.tienda,
            otros: data.otros,
            egresos: data.egresos,
            margen: data.ingresos - data.egresos,
            ocupacion: occupancyMap.get(useMonthly ? sortKey : k) || 0
        };
    });
}
async function getCashBalance(models) {
    try {
        const { CierreCaja, Venta, Registro, Gasto, Reserva } = models;
        
        // 1. Get last closure
        const ultimoCierre = await CierreCaja.findOne().sort({ fecha: -1 });
        const startDate = ultimoCierre ? ultimoCierre.fecha : new Date(0);
        const endDate = new Date();

        // Base amount from last closure
        const base = ultimoCierre ? (ultimoCierre.medios_pago?.efectivo || ultimoCierre.saldo_real || ultimoCierre.saldo_calculado || 0) : 0;

        // 2. Fetch Hospedaje Payments (Strictly after last closure)
        const pagosRegistros = await Registro.find({
            "pagos.fecha": { $gt: startDate, $lte: endDate }
        });

        // 3. Fetch Reserva Deposits
        const abonosReservas = await Reserva.find({
            "abonos.fecha": { $gt: startDate, $lte: endDate }
        });

        // 4. Fetch Product Sales
        const ventas = await Venta.find({
            fecha: { $gt: startDate, $lte: endDate }
        });

        // 5. Fetch Manual Expenses/Incomes
        const gastos = await Gasto.find({
            fecha: { $gt: startDate, $lte: endDate }
        }).populate('categoria');

        let cash = 0;
        let nequi = 0;
        let bancolombia = 0;

        const processMedio = (medio, monto) => {
            const m = (medio || '').toUpperCase();
            if (m.includes('NEQUI')) nequi += monto;
            else if (m.includes('BANCOLOMBIA') || m.includes('TRANS')) bancolombia += monto;
            else if (m.includes('EFECTIVO') || m === '') cash += monto;
            else cash += monto; // Default to cash for others if not specified
        };

        pagosRegistros.forEach(reg => {
            reg.pagos.forEach(p => {
                if (p.fecha > startDate && p.fecha <= endDate) {
                    processMedio(p.medio, p.monto);
                }
            });
        });

        abonosReservas.forEach(res => {
            res.abonos.forEach(a => {
                if (a.fecha > startDate && a.fecha <= endDate) {
                    processMedio(a.medio_pago, a.monto);
                }
            });
        });

        ventas.forEach(v => {
            processMedio(v.medioPago, v.total);
        });

        gastos.forEach(g => {
            const esIngreso = g.categoria?.tipo === 'Ingreso';
            const monto = esIngreso ? g.monto : -g.monto;
            processMedio(g.medioPago, monto);
        });

        return {
            efectivo: cash,
            nequi: nequi,
            bancolombia: bancolombia,
            total: cash + nequi + bancolombia,
            base: base,
            ultimaFecha: startDate
        };
    } catch (error) {
        console.error('Error calculating cash balance:', error);
        return { efectivo: 0, nequi: 0, bancolombia: 0, total: 0, base: 0 };
    }
}

module.exports = exports;
