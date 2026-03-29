const express = require('express');
const router = express.Router();
const hotelConfigController = require('../controllers/hotelConfigController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas de configuración requieren token
router.get('/', hotelConfigController.getConfig);
router.put('/', hotelConfigController.updateConfig);

module.exports = router;
