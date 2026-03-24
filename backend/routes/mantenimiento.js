const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, mantenimientoController.getMantenimientos);
router.post('/', verifyToken, mantenimientoController.createMantenimiento);
router.put('/:id', verifyToken, mantenimientoController.updateMantenimiento);
router.delete('/:id', verifyToken, mantenimientoController.deleteMantenimiento);

module.exports = router;
