const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const COLONIAL_URI = process.env.MONGO_URI_COLONIAL;

async function checkColonial() {
    const conn = await mongoose.createConnection(COLONIAL_URI);
    const Habitacion = conn.model('Habitacion', new mongoose.Schema({
        numero: Number,
        estado: { type: mongoose.Schema.Types.ObjectId, ref: 'EstadoHabitacion' },
        estadoLimpieza: String
    }));
    const EstadoHabitacion = conn.model('EstadoHabitacion', new mongoose.Schema({
        nombre: String
    }));
    const Registro = conn.model('Registro', new mongoose.Schema({
        habitacion: mongoose.Schema.Types.ObjectId,
        estado: String
    }));

    const habs = await Habitacion.find().populate('estado');
    const regs = await Registro.find({ estado: 'activo' });

    console.log('--- COLONIAL STATUS ---');
    console.log('Total Habs:', habs.length);
    console.log('Total Active Regs:', regs.length);
    
    habs.forEach(h => {
        const reg = regs.find(r => r.habitacion.toString() === h._id.toString());
        console.log(`Hab ${h.numero}: ${h.estado?.nombre || 'Unknown'} - Reg: ${reg ? 'Found' : 'None'}`);
    });

    process.exit(0);
}

checkColonial().catch(err => {
    console.error(err);
    process.exit(1);
});
