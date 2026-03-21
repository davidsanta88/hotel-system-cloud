const { poolPromise, sql } = require('../config/db');

exports.getReporteVentas = async (req, res) => {
    try {
        const { inicio, fin } = req.query; // format: YYYY-MM-DD
        const pool = await poolPromise;
        const result = await pool.request()
            .input('inicio', sql.VarChar, inicio || '2000-01-01')
            .input('fin', sql.VarChar, fin || '2099-12-31')
            .query(`
                SELECT 
                    CAST(fecha AS DATE) as fecha,
                    SUM(total) as gran_total,
                    COUNT(id) as num_ventas
                FROM ventas
                WHERE fecha >= @inicio AND fecha <= @fin + ' 23:59:59'
                GROUP BY CAST(fecha AS DATE)
                ORDER BY fecha ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductosMasVendidos = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT TOP 10
                    p.nombre,
                    SUM(cantidad) as total_vendido,
                    SUM(subtotal) as total_recaudado
                FROM (
                    SELECT producto_id, cantidad, subtotal FROM detalle_ventas
                    UNION ALL
                    SELECT producto_id, cantidad, total as subtotal FROM consumos_habitacion
                ) as unified_sales
                JOIN productos p ON unified_sales.producto_id = p.id
                GROUP BY p.id, p.nombre
                ORDER BY total_vendido DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getResumenGeneral = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM habitaciones h JOIN estados_habitacion e ON h.estado_id = e.id WHERE LTRIM(RTRIM(UPPER(e.nombre))) = 'DISPONIBLE') as hab_disponibles,
                (SELECT COUNT(*) FROM habitaciones h JOIN estados_habitacion e ON h.estado_id = e.id WHERE LTRIM(RTRIM(UPPER(e.nombre))) = 'OCUPADA') as hab_ocupadas,
                (SELECT COUNT(*) FROM productos WHERE stock <= stock_minimo) as alertas_stock,
                (SELECT COUNT(*) FROM registros WHERE CAST(fecha_ingreso AS DATE) = CAST(GETDATE() AS DATE)) as registros_hoy,
                (ISNULL((SELECT SUM(total) FROM ventas WHERE CAST(fecha AS DATE) = CAST(GETDATE() AS DATE)), 0)) as ventas_hoy,
                (ISNULL((SELECT SUM(total) FROM ventas WHERE CAST(fecha AS DATE) = CAST(GETDATE() AS DATE)), 0) + 
                 ISNULL((SELECT SUM(valor_cobrado) FROM registros WHERE CAST(FechaCreacion AS DATE) = CAST(GETDATE() AS DATE)), 0)) as ingresos_hoy,
                (ISNULL((SELECT SUM(monto) FROM gastos WHERE CAST(fecha_gasto AS DATE) = CAST(GETDATE() AS DATE)), 0)) as egresos_hoy
        `);

        // Obtener actividad reciente
        const actividad = await pool.request().query(`
            SELECT TOP 5 r.id, c.nombre as cliente, h.numero as habitacion, r.fecha_ingreso as fecha, r.estado, 'registro' as tipo
            FROM registros r
            JOIN clientes c ON r.cliente_id = c.id
            JOIN habitaciones h ON r.habitacion_id = h.id
            ORDER BY r.FechaCreacion DESC;

            SELECT TOP 5 v.id, u.nombre as empleado, v.total, v.fecha, 'venta' as tipo
            FROM ventas v
            JOIN usuarios u ON v.empleado_id = u.id
            ORDER BY v.fecha DESC;
        `);

        res.json({
            ...result.recordset[0],
            recientes: {
                registros: actividad.recordsets[0],
                ventas: actividad.recordsets[1]
            }
        });
    } catch (err) {
        console.error('Error en getResumenGeneral:', err);
        res.status(500).json({ message: err.message });
    }
};
