const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verifyToken, isAdmin, checkPermission } = require('../middleware/auth');

router.get('/ventas', verifyToken, checkPermission('reportes', 'v'), reportesController.getReporteVentas);
router.get('/productos-mas-vendidos', verifyToken, checkPermission('reportes', 'v'), reportesController.getProductosMasVendidos);
router.get('/resumen', verifyToken, checkPermission('dashboard', 'v'), reportesController.getResumenGeneral);
router.get('/gastos-periodo', verifyToken, checkPermission('reportes', 'v'), reportesController.getGastosPorPeriodo);
router.get('/ingresos-manuales', verifyToken, checkPermission('reportes', 'v'), reportesController.getIngresosManualesPorPeriodo);
router.get('/gastos-categoria', verifyToken, checkPermission('reportes', 'v'), reportesController.getGastosPorCategoria);
router.get('/ventas-mensuales', verifyToken, checkPermission('reportes', 'v'), reportesController.getVentasMensuales);
router.get('/ingresos-hospedaje', verifyToken, checkPermission('reportes', 'v'), reportesController.getIngresosHospedaje);
router.get('/cuadre-caja', verifyToken, checkPermission('cuadre_caja', 'v'), reportesController.getCuadreCaja);
router.get('/detalle-ingresos', verifyToken, checkPermission('reporte_ingresos', 'v'), reportesController.getDetalleIngresos);
router.get('/detalle-ingresos-consolidado', verifyToken, checkPermission('reporte_ingresos_consolidado', 'v'), reportesController.getDetalleIngresosConsolidado);
router.get('/huespedes', verifyToken, checkPermission('reportes', 'v'), reportesController.getReporteHuespedes);
router.get('/ingresos-calendario', verifyToken, checkPermission('reportes', 'v'), reportesController.getIngresosCalendario);
router.get('/detalle-dia-calendario', verifyToken, checkPermission('reportes', 'v'), reportesController.getDetalleDiaCalendario);
router.get('/ingresos-calendario-consolidado', verifyToken, checkPermission('calendario_ingresos', 'v'), reportesController.getIngresosCalendarioConsolidado);
router.get('/rentabilidad-habitaciones', verifyToken, checkPermission('reportes', 'v'), reportesController.getRentabilidadHabitaciones);
router.get('/rentabilidad-habitaciones-consolidado', verifyToken, checkPermission('rentabilidad', 'v'), reportesController.getRentabilidadConsolidada);
router.get('/mapa-habitaciones-consolidado', verifyToken, checkPermission('mapa_habitaciones_consolidado', 'v'), reportesController.getMapaHabitacionesConsolidado);
router.get('/stats-consolidado', verifyToken, checkPermission('dashboard', 'v'), reportesController.getStatsConsolidadas);

module.exports = router;
