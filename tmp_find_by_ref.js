const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Registro = require('./backend/models/Registro');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        // Search for Registro with ID ending in 22968F
        const regs = await Registro.find({});
        const target = regs.find(r => r._id.toString().toUpperCase().endsWith('22968F'));
        
        if (target) {
            console.log('FOUND REGISTRO:', JSON.stringify(target, null, 2));
            const Cliente = require('./backend/models/Cliente');
            const clie = await Cliente.findById(target.cliente);
            console.log('CLIENTE:', JSON.stringify(clie, null, 2));
        } else {
            console.log('NOT FOUND in Registro. Checking Gasto...');
            const Gasto = require('./backend/models/Gasto');
            const gastos = await Gasto.find({});
            const targetG = gastos.find(g => g._id.toString().toUpperCase().endsWith('22968F'));
            if (targetG) {
                console.log('FOUND GASTO:', JSON.stringify(targetG, null, 2));
            } else {
                console.log('NOT FOUND in Gasto either.');
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
