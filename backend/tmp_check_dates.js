require('dotenv').config();
const mongoose = require('mongoose');
const Gasto = require('./backend/models/Gasto');

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const last3 = await Gasto.find().sort({ _id: -1 }).limit(3);
    console.log("LAST 3 GASTOS:");
    last3.forEach(g => {
        console.log(`ID: ${g._id}, Desc: ${g.descripcion}, Fecha: ${g.fecha.toISOString()} (${g.fecha})`);
    });
    
    const now = new Date();
    console.log("SERVER NOW:", now.toISOString());
    process.exit(0);
}
check();
