const express = require('express');
const router = express.Router();
const registrosController = require('../controllers/registrosController');
const registrosPagosRouter = require('./registrosPagos');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, registrosController.getRegistros);
router.get('/activos', verifyToken, registrosController.getActiveRegistros);
router.get('/:id', verifyToken, registrosController.getRegistroById);
router.post('/', verifyToken, registrosController.createRegistro);
router.post('/checkin-reserva/:id', verifyToken, registrosController.checkinFromReserva);
router.put('/checkout/:id', verifyToken, registrosController.checkout);
router.put('/anular/:id', verifyToken, registrosController.anular);
router.put('/:id', verifyToken, registrosController.updateRegistro);
router.delete('/:id', verifyToken, registrosController.deleteRegistro);

// Pagos/Abonos sub-routes
router.use('/:id/pagos', verifyToken, registrosPagosRouter);

module.exports = router;
