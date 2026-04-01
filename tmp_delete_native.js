const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        console.log('Connected to MongoDB Native');
        const db = client.db(); // Uses the DB from URI or default
        
        const regCollection = db.collection('registros');
        const gastoCollection = db.collection('gastos');

        // Delete Registration with suffix 22968f
        const regResult = await regCollection.deleteMany({ _id: { $regex: /22968f$/i } });
        console.log(`Deleted ${regResult.deletedCount} registrations.`);

        // Delete Gasto with description ALCALDIA
        const gastoResult = await gastoCollection.deleteMany({ descripcion: /ALCALDIA/i, monto: 1120000 });
        console.log(`Deleted ${gastoResult.deletedCount} gastos.`);

        // Reset Room 201
        const habCollection = db.collection('habitacions'); // Check pluralization
        const estadoCollection = db.collection('estadohabitacions');
        
        const hab201 = await habCollection.findOne({ numero: 201 });
        if (hab201) {
            const estadoLimpia = await estadoCollection.findOne({ nombre: /disponible|limpia/i });
            if (estadoLimpia) {
                await habCollection.updateOne(
                    { _id: hab201._id },
                    { $set: { estado: estadoLimpia._id, estadoLimpieza: 'Limpia' } }
                );
                console.log('Habitacion 201 reset.');
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
        process.exit(0);
    }
}
run();
