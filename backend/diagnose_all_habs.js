const mongoose = require('mongoose');
const Habitacion = require('./models/Habitacion');
const EstadoHabitacion = require('./models/EstadoHabitacion');
require('dotenv').config();

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const habs = await Habitacion.find().populate('estado');
        console.log(`Total Habs: ${habs.length}`);
        
        const summary = habs.map(h => ({
            num: h.numero,
            estado: h.estado ? h.estado.nombre : 'NULL',
            limpieza: h.estadoLimpieza
        }));

        console.table(summary);

        const estados = await EstadoHabitacion.find();
        console.log('Available States in DB:', estados.map(e => e.nombre));

        process.exit(0);
    } catch (err) {
        console.error('Diagnosis failed:', err);
        process.exit(1);
    }
}

diagnose();
