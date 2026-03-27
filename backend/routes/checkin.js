const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');
const { verifyToken } = require('../middleware/auth');

// Ruta PUBLICA (para el código QR)
router.post('/public', checkinController.createPublicCheckin);

// Rutas PRIVADAS (para el administrador)
router.get('/', verifyToken, checkinController.getPendingCheckins);
router.put('/:id', verifyToken, checkinController.updateCheckinStatus);
router.delete('/:id', verifyToken, checkinController.deleteCheckin);

module.exports = router;
