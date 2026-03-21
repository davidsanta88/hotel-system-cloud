const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { poolPromise } = require('./config/db');

async function runMasterMigration() {
    console.log(">>> Iniciando Migración Maestra a la Nube...");

    try {
        const pool = await poolPromise;
        console.log("Conexión confirmada con SmarterASP.net.");

        // 1. Ejecutar Schema Base (Limpiado)
        let schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
        // Quitar comandos de base de datos que no funcionan en hosting compartido
        schemaSql = schemaSql.replace(/IF NOT EXISTS \(SELECT \* FROM sys\.databases[\s\S]*?GO/g, '');
        schemaSql = schemaSql.replace(/USE PruebaIA;[\s\S]*?GO/g, '');
        schemaSql = schemaSql.replace(/GO/g, ''); // mssql node adapter no soporta GO

        const batches = schemaSql.split('\n\n'); // Dividir por bloques simples
        for (let batch of batches) {
            if (batch.trim()) {
                try {
                    await pool.request().query(batch);
                } catch (err) {
                    // Ignorar errores de "ya existe" para ser re-ejecutable
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
