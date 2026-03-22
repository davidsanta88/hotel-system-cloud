require('dotenv').config();
const { poolPromise } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        
        const check = await pool.request().query(`
            SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'reservas_abonos'
        `);
        
        if (check.recordset[0].cnt > 0) {
            console.log('✓ La tabla reservas_abonos ya existe.');
            process.exit(0);
        }
        
        await pool.request().query(`
            CREATE TABLE reservas_abonos (
                id          INT IDENTITY(1,1) PRIMARY KEY,
                reserva_id  INT NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
                monto       DECIMAL(10,2) NOT NULL,
                medio_pago  NVARCHAR(100) NULL,
                notas       NVARCHAR(500) NULL,
                usuario_id  INT NULL,
                fecha       DATETIME DEFAULT GETDATE()
            )
        `);
        
        console.log('✓ Tabla reservas_abonos creada correctamente.');
        process.exit(0);
    } catch (err) {
        console.error('✗ Error en la migración:', err.message);
        process.exit(1);
    }
}

migrate();
