const express = require('express');
const router = express.Router();
const tiposRegistroController = require('../controllers/tiposRegistroController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, tiposRegistroController.getAll);
router.post('/', verifyToken, isAdmin, tiposRegistroController.create);
router.put('/:id', verifyToken, isAdmin, tiposRegistroController.update);
router.delete('/:id', verifyToken, isAdmin, tiposRegistroController.delete);

module.exports = router;
