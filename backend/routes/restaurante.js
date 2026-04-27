const express = require('express');
const router = express.Router();
const restauranteController = require('../controllers/restauranteController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas protegidas por auth
router.use(verifyToken);

router.get('/mesas', restauranteController.getMesas);
router.post('/mesas/seed', restauranteController.seedMesas);
router.post('/comandas/abrir', restauranteController.abrirComanda);
router.post('/comandas/items', restauranteController.agregarItems);
router.get('/comandas/activa/:mesaId', restauranteController.getComandaActiva);
router.get('/comandas/historial', restauranteController.getHistorial);
router.post('/comandas/cerrar', restauranteController.cerrarComanda);

module.exports = router;
