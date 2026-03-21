const mssql = require('mssql');
require('dotenv').config();

const serverString = process.env.DB_SERVER || 'localhost';
let serverHost = serverString;
let serverPort = 1433; // Puerto por defecto

// Parsear si el host incluye un puerto con coma (ej. 76.74.150.83,1434)
if (serverString.includes(',')) {
    const parts = serverString.split(',');
    serverHost = parts[0].trim();
    serverPort = parseInt(parts[1].trim(), 10);
}

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: serverHost,
    port: serverPort,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // true para Azure
        trustServerCertificate: true
    }
};

const poolPromise = new mssql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log(`Connected to MSSQL on ${serverHost}:${serverPort} | Database: ${process.env.DB_DATABASE}`);
        return pool;
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = {
    sql: mssql,
    poolPromise
};
