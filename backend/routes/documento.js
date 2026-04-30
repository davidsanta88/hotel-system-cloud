const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.get('/', documentoController.getDocumentos);
router.get('/download/:id', documentoController.downloadDocumento);
router.post('/', [isAdmin, upload.single('documento')], documentoController.uploadDocumento);
router.delete('/:id', [isAdmin], documentoController.deleteDocumento);

module.exports = router;
