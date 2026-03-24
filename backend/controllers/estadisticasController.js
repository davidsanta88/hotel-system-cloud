const { poolPromise, sql } = require('../config/db');

const estadisticasController = {
    getDashboardStats: async (req, res) => {
        try {
            const pool = await poolPromise;
            
            // 1. Ocupación Actual
            const totalRoomsRes = await pool.request().query('SELECT COUNT(*) as total FROM habitaciones');
            const occupiedRoomsRes = await pool.request().query("SELECT COUNT(*) as total FROM habitaciones WHERE estado_id = (SELECT id FROM estados_habitacion WHERE nombre = 'ocupada')");
            const totalRooms = totalRoomsRes.recordset[0].total || 1;
            const occupiedRooms = occupiedRoomsRes.recordset[0].total || 0;
            const occupancyRate = (occupiedRooms / totalRooms) * 100;

            // 2. Ingresos Mensuales (Últimos 6 meses)
            const monthlyRevenueRes = await pool.request().query(`
                SELECT 
                    FORMAT(fecha_creacion, 'MMMM', 'es-ES') as mes,
                    MONTH(fecha_creacion) as mes_num,
                    SUM(total) as revenue
                FROM (
                    SELECT total, fecha_creacion FROM registros WHERE estado = 'completada'
                    UNION ALL
                    SELECT total, fecha_creacion FROM ventas
                ) as combined
                WHERE fecha_creacion >= DATEADD(month, -6, GETDATE())
                GROUP BY FORMAT(fecha_creacion, 'MMMM', 'es-ES'), MONTH(fecha_creacion)
                ORDER BY MONTH(fecha_creacion)
            `);

            // 3. ADR (Average Daily Rate) - Mes Actual
            const adrRes = await pool.request().query(`
                SELECT 
                    AVG(total) as adr
                FROM registros 
                WHERE estado = 'completada' 
                AND MONTH(fecha_salida) = MONTH(GETDATE())
                AND YEAR(fecha_salida) = YEAR(GETDATE())
            `);
            const adr = adrRes.recordset[0].adr || 0;

            // 4. RevPAR (Revenue Per Available Room)
            const revpar = (adr * (occupancyRate / 100));

            // 5. Distribución por Tipo de Habitación
            const typeDistributionRes = await pool.request().query(`
                SELECT t.nombre, COUNT(h.id) as cantidad
                FROM habitaciones h
                JOIN tipos_habitacion t ON h.tipo_id = t.id
                WHERE h.estado_id = (SELECT id FROM estados_habitacion WHERE nombre = 'ocupada')
                GROUP BY t.nombre
            `);

            res.json({
                occupancyRate: Math.round(occupancyRate),
                occupiedRooms,
                totalRooms,
                adr: Math.round(adr),
                revpar: Math.round(revpar),
                monthlyRevenue: monthlyRevenueRes.recordset,
                typeDistribution: typeDistributionRes.recordset
            });
        } catch (err) {
            console.error('Error in stats:', err);
            res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
    }
};

module.exports = estadisticasController;
