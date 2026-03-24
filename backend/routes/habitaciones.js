const express = require('express');
const router = express.Router();
const habitacionesController = require('../controllers/habitacionesController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para fotos de habitaciones
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/habitaciones/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', verifyToken, habitacionesController.getHabitaciones);
router.post('/', [verifyToken, isAdmin], habitacionesController.createHabitacion);
router.put('/:id', [verifyToken, isAdmin], habitacionesController.updateHabitacion);
router.delete('/:id', [verifyToken, isAdmin], habitacionesController.deleteHabitacion);
router.patch('/:id/limpieza', verifyToken, habitacionesController.updateCleaningStatus);

// Rutas para fotos
router.post('/:id/fotos', [verifyToken, isAdmin, upload.array('fotos', 10)], habitacionesController.uploadFotos);
router.delete('/fotos/:id', [verifyToken, isAdmin], habitacionesController.deleteFoto);

module.exports = router;
