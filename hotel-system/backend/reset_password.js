const { poolPromise } = require('./config/db');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    try {
        const pool = await poolPromise;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('admin123', salt);
        
        console.log("Generando nuevo Hash para 'admin123':", hash);

        const result = await pool.request()
            .input('email', 'admin@hotel.com')
            .input('password', hash)
            .query('UPDATE usuarios SET password = @password WHERE email = @email');
        
        if (result.rowsAffected[0] > 0) {
            console.log("✅ ¡ÉXITO! Contraseña de admin@hotel.com reseteada a 'admin123'");
        } else {
            console.error("❌ ERROR: El usuario admin@hotel.com NO existe.");
        }
    } catch (err) {
        console.error("Error al resetear la DB:", err.message);
    } finally {
        process.exit(0);
    }
}

resetPassword();
