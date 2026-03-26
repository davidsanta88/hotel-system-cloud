const express = require('express');
const router = express.Router();
const municipiosController = require('../controllers/municipiosController');
const { verifyToken, checkPermission } = require('../middleware/auth');

router.get('/', verifyToken, municipiosController.getMunicipios);
router.post('/', [verifyToken, checkPermission('municipios', 'can_edit')], municipiosController.createMunicipio);
router.put('/:id', [verifyToken, checkPermission('municipios', 'can_edit')], municipiosController.updateMunicipio);
router.put('/:id', municipiosController.updateMunicipio);
router.delete('/:id', municipiosController.deleteMunicipio);
router.get('/fix/reseed', municipiosController.reseed); // Temporary fix trigger

module.exports = router;
