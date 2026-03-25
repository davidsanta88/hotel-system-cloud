const mongoose = require('mongoose');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.pb5rtli.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function diagnose() {
    try {
        await mongoose.connect(URI);
        console.log('--- CONNECTED TO MONGODB ---');

        const db = mongoose.connection.db;
        const reservas = await db.collection('reservas').find({}).limit(10).toArray();
        
        console.log(`Checking ${reservas.length} reservations...`);

        for (const r of reservas) {
            console.log(`\nReserva ID: ${r._id}`);
            console.log(`  cliente field: ${r.cliente} (${typeof r.cliente})`);
            console.log(`  habitacion field: ${r.habitacion} (${typeof r.habitacion})`);
            console.log(`  habitaciones: ${JSON.stringify(r.habitaciones)}`);
            console.log(`  fechaInicio: ${r.fechaInicio}`);
            console.log(`  fechaFin: ${r.fechaFin}`);

            if (r.cliente) {
                // Try searching with both ObjectId and String if needed
                const clienteObj = await db.collection('clientes').findOne({ _id: r.cliente });
                const clienteStr = await db.collection('clientes').findOne({ _id: r.cliente.toString() });
                console.log(`  Cliente search: ${clienteObj ? 'FOUND' : 'NOT FOUND (ObjId)'} | ${clienteStr ? 'FOUND' : 'NOT FOUND (Str)'}`);
            }

            if (r.habitacion) {
                const habObj = await db.collection('habitaciones').findOne({ _id: r.habitacion });
                const habStr = await db.collection('habitaciones').findOne({ _id: r.habitacion.toString() });
                console.log(`  Habitacion search: ${habObj ? 'FOUND' : 'NOT FOUND (ObjId)'} | ${habStr ? 'FOUND' : 'NOT FOUND (Str)'}`);
            }
        }

        const totalClientes = await db.collection('clientes').countDocuments();
        const totalHabs = await db.collection('habitaciones').countDocuments();
        console.log(`\nTotal Clientes in DB: ${totalClientes}`);
        console.log(`Total Habitaciones in DB: ${totalHabs}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Diagnostic error:', err);
    }
}

diagnose();
