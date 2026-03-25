const mongoose = require('mongoose');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function debugData() {
    try {
        await mongoose.connect(URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const reservaRaw = await db.collection('reservas').findOne({});
        
        console.log('--- RAW RESERVATION DATA (FIRST ONE) ---');
        console.log(JSON.stringify(reservaRaw, null, 2));

        if (reservaRaw) {
            if (reservaRaw.cliente) {
                const cliente = await db.collection('clientes').findOne({ _id: reservaRaw.cliente });
                console.log('--- CLIENT DATA ---');
                console.log(JSON.stringify(cliente, null, 2));
            }
            if (reservaRaw.habitacion) {
                const hab = await db.collection('habitaciones').findOne({ _id: reservaRaw.habitacion });
                console.log('--- ROOM DATA ---');
                console.log(JSON.stringify(hab, null, 2));
            }
            if (reservaRaw.habitaciones && reservaRaw.habitaciones.length > 0) {
                 const habFromArr = await db.collection('habitaciones').findOne({ _id: reservaRaw.habitaciones[0].habitacion || reservaRaw.habitaciones[0].id });
                 console.log('--- ROOM DATA FROM ARRAY ---');
                 console.log(JSON.stringify(habFromArr, null, 2));
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Debug Error:', err);
    }
}

debugData();
