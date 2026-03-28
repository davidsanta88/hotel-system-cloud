const mongoose = require('mongoose');
require('dotenv').config();
const Reserva = require('./backend/models/Reserva');
const Habitacion = require('./backend/models/Habitacion');

async function checkRoom204() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');
        const hab = await Habitacion.findOne({ numero: '204' });
        if (!hab) {
            console.log('Hab 204 not found');
            return;
        }
        
        const reservas = await Reserva.find({ 
            habitacion: hab._id,
            estado: { $in: ['Confirmada', 'Pendiente'] }
        }).populate('cliente');
        
        console.log('--- Room #204 ---');
        console.log('Status Clean:', hab.estadoLimpieza);
        
        const data = {
            habitacion: hab.numero,
            estadoLimpieza: hab.estadoLimpieza,
            reservas: reservas.map(r => ({
                cliente: r.cliente ? r.cliente.nombre : 'N/A',
                entrada: r.fecha_entrada,
                salida: r.fecha_salida,
                estado: r.estado
            }))
        };
        
        require('fs').writeFileSync('tmp_debug_res.json', JSON.stringify(data, null, 2));
        console.log('Results written to tmp_debug_res.json');
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkRoom204();
