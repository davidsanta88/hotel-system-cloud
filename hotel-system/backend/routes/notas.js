const express = require('express');
const router = express.Router();
const notasController = require('../controllers/notasController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Todas las rutas requieren token
router.use(verifyToken);

router.get('/', notasController.getAll);
router.get('/mis-alertas', notasController.getMyAlerts);
router.post('/', notasController.create);
router.put('/:id', notasController.update);
router.patch('/:id/leida', notasController.markAsRead);
router.delete('/:id', notasController.delete);

module.exports = router;
