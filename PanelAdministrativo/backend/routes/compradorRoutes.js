const express = require('express');
const router = express.Router();
const { 
    registrarCompra, 
    aprobarCompra, 
    getCompradoresRifa,
    getComprasPendientes,
    getComprasAprobadas
} = require('../controllers/compradorController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Rutas para compradores
router.post('/', protect, admin, upload.single('comprobante'), registrarCompra);
router.put('/:id/aprobar', protect, admin, aprobarCompra);
router.get('/rifa/:rifaId', protect, admin, getCompradoresRifa);
router.get('/pendientes', protect, admin, getComprasPendientes);
router.get('/aprobadas', protect, admin, getComprasAprobadas);

module.exports = router;