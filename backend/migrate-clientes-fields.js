const mongoose = require('mongoose');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function migrate() {
    try {
        await mongoose.connect(URI);
        console.log('Conectado a MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('clientes');
        
        const clientes = await collection.find({}).toArray();
        console.log(`Encontrados ${clientes.length} clientes para migrar`);
        
        for (const cliente of clientes) {
            const update = {};
            
            // Renombrar documentoNumero -> documento
            if (cliente.documentoNumero && !cliente.documento) {
                update.documento = cliente.documentoNumero;
                update.$unset = { ...update.$unset, documentoNumero: "" };
            }
            
            // Renombrar documentoTipo -> tipo_documento
            if (cliente.documentoTipo && !cliente.tipo_documento) {
                update.tipo_documento = cliente.documentoTipo;
                update.$unset = { ...update.$unset, documentoTipo: "" };
            }
            
            // Renombrar ciudad -> municipio_origen_id
            if (cliente.ciudad && !cliente.municipio_origen_id) {
                // Intentar convertir ciudad a ObjectId si parece un ID
                if (mongoose.Types.ObjectId.isValid(cliente.ciudad)) {
                    update.municipio_origen_id = new mongoose.Types.ObjectId(cliente.ciudad);
                } else {
                    update.municipio_origen_id = null; // O dejarlo como estaba si es un nombre
                }
                update.$unset = { ...update.$unset, ciudad: "" };
            }
            
            if (Object.keys(update).length > 0) {
                // Limpiar $unset si está vacío pero update tiene otras cosas
                const { $unset, ...fields } = update;
                const finalUpdate = { $set: fields };
                if ($unset) finalUpdate.$unset = $unset;
                
                await collection.updateOne({ _id: cliente._id }, finalUpdate);
                console.log(`Migrado cliente: ${cliente.nombre}`);
            }
        }
        
        console.log('Migración completada con éxito');
        process.exit(0);
    } catch (err) {
        console.error('Error durante la migración:', err);
        process.exit(1);
    }
}

migrate();
