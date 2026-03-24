const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function debug() {
    try {
        console.log('Conectando a MongoDB Atlas...');
        await mongoose.connect(URI);
        console.log('Conectado.');

        const db = mongoose.connection.db;
        const usuarios = await db.collection('usuarios').find({}).toArray();
        const roles = await db.collection('rols').find({}).toArray(); // Mongoose pluraliza a 'rols' por defecto si no se especifica

        console.log('Usuarios encontrados:', usuarios.length);
        console.log('Roles encontrados:', roles.length);

        if (usuarios.length > 0) {
            const user = usuarios[0];
            console.log('Primer usuario:', { 
                nombre: user.nombre, 
                email: user.email, 
                rol: user.rol 
            });
            
            if (user.password) {
                const check = bcrypt.compareSync('admin2026', user.password);
                console.log('Prueba de bcrypt (admin2026):', check);
            }
        }

        if (roles.length > 0) {
            console.log('Primer rol:', roles[0]);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error en diagnóstico:', err);
    }
}

debug();
