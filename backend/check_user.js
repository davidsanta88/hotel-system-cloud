const { poolPromise } = require('./config/db');

async function checkUser() {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', 'admin@hotel.com')
            .query('SELECT id, nombre, email, rol_id FROM usuarios WHERE email = @email');
        
        if (result.recordset.length > 0) {
            console.log("✅ ¡ERAS TÚ! El usuario EXISTE en la base de datos.");
            console.log("Datos:", result.recordset[0]);
        } else {
            console.error("❌ ERROR: El usuario NO existe en la base de datos.");
        }
    } catch (err) {
        console.error("Error al consultar la DB:", err.message);
    } finally {
        process.exit(0);
    }
}

checkUser();
