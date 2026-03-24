const express = require('express');
const router = express.Router();
const estadisticasController = require('../controllers/estadisticasController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Solo administradores
router.get('/dashboard', [verifyToken, isAdmin], estadisticasController.getDashboardStats);

module.exports = router;
