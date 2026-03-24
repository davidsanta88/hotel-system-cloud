const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/ventas', verifyToken, isAdmin, reportesController.getReporteVentas);
router.get('/productos-mas-vendidos', verifyToken, isAdmin, reportesController.getProductosMasVendidos);
router.get('/resumen', verifyToken, isAdmin, reportesController.getResumenGeneral);
router.get('/gastos-periodo', verifyToken, isAdmin, reportesController.getGastosPorPeriodo);
router.get('/gastos-categoria', verifyToken, isAdmin, reportesController.getGastosPorCategoria);
router.get('/ventas-mensuales', verifyToken, isAdmin, reportesController.getVentasMensuales);
router.get('/ingresos-hospedaje', verifyToken, isAdmin, reportesController.getIngresosHospedaje);

module.exports = router;
