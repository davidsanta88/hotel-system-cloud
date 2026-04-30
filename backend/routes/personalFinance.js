const express = require('express');
const router = express.Router();
const { 
    getPersonalFinances, 
    createPersonalFinance, 
    deletePersonalFinance,
    getPersonalCategories,
    createPersonalCategory,
    deletePersonalCategory
} = require('../controllers/personalFinanceController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Finanzas
router.get('/', getPersonalFinances);
router.post('/', createPersonalFinance);
router.delete('/:id', deletePersonalFinance);

// Categorías
router.get('/categories', getPersonalCategories);
router.post('/categories', createPersonalCategory);
router.delete('/categories/:id', deletePersonalCategory);

module.exports = router;
