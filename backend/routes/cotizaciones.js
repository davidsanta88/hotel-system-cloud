const express = require('express');
const router = express.Router();
const cotizacionesController = require('../controllers/cotizacionesController');

router.get('/', cotizacionesController.getCotizaciones);
router.get('/:id', cotizacionesController.getCotizacionById);
router.post('/', cotizacionesController.createCotizacion);
router.put('/:id', cotizacionesController.updateCotizacion);
router.put('/:id/status', cotizacionesController.updateCotizacionStatus);
router.delete('/:id', cotizacionesController.deleteCotizacion);

module.exports = router;
