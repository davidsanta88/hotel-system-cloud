const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Registro = require('./backend/models/Registro');
const Gasto = require('./backend/models/Gasto');
const Habitacion = require('./backend/models/Habitacion');
const EstadoHabitacion = require('./backend/models/EstadoHabitacion');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        const regId = '67fbb43de101bd7c22968f';
        const gastoId = '67fbb434193da4c264e101bd';

        // 1. Delete Registro
        const delReg = await Registro.findByIdAndDelete(regId);
        console.log(delReg ? `Registro ${regId} deleted.` : `Registro ${regId} not found.`);

        // 2. Delete Gasto
        const delGasto = await Gasto.findByIdAndDelete(gastoId);
        console.log(delGasto ? `Gasto ${gastoId} deleted.` : `Gasto ${gastoId} not found.`);

        // 3. Reset Room 201 if it's "Sucia" or "En Uso"
        const hab201 = await Habitacion.findOne({ numero: 201 });
        if (hab201) {
            const estadoLimpia = await EstadoHabitacion.findOne({ nombre: /disponible|limpia/i });
            if (estadoLimpia) {
                await Habitacion.findByIdAndUpdate(hab201._id, { 
                    estado: estadoLimpia._id, 
                    estadoLimpieza: 'Limpia' 
                });
                console.log('Habitacion 201 reset to Disponible/Limpia.');
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
