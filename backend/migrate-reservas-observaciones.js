require('dotenv').config();
const { poolPromise } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        
        // Check if column already exists
        const check = await pool.request().query(`
            SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'reservas' AND COLUMN_NAME = 'observaciones'
        `);
        
        if (check.recordset[0].cnt > 0) {
            console.log('✓ La columna observaciones ya existe en la tabla reservas.');
            process.exit(0);
        }
        
        await pool.request().query(`
            ALTER TABLE reservas ADD observaciones NVARCHAR(MAX) NULL
        `);
        
        console.log('✓ Columna observaciones añadida correctamente a la tabla reservas.');
        process.exit(0);
    } catch (err) {
        console.error('✗ Error en la migración:', err.message);
        process.exit(1);
    }
}

migrate();
