const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');
const reservasAbonosRouter = require('./reservasAbonos');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', reservasController.getAllReservas);
router.post('/', reservasController.createReserva);
router.put('/:id', reservasController.updateReserva);
router.patch('/:id/estado', reservasController.updateReservaStatus);

// Abonos sub-routes
router.use('/:id/abonos', reservasAbonosRouter);

module.exports = router;

