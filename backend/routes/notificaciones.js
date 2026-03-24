const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController');
const { verifyToken } = require('../middleware/auth');

// Rutas protegidas para administrador
router.get('/settings', verifyToken, notificacionesController.getSettings);
router.post('/settings', verifyToken, notificacionesController.updateSettings);

module.exports = router;
