const express = require('express');
const router = express.Router();
const { 
    crearRifa, 
    getRifas, 
    getRifaActiva, 
    finalizarRifa 
} = require('../controllers/rifaController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Rutas para rifas
router.post('/', protect, admin, upload.single('imagen'), crearRifa);
router.get('/', protect, admin, getRifas);
router.get('/activa', protect, admin, getRifaActiva);
router.put('/:id/finalizar', protect, admin, finalizarRifa);

module.exports = router;