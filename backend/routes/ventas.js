const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, ventasController.getVentas);
router.get('/:id', verifyToken, ventasController.getVentaDetails);
router.post('/', verifyToken, ventasController.createVenta);
router.put('/:id', verifyToken, ventasController.updateVenta);

// Consumos por habitación
router.post('/consumo', verifyToken, ventasController.createConsumoHabitacion);
router.get('/consumo/:registro_id', verifyToken, ventasController.getConsumosByRegistro);

module.exports = router;
