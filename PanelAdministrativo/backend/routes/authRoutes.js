const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Buscar al usuario
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }
        
        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }
        
        // Generar token
        const token = jwt.sign(
            { id: admin._id, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Ruta de verificación de token
router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (error) {
        res.status(401).json({ valid: false, message: 'Token inválido' });
    }
});

module.exports = router;