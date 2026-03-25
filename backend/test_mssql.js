const sql = require('mssql');

const config = {
    user: 'db_ac7034_dbhotelbalconplaza_admin',
    password: 'K0l0mbia2026*',
    server: 'SQL8010.site4now.net',
    database: 'db_ac7034_dbhotelbalconplaza',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function testSql() {
    try {
        console.log('Connecting to MSSQL...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        const res = await pool.request().query('SELECT TOP 5 * FROM reservas');
        console.log('Reservas found in MSSQL:', res.recordset.length);
        console.log('Sample Reserva:', JSON.stringify(res.recordset[0], null, 2));

        const clientes = await pool.request().query('SELECT TOP 5 * FROM clientes');
        console.log('Clientes found in MSSQL:', clientes.recordset.length);
        
        const habs = await pool.request().query('SELECT TOP 5 * FROM habitaciones');
        console.log('Habitaciones found in MSSQL:', habs.recordset.length);

        await pool.close();
    } catch (err) {
        console.error('MSSQL Error:', err);
    }
}

testSql();
