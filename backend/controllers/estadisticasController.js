const Habitacion = require('../models/Habitacion');
const Registro = require('../models/Registro');
const Venta = require('../models/Venta');

const estadisticasController = {
    getDashboardStats: async (req, res) => {
        try {
            const totalRooms = await Habitacion.countDocuments();
            const occupiedRooms = await Habitacion.countDocuments({ estado: { $regex: /ocupada/i } });
            const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

            // Ingresos mensuales (ejemplo simplificado con agregación)
            const monthlyRevenue = await Venta.aggregate([
                {
                    $group: {
                        _id: { $month: "$fecha" },
                        revenue: { $sum: "$total" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            res.json({
                occupancyRate: Math.round(occupancyRate),
                occupiedRooms,
                totalRooms,
                adr: 0, // Cálculo pendiente
                revpar: 0,
                monthlyRevenue: monthlyRevenue.map(m => ({ mes: m._id, revenue: m.revenue })),
                typeDistribution: []
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = estadisticasController;
