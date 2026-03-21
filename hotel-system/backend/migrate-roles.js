const { poolPromise } = require('./config/db');

async function migrateRoles() {
    try {
        const pool = await poolPromise;
        
        // Asegurar que la columna descripcion exista en roles si la tabla ya existe
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sysobjects WHERE name='roles' and xtype='U')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'descripcion' AND Object_ID = Object_ID(N'roles'))
                BEGIN
                    ALTER TABLE roles ADD descripcion VARCHAR(255);
                END
            END
        `);

        // Crear tabla roles si no existe
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='roles' and xtype='U')
            BEGIN
                CREATE TABLE roles (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    nombre VARCHAR(50) NOT NULL UNIQUE,
                    descripcion VARCHAR(255),
                    activo BIT DEFAULT 1,
                    FechaCreacion DATETIME DEFAULT GETDATE()
                );
                
                -- Se asume que 1 es Admin y 2 es Empleado en el código base, forzamos estos IDs iniciales
                SET IDENTITY_INSERT roles ON;
                INSERT INTO roles (id, nombre, descripcion) VALUES (1, 'Administrador del Sistema', 'Acceso ilimitado a todas las funciones y configuraciones.');
                INSERT INTO roles (id, nombre, descripcion) VALUES (2, 'Empleado (Recepción)', 'Acceso general operativo, sin permisos de administración profunda.');
                SET IDENTITY_INSERT roles OFF;
            END
        `);
        console.log("1. Tabla roles verificada/creada.");

        // Crear tabla roles_permisos (M-to-M)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='roles_permisos' and xtype='U')
            BEGIN
                CREATE TABLE roles_permisos (
                    rol_id INT,
                    pantalla_codigo VARCHAR(50),
                    PRIMARY KEY (rol_id, pantalla_codigo),
                    CONSTRAINT FK_RolePermiso FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
                );
            END
        `);
        console.log("2. Tabla roles_permisos verificada/creada.");

        // Limpiar permisos actuales para inyectarlos limpios
        await pool.request().query(`DELETE FROM roles_permisos WHERE rol_id IN (1, 2)`);

        // Asignarle TODAS LAS PANTALLAS al Admin (id=1)
        const allScreens = [
            'dashboard', 
            'habitaciones', 'registros', 'clientes', 'tienda', 'inventario', 'gastos',
            'reportes', 'medios_pago', 'tienda_ventas',
            'tipos_habitaciones', 'estados_habitaciones', 'municipios', 
            'categorias_productos', 'categorias_gastos', 
            'usuarios', 'roles_permisos'
        ];

        for (const screen of allScreens) {
            await pool.request().query(`INSERT INTO roles_permisos (rol_id, pantalla_codigo) VALUES (1, '${screen}')`);
        }
        console.log("3. Permisos Base Maestro Inyectados (ID 1).");
        
        // Empleado por defecto (id 2) solo pantallas básicas que pidió el usuario
        const empScreens = ['dashboard', 'registros', 'clientes', 'gastos'];
        for (const screen of empScreens) {
            await pool.request().query(`INSERT INTO roles_permisos (rol_id, pantalla_codigo) VALUES (2, '${screen}')`);
        }
        console.log("4. Permisos Básicos Inyectados (ID 2).");

        console.log(">>> Migración Completa Exitosamente.");
        process.exit(0);

    } catch (e) {
        console.error("Error crítico durante la migración de Roles:", e.message);
        process.exit(1);
    }
}

migrateRoles();
