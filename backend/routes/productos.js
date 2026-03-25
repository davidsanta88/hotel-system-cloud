const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para fotos de productos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/productos/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prod-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', verifyToken, productosController.getProductos);
router.post('/', [verifyToken, isAdmin], productosController.createProducto);
router.put('/:id', [verifyToken, isAdmin], productosController.updateProducto);
router.put('/:id/imagen', [verifyToken, isAdmin, upload.single('imagen')], productosController.uploadImagen);
router.patch('/:id/activo', [verifyToken, isAdmin], productosController.toggleActivo);
router.delete('/:id', [verifyToken, isAdmin], productosController.deleteProducto);


module.exports = router;
