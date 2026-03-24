const { poolPromise } = require('./config/db');

async function fix() {
    try {
        const pool = await poolPromise;
        console.log('Connected to DB');
        
        const query = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='auditoria' AND xtype='U')
        BEGIN
            CREATE TABLE auditoria (
                id INT PRIMARY KEY IDENTITY(1,1),
                usuario_id INT,
                accion NVARCHAR(50),
                modulo NVARCHAR(50),
                detalle NVARCHAR(MAX),
                ip_address NVARCHAR(50),
                fecha_creacion DATETIME DEFAULT GETDATE()
            )
            PRINT 'Table auditoria created'
        END
        ELSE
        BEGIN
            PRINT 'Table auditoria already exists'
        END
        `;
        
        await pool.request().query(query);
        process.exit(0);
    } catch (err) {
        console.error('Error fixing audit table:', err);
        process.exit(1);
    }
}

fix();
