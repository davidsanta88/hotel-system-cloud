const Habitacion = require('../models/Habitacion');
const Registro = require('../models/Registro');
const Venta = require('../models/Venta');
const moment = require('moment-timezone');

const TipoHabitacion = require('../models/TipoHabitacion');
const EstadoHabitacion = require('../models/EstadoHabitacion');

const estadisticasController = {
    getDashboardStats: async (req, res) => {
        try {
            // 1. Ocupación
            const totalRooms = await Habitacion.countDocuments();
            
            // Buscar ID de estado Ocupada
            const estadoOcupado = await EstadoHabitacion.findOne({ nombre: { $regex: /ocupada/i } });
            const occupiedRooms = estadoOcupado ? await Habitacion.countDocuments({ estado: estadoOcupado._id }) : 0;
            const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

            // 2. ADR (Average Daily Rate) aproximado usando Registros activos
            const registrosActivos = await Registro.find({ estado: 'activo' });
            let totalAdr = 0;
            let countAdr = 0;
            registrosActivos.forEach(reg => {
                const dias = reg.fechaSalida && reg.fechaEntrada 
                    ? Math.max(1, Math.ceil((new Date(reg.fechaSalida) - new Date(reg.fechaEntrada)) / (1000 * 60 * 60 * 24)))
                    : 1;
                if (reg.total > 0) {
                    totalAdr += (reg.total / dias);
                    countAdr++;
                }
            });
            const adr = countAdr > 0 ? totalAdr / countAdr : 0;

            // 3. RevPAR (Revenue Per Available Room)
            const revpar = adr * (occupancyRate / 100);

            // 4. Ingresos Mensuales (Últimos 6 meses)
            const sixMonthsAgo = moment.tz("America/Bogota").subtract(5, 'months').startOf('month').toDate();

            const ventasAgregadas = await Venta.aggregate([
                { $match: { fecha: { $gte: sixMonthsAgo } } },
                { $group: { _id: { 
                    year: { $year: { date: "$fecha", timezone: "America/Bogota" } }, 
                    month: { $month: { date: "$fecha", timezone: "America/Bogota" } } 
                }, total: { $sum: "$total" } } }
            ]);

            const registrosAgregados = await Registro.aggregate([
                { $unwind: "$pagos" },
                { $match: { "pagos.fecha": { $gte: sixMonthsAgo } } },
                { $group: { _id: { 
                    year: { $year: { date: "$pagos.fecha", timezone: "America/Bogota" } }, 
                    month: { $month: { date: "$pagos.fecha", timezone: "America/Bogota" } } 
                }, total: { $sum: "$pagos.monto" } } }
            ]);

            // Consolidar ultimos 6 meses
            const mesesStr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const monthlyRevenue = [];
            
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const rmYear = d.getFullYear();
                const rmMonth = d.getMonth() + 1; // 1-12
                
                const v = ventasAgregadas.find(x => x._id.year === rmYear && x._id.month === rmMonth);
                const r = registrosAgregados.find(x => x._id.year === rmYear && x._id.month === rmMonth);
                
                const rv = (v ? v.total : 0);
                const rr = (r ? r.total : 0);
                
                monthlyRevenue.push({
                    mes: `${mesesStr[rmMonth - 1]} ${rmYear.toString().slice(2)}`,
                    revenue: rv + rr
                });
            }

            // 5. Distribución de Habitaciones por Tipo (para el PIE chart)
            const typeDist = await Habitacion.aggregate([
                { $lookup: { from: 'tipohabitacions', localField: 'tipo', foreignField: '_id', as: 'tipoInfo' } },
                { $unwind: '$tipoInfo' },
                { $group: { _id: '$tipoInfo.nombre', cantidad: { $sum: 1 } } }
            ]);
            
            const typeDistribution = typeDist.map(t => ({ nombre: t._id, cantidad: t.cantidad }));

            res.json({
                occupancyRate: Math.round(occupancyRate),
                occupiedRooms,
                totalRooms,
                adr: Math.round(adr),
                revpar: Math.round(revpar),
                monthlyRevenue,
                typeDistribution
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = estadisticasController;
