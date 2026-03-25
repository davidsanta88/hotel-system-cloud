const mongoose = require('mongoose');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function migrate() {
    try {
        await mongoose.connect(URI);
        console.log('Conectado a MongoDB');
        const db = mongoose.connection.db;
        const collection = db.collection('clientes');
        
        const clientes = await collection.find({}).toArray();
        for (const c of clientes) {
            const update = {};
            
            // 1. Asegurar que municipio_origen_id sea ObjectId
            if (c.municipio_origen_id && typeof c.municipio_origen_id === 'string' && mongoose.Types.ObjectId.isValid(c.municipio_origen_id)) {
                update.municipio_origen_id = new mongoose.Types.ObjectId(c.municipio_origen_id);
            }
            
            // 2. Rellenar usuarioCreacion si falta
            if (!c.usuarioCreacion && !c.UsuarioCreacion) {
                update.usuarioCreacion = 'SISTEMA';
            }
            
            if (Object.keys(update).length > 0) {
                await collection.updateOne({ _id: c._id }, { $set: update });
                console.log(`Actualizado cliente: ${c.nombre}`);
            }
        }
        
        console.log('Migración de limpieza finalizada');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
migrate();
