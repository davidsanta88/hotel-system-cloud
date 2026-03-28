const mongoose = require('mongoose');
require('dotenv').config();
const Reserva = require('./backend/models/Reserva');
const Habitacion = require('./backend/models/Habitacion');

async function checkRoom204() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const hab = await Habitacion.findOne({ numero: '204' });
        if (!hab) {
            console.log('Hab 204 not found');
            return;
        }
        console.log('Hab 204 ID:', hab._id);
        
        const reservas = await Reserva.find({ 
            habitacion: hab._id,
            estado: { $in: ['Confirmada', 'Pendiente'] }
        }).populate('cliente');
        
        console.log('Reservas found:', reservas.length);
        reservas.forEach(r => {
            console.log('--- Reserva ---');
            console.log('Cliente:', r.cliente ? r.cliente.nombre : 'N/A');
            console.log('Fecha Entrada:', r.fecha_entrada);
            console.log('Fecha Salida:', r.fecha_salida);
            console.log('Estado:', r.estado);
        });
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkRoom204();
