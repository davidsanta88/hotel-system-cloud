const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');
const { verifyToken } = require('../middleware/auth');

// Solo administradores (SuperAdmin rol_id=1)
router.get('/logs', verifyToken, (req, res, next) => {
    if (req.userRole !== 1) return res.status(403).json({ error: 'No autorizado' });
    next();
}, auditoriaController.getLogs);

module.exports = router;
