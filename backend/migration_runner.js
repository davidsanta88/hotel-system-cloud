const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { poolPromise } = require('./config/db');

async function runMasterMigration() {
    console.log(">>> Iniciando Migración Maestra a la Nube...");

    try {
        const pool = await poolPromise;
        console.log("Conexión confirmada con SmarterASP.net.");

        // 1. Ejecutar Schema Base (Limpiado y robusto)
        let schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
        schemaSql = schemaSql.replace(/IF NOT EXISTS \(SELECT \* FROM sys\.databases[\s\S]*?GO/g, '');
        schemaSql = schemaSql.replace(/USE PruebaIA;[\s\S]*?GO/g, '');
        schemaSql = schemaSql.replace(/GO/g, ''); 

        // Dividir por bloques de forma más inteligente (evitando romper DECLARE/SET)
        // Eliminamos líneas en blanco innecesarias para que el split no rompa bloques
        const cleanSql = schemaSql.split('\n').filter(line => line.trim() !== '').join('\n');
        
        // Separamos por bloques de creación de tablas o inserciones
        const batches = cleanSql.split(/CREATE TABLE|INSERT INTO|IF NOT EXISTS/).filter(b => b.trim());
        
        for (let batch of batches) {
            let sql = batch.trim();
            // Restaurar la palabra clave que el split quitó para que sea SQL válido
            if (cleanSql.includes('CREATE TABLE ' + sql)) sql = 'CREATE TABLE ' + sql;
            else if (cleanSql.includes('INSERT INTO ' + sql)) sql = 'INSERT INTO ' + sql;
            else if (cleanSql.includes('IF NOT EXISTS ' + sql)) sql = 'IF NOT EXISTS ' + sql;

            if (sql) {
                try {
                    await pool.request().query(sql);
                } catch (err) {
                    if (!err.message.includes("already exists") && !err.message.includes("There is already")) {
                        console.warn("Aviso en bloque SQL:", err.message);
                    }
                }
            }
        }
        console.log("1. Esquema Base aplicado.");

        // 2. Ejecutar Scripts de Migración JS en orden
        const scripts = [
            'migrate-roles.js',
            'migrate-clientes.js',
            'migrate-estados-habitacion.js',
            'migrate-tipos-habitacion.js',
            'migrate-reservas.js',
            'migrate-v2-features.js',
            'migrate-v4-payments.js',
            'migrate-v5-notas.js',
            'migrate-activo-productos.js',
            'migrate-product-images.js',
            'migrate-rooms-photos.js',
            'migrate-notas.js'
        ];

        for (const script of scripts) {
            console.log(`Ejecutando ${script}...`);
            try {
                execSync(`node ${script}`, { stdio: 'inherit' });
            } catch (err) {
                console.error(`Error en ${script}, continuando...`);
            }
        }

        console.log(">>> MIGRACIÓN COMPLETA.");
        process.exit(0);
    } catch (err) {
        console.error("Error crítico en migración maestra:", err);
        process.exit(1);
    }
}

runMasterMigration();
