const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        
        // Find by description or client name instead of ID suffix if ID is weird
        const reg = await db.collection('registros').findOne({ 
            $or: [
                { "pagos.notas": /ALCALDIA/i },
                { "observaciones": /ALCALDIA/i }
            ]
        });

        if (reg) {
            console.log('REGISTRO FOUND:', reg._id, typeof reg._id);
            const delReg = await db.collection('registros').deleteOne({ _id: reg._id });
            console.log('SUCCESS: Deleted Registro', delReg.deletedCount);
        } else {
            // Try one more: find by common amount and recent date
            const reg2 = await db.collection('registros').findOne({ "pagos.monto": 1120000 });
            if (reg2) {
                console.log('REGISTRO FOUND by amount:', reg2._id);
                await db.collection('registros').deleteOne({ _id: reg2._id });
            }
        }

        const gasto = await db.collection('gastos').findOne({ descripcion: /ALCALDIA/i });
        if (gasto) {
            console.log('GASTO FOUND:', gasto._id);
            const delGasto = await db.collection('gastos').deleteOne({ _id: gasto._id });
            console.log('SUCCESS: Deleted Gasto', delGasto.deletedCount);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
        process.exit(0);
    }
}
run();
