const mongoose = require('mongoose');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

mongoose.connect(URI).then(async () => {
    const Cliente = require('./models/Cliente');
    const clients = await Cliente.find();
    console.log(`Total Clientes: ${clients.length}`);
    
    let invalidCount = 0;
    clients.forEach(c => {
        if (c.municipio_origen_id && !mongoose.Types.ObjectId.isValid(c.municipio_origen_id)) {
            console.log(`Cliente ${c.nombre} (${c._id}) tiene municipio_origen_id inválido:`, typeof c.municipio_origen_id, c.municipio_origen_id);
            invalidCount++;
        }
    });
    
    console.log(`Clientes con ID de municipio inválido: ${invalidCount}`);
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
