const express = require('express');
const router = express.Router();
const aliadoController = require('../controllers/aliadoController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.get('/', aliadoController.getAliados);
router.post('/', [verifyToken, isAdmin, upload.single('logo')], aliadoController.createAliado);
router.put('/:id', [verifyToken, isAdmin, upload.single('logo')], aliadoController.updateAliado);
router.delete('/:id', [verifyToken, isAdmin], aliadoController.deleteAliado);

module.exports = router;
