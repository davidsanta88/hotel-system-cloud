const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Registro = require('./backend/models/Registro');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Habitacion = require('./backend/models/Habitacion');
        const hab201 = await Habitacion.findOne({ numero: 201 });
        if (!hab201) {
            console.log('Habitacion 201 NOT FOUND');
            process.exit(0);
        }
        console.log('Habitacion 201 ID:', hab201._id);
        const regs = await Registro.find({ habitacion: hab201._id }).populate('cliente');
        console.log(`FOUND ${regs.length} registrations for Hab 201`);
        regs.forEach(r => {
            console.log(`ID: ${r._id}, Cliente: ${r.cliente?.nombre}, Estado: ${r.estado}, Creado: ${r.fechaCreacion}, Entrada: ${r.fechaEntrada}`);
            console.log(`Pagos: ${JSON.stringify(r.pagos)}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
