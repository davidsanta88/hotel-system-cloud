const express = require('express');
const router = express.Router();
const tiposHabitacionController = require('../controllers/tiposHabitacionController');
const auth = require('../middleware/auth');

router.use((req, res, next) => auth.verifyToken(req, res, next)); // Todas las rutas requieren autenticación

// Configurar tipos de habitación solo para administradores
router.route('/')
    .get(tiposHabitacionController.getTiposHabitacion)
    .post(auth.isAdmin, tiposHabitacionController.createTipoHabitacion);

router.route('/:id')
    .put(auth.isAdmin, tiposHabitacionController.updateTipoHabitacion)
    .delete(auth.isAdmin, tiposHabitacionController.deleteTipoHabitacion);

module.exports = router;
