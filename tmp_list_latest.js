const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Registro = require('./backend/models/Registro');
const Cliente = require('./backend/models/Cliente');
const Gasto = require('./backend/models/Gasto');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        const latestRegs = await Registro.find().sort({ fechaCreacion: -1 }).limit(10).populate('cliente').populate('habitacion');
        console.log('--- LATEST REGISTROS ---');
        latestRegs.forEach(r => {
            console.log(`ID: ${r._id}, Hab: ${r.habitacion?.numero}, Cliente: ${r.cliente?.nombre}, Estado: ${r.estado}, Creado: ${r.fechaCreacion}`);
        });

        const latestGastos = await Gasto.find().sort({ fecha: -1 }).limit(10);
        console.log('--- LATEST GASTOS/INGRESOS ---');
        latestGastos.forEach(g => {
            console.log(`ID: ${g._id}, Desc: ${g.descripcion}, Monto: ${g.monto}, Creado: ${g.fecha}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
