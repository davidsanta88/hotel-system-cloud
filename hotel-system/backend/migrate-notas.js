const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER.split(',')[0],
    port: parseInt(process.env.DB_SERVER.split(',')[1]) || 1433,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function migrate() {
    try {
        const pool = await sql.connect(config);
        console.log('Connected to database for migration');

        // Create notas_alertas table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notas_alertas')
            BEGIN
                CREATE TABLE notas_alertas (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    titulo VARCHAR(100) NOT NULL,
                    descripcion NVARCHAR(MAX) NOT NULL,
                    fecha_alerta DATE NOT NULL,
                    usuario_destino_id INT NULL, -- NULL para todos
                    usuario_creacion_id INT NOT NULL,
                    leida BIT DEFAULT 0,
                    prioridad VARCHAR(20) DEFAULT 'Normal', -- 'Normal', 'Alta', 'Urgente'
                    FechaCreacion DATETIME DEFAULT GETDATE(),
                    UsuarioCreacion VARCHAR(50),
                    FechaModificacion DATETIME,
                    UsuarioModificacion VARCHAR(50)
                );
                PRINT 'Tabla notas_alertas creada';
            END
            ELSE
            BEGIN
                PRINT 'La tabla notas_alertas ya existe';
            END
        `);

        // Add foreign keys if they shouldn't exist
        try {
            await pool.request().query(`
                ALTER TABLE notas_alertas ADD CONSTRAINT FK_Notas_UsuarioDestino FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id);
                ALTER TABLE notas_alertas ADD CONSTRAINT FK_Notas_UsuarioCreacion FOREIGN KEY (usuario_creacion_id) REFERENCES usuarios(id);
            `);
            console.log('Claves foráneas añadidas');
        } catch (e) {
            console.log('Las claves foráneas ya existen o hubo un error al añadirlas');
        }

        console.log('Migración completada exitosamente');
        process.exit(0);
    } catch (err) {
        console.error('Error durante la migración:', err);
        process.exit(1);
    }
}

migrate();
