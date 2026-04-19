const express = require('express');
const router = express.Router();
const auditoriaLimpiezaController = require('../controllers/auditoriaLimpiezaController');

router.get('/', auditoriaLimpiezaController.getAuditorias);
router.post('/', auditoriaLimpiezaController.createAuditoria);
router.delete('/:id', auditoriaLimpiezaController.deleteAuditoria);

module.exports = router;
