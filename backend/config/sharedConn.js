const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sharedUri = process.env.SHARED_MONGODB_URI;
const mainUri = process.env.MONGODB_URI;

// Normalizar URIs para comparación (ignorar parámetros y barras finales)
const normalize = (u) => u ? u.trim().split('?')[0].replace(/\/$/, '') : '';
const isSameDb = sharedUri && mainUri && (normalize(sharedUri) === normalize(mainUri));

let sharedConn;

if (isSameDb) {
    // Si la URI compartida es la misma que la principal, usamos el objeto mongoose global
    // Esto permite que la población (populate) funcione entre todos los modelos
    sharedConn = mongoose;
    console.log('>>> Compartiendo Conexión Principal para Clientes/Empresas (Misma DB)');
} else {
    sharedConn = mongoose.createConnection(sharedUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    sharedConn.on('connected', () => {
        console.log('>>> Conexión Compartida (Clientes/Empresas) Establecida');
    });

    sharedConn.on('error', (err) => {
        console.error('>>> Error en Conexión Compartida:', err);
    });
}

module.exports = sharedConn;
