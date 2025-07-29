const Comprador = require('../models/Comprador');
const Rifa = require('../models/Rifa');
const nodemailer = require('nodemailer');
const Ticket = require('../models/Ticket'); // Modelo para tickets

exports.registrarCompra = async (req, res) => {
    try {
        const { rifaId, nombre, apellido, cedula, telefono, email, metodoPago } = req.body;
        
        // Verificar rifa activa
        const rifa = await Rifa.findById(rifaId);
        if (!rifa || rifa.estado !== 'activa') {
            return res.status(400).json({ message: 'Rifa no disponible' });
        }
        
        // Verificar límites de compra
        const comprasUsuario = await Comprador.countDocuments({ rifaId, cedula });
        if (comprasUsuario >= rifa.maxBoletos) {
            return res.status(400).json({ message: 'Límite de boletos alcanzado' });
        }
        
        const comprador = new Comprador({
            rifaId,
            nombre,
            apellido,
            cedula,
            telefono,
            email,
            metodoPago,
            comprobante: req.file ? req.file.path : null
        });
        
        await comprador.save();
        res.status(201).json(comprador);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.aprobarCompra = async (req, res) => {
    try {
        const comprador = await Comprador.findById(req.params.id);
        if (!comprador) return res.status(404).json({ message: 'Compra no encontrada' });
        
        if (comprador.aprobado) {
            return res.status(400).json({ message: 'Compra ya aprobada' });
        }
        
        // Generar ticket aleatorio
        const rifa = await Rifa.findById(comprador.rifaId);
        let ticket;
        let intentos = 0;
        const maxIntentos = 100;
        
        do {
            ticket = Math.floor(Math.random() * rifa.totalBoletos) + 1;
            const existe = await Ticket.findOne({ rifaId: comprador.rifaId, numero: ticket });
            if (!existe) break;
            intentos++;
        } while (intentos < maxIntentos);
        
        if (intentos >= maxIntentos) {
            return res.status(500).json({ message: 'No se pudo generar ticket' });
        }
        
        // Crear ticket
        const nuevoTicket = new Ticket({
            compradorId: comprador._id,
            rifaId: comprador.rifaId,
            numero: ticket,
            estado: 'asignado'
        });
        
        await nuevoTicket.save();
        
        // Actualizar comprador
        comprador.ticket = ticket;
        comprador.aprobado = true;
        await comprador.save();
        
        // Actualizar rifa
        rifa.boletosVendidos.push(ticket);
        await rifa.save();
        
        // Enviar correo
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: comprador.email,
            subject: '¡Tu boleto ha sido aprobado!',
            html: `
                <h1>¡Felicidades ${comprador.nombre}!</h1>
                <p>Tu compra para la rifa "${rifa.nombre}" ha sido aprobada.</p>
                <h2>Tu Número de Boleto</h2>
                <p style="font-size: 24px; font-weight: bold; color: #b21f1f;">${ticket}</p>
                <p>Guarda este número, lo necesitarás para reclamar tu premio si ganas.</p>
                <p>¡Mucha suerte!</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        
        res.json({ 
            message: 'Compra aprobada y correo enviado',
            ticket: ticket
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCompradoresRifa = async (req, res) => {
    try {
        const compradores = await Comprador.find({ rifaId: req.params.rifaId })
            .populate('rifaId', 'nombre')
            .sort({ fechaCompra: -1 });
        res.json(compradores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getComprasPendientes = async (req, res) => {
    try {
        const compradores = await Comprador.find({ aprobado: false })
            .populate('rifaId', 'nombre')
            .sort({ fechaCompra: -1 });
        res.json(compradores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getComprasAprobadas = async (req, res) => {
    try {
        const compradores = await Comprador.find({ aprobado: true })
            .populate('rifaId', 'nombre')
            .sort({ fechaCompra: -1 });
        res.json(compradores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generarTickets = async (req, res) => {
    try {
        const rifaId = req.params.rifaId;
        const compradores = await Comprador.find({ 
            rifaId, 
            aprobado: true,
            ticket: { $exists: false }
        });
        
        if (compradores.length === 0) {
            return res.json({ message: 'No hay compradores pendientes de asignar ticket' });
        }
        
        // Generar tickets aleatorios sin repetir
        const ticketsAsignados = await Ticket.find({ rifaId }).distinct('numero');
        const totalBoletos = await Rifa.findById(rifaId).then(r => r.totalBoletos);
        
        // Obtener boletos disponibles
        const boletosDisponibles = [];
        for (let i = 1; i <= totalBoletos; i++) {
            if (!ticketsAsignados.includes(i)) {
                boletosDisponibles.push(i);
            }
        }
        
        // Mezclar boletos disponibles
        for (let i = boletosDisponibles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [boletosDisponibles[i], boletosDisponibles[j]] = [boletosDisponibles[j], boletosDisponibles[i]];
        }
        
        // Asignar tickets
        for (let i = 0; i < compradores.length && i < boletosDisponibles.length; i++) {
            const comprador = compradores[i];
            const ticketNumero = boletosDisponibles[i];
            
            // Crear ticket
            const nuevoTicket = new Ticket({
                compradorId: comprador._id,
                rifaId: comprador.rifaId,
                numero: ticketNumero,
                estado: 'asignado'
            });
            
            await nuevoTicket.save();
            
            // Actualizar comprador
            comprador.ticket = ticketNumero;
            await comprador.save();
            
            // Enviar correo
            const rifa = await Rifa.findById(comprador.rifaId);
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: comprador.email,
                subject: '¡Tu boleto ha sido asignado!',
                html: `
                    <h1>¡Felicidades ${comprador.nombre}!</h1>
                    <p>Tu boleto para la rifa "${rifa.nombre}" ha sido asignado.</p>
                    <h2>Tu Número de Boleto</h2>
                    <p style="font-size: 24px; font-weight: bold; color: #b21f1f;">${ticketNumero}</p>
                    <p>Guarda este número, lo necesitarás para reclamar tu premio si ganas.</p>
                    <p>¡Mucha suerte!</p>
                `
            };
            
            await transporter.sendMail(mailOptions);
        }
        
        res.json({ 
            message: `Se han asignado ${compradores.length} tickets correctamente`,
            ticketsAsignados: compradores.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};