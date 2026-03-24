const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');
const { verifyToken } = require('../middleware/auth');

// Ruta pública para clientes
router.post('/', solicitudesController.crearSolicitud);

// Rutas protegidas para administrador
router.get('/', verifyToken, solicitudesController.getSolicitudes);
router.put('/:id', verifyToken, solicitudesController.actualizarEstado);

module.exports = router;
