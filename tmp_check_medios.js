const mongoose = require('mongoose');
require('dotenv').config();
const MedioPago = require('./backend/models/MedioPago');

async function checkMediosPago() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const medios = await MedioPago.find();
        console.log('--- Medios de Pago ---');
        medios.forEach(m => console.log(`${m._id}: ${m.nombre}`));
        require('fs').writeFileSync('tmp_medios.json', JSON.stringify(medios, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkMediosPago();
