const mongoose = require('mongoose');
require('dotenv').config();

// Define a minimal schema for the script
const reservaSchema = new mongoose.Schema({
    valor_abonado: Number,
    abonos: [{ monto: Number }]
});

const Reserva = mongoose.model('Reserva', reservaSchema, 'reservas'); // Ensure correct collection name

async function run() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGODB_URI not found in environment');

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const reservas = await Reserva.find();
        let updatedCount = 0;

        for (const res of reservas) {
            const totalActual = res.abonos.reduce((sum, a) => sum + (parseFloat(a.monto) || 0), 0);
            
            if (res.valor_abonado !== totalActual) {
                console.log(`Updating Reserva ${res._id}: ${res.valor_abonado} -> ${totalActual}`);
                res.valor_abonado = totalActual;
                await res.save();
                updatedCount++;
            }
        }

        console.log(`Finished. Updated ${updatedCount} reservations.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
