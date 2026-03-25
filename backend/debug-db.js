const mongoose = require('mongoose');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';
mongoose.connect(URI).then(async () => {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Colecciones:', collections.map(c => c.name));
    
    const roles = await db.collection('rols').find({}).toArray();
    console.log('Roles:', roles.map(r => r.nombre));
    const usuarios = await db.collection('usuarios').find({}).toArray();
    console.log('Usuarios:', usuarios.map(u => ({ nombre: u.nombre, rol: u.rol })));
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
