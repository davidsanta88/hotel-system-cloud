const express = require('express');
const router = express.Router();
const registrosController = require('../controllers/registrosController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, registrosController.getRegistros);
router.get('/activos', verifyToken, registrosController.getActiveRegistros);
router.get('/:id', verifyToken, registrosController.getRegistroById);
router.post('/', verifyToken, registrosController.createRegistro);
router.put('/checkout/:id', verifyToken, registrosController.checkout);
router.put('/anular/:id', verifyToken, registrosController.anular);
router.put('/:id', verifyToken, registrosController.updateRegistro);
router.delete('/:id', verifyToken, registrosController.deleteRegistro);

module.exports = router;
