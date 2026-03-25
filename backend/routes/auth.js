const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/ping', (req, res) => res.json({ status: 'auth-ok', version: '1.0.3' }));
router.post('/register', authController.register);
router.post('/setup-admin', authController.setupInitialAdmin);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
