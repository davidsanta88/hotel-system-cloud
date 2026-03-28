const express = require('express');
const router = express.Router();
const habitacionesController = require('../controllers/habitacionesController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para fotos de habitaciones (Memory Storage para Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.get('/', verifyToken, habitacionesController.getHabitaciones);
router.get('/mapa-visual', verifyToken, habitacionesController.getMapaVisual);
router.post('/', [verifyToken, isAdmin], habitacionesController.createHabitacion);
router.put('/:id', [verifyToken, isAdmin], habitacionesController.updateHabitacion);
router.delete('/:id', [verifyToken, isAdmin], habitacionesController.deleteHabitacion);
router.patch('/:id/limpieza', verifyToken, habitacionesController.updateCleaningStatus);

// Rutas para fotos
router.post('/:id/fotos', [verifyToken, isAdmin, upload.array('fotos', 10)], habitacionesController.uploadFotos);
router.delete('/fotos/:id/:index', [verifyToken, isAdmin], habitacionesController.deleteFoto);

module.exports = router;
