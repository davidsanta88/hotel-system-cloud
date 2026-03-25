const mongoose = require('mongoose');

const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function wipe() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(URI);
        console.log('Connected.');

        const db = mongoose.connection.db;
        
        console.log('Wiping Clientes...');
        await db.collection('clientes').deleteMany({});
        
        console.log('Wiping Reservas (to avoid broken links)...');
        await db.collection('reservas').deleteMany({});
        
        console.log('--- SYSTEM RESET COMPLETED ---');
        console.log('All clients and reservations have been deleted.');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Wipe Error:', err);
        process.exit(1);
    }
}

wipe();
