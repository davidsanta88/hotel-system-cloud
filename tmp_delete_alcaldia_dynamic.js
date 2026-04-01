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

        const searchAmount = 1120000;
        const searchPattern = /ALCALDIA/i;

        // Find Registro by payment amount and description suffix or client name
        const regs = await Registro.find({ 'pagos.monto': searchAmount }).populate('cliente');
        const targetReg = regs.find(r => r.cliente?.nombre?.match(searchPattern) || r._id.toString().toLowerCase().endsWith('22968f'));
        
        if (targetReg) {
            console.log(`Deleting Registro ID: ${targetReg._id} (${targetReg.cliente?.nombre})`);
            await Registro.findByIdAndDelete(targetReg._id);
        } else {
            console.log('Registro target not found by amount/pattern.');
        }

        // Find Gasto by amount and description
        const targetGasto = await Gasto.findOne({ monto: searchAmount, descripcion: searchPattern });
        if (targetGasto) {
            console.log(`Deleting Gasto ID: ${targetGasto._id} (${targetGasto.descripcion})`);
            await Gasto.findByIdAndDelete(targetGasto._id);
        } else {
            console.log('Gasto target not found by amount/pattern.');
        }

        // Reset Room 201
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
