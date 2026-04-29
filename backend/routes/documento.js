const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', verifyToken, documentoController.getDocumentos);
router.post('/', [verifyToken, isAdmin, upload.single('documento')], documentoController.uploadDocumento);
router.delete('/:id', [verifyToken, isAdmin], documentoController.deleteDocumento);

module.exports = router;
