// backend/scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');

mongoose.connect('mongodb://localhost:27017/rifas', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createAdmin() {
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('El usuario admin ya existe');
            return;
        }
        
        const admin = new Admin({
            username: 'admin',
            password: 'admin123',
            name: 'Administrador',
            email: 'admin@example.com'
        });
        
        await admin.save();
        console.log('Usuario admin creado exitosamente');
    } catch (error) {
        console.error('Error al crear usuario admin:', error);
    } finally {
        mongoose.disconnect();
    }
}

createAdmin();