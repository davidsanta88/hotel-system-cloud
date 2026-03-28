const mongoose = require('mongoose');
const Habitacion = require('./models/Habitacion');
const Registro = require('./models/Registro');
const Reserva = require('./models/Reserva');
require('dotenv').config();

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const hCount = await Habitacion.countDocuments();
        const rCount = await Registro.countDocuments({ estado: 'activo' });
        const resCount = await Reserva.countDocuments({ estado: { $in: ['Confirmada', 'Pendiente'] } });

        console.log(`Habitaciones: ${hCount}`);
        console.log(`Registros Activos: ${rCount}`);
        console.log(`Reservas Pendientes/Conf: ${resCount}`);

        const firstHab = await Habitacion.findOne().populate('estado');
        console.log('Sample Hab:', firstHab ? { 
            numero: firstHab.numero, 
            estado: firstHab.estado ? firstHab.estado.nombre : 'No state' 
        } : 'None');

        process.exit(0);
    } catch (err) {
        console.error('Diagnosis failed:', err);
        process.exit(1);
    }
}

diagnose();
