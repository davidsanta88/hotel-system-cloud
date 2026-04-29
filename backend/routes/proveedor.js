const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const auth = require('../middleware/auth');

router.get('/', auth, proveedorController.getProveedores);
router.get('/:id', auth, proveedorController.getProveedorById);
router.post('/', auth, proveedorController.createProveedor);
router.put('/:id', auth, proveedorController.updateProveedor);
router.delete('/:id', auth, proveedorController.deleteProveedor);

module.exports = router;
