const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const connectDB = require('./config/db');

// Iniciar app
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads', 'productos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();

// Conectar a MongoDB
connectDB();


// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads'));

// Middleware de Debug para rastrear redirecciones y errores 401/403
app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
        if (res.statusCode >= 400) {
            console.log(`[DEBUG] ${req.method} ${req.url} -> STATUS ${res.statusCode} | MESSAGE: ${data.message || 'Sin mensaje'}`);
        }
        return originalJson.call(this, data);
    };
    next();
});



const auditMiddleware = require('./middleware/auditMiddleware');
const { verifyToken } = require('./middleware/auth');

// Root route for initial health check
app.get('/', (req, res) => res.send('Hotel System API is running (v1.2.11)'));

// Ping route for deployment verification (Versioned)
app.get('/api/ping', (req, res) => {
    res.json({ 
        status: 'UP', 
        version: '1.2.11 (Ultimate Compatibility)', 
        time: new Date().toISOString(),
        cloudinary: {
            url: process.env.CLOUDINARY_URL ? 'PRESENT' : 'MISSING',
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'PRESENT' : 'MISSING',
            api_key: process.env.CLOUDINARY_API_KEY ? 'PRESENT' : 'MISSING',
            api_secret: process.env.CLOUDINARY_API_SECRET ? 'PRESENT' : 'MISSING'
        }
    });
});

// 1. PUBLIC ROUTES (No Token required for these prefixes/routes)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/solicitudes', require('./routes/solicitudes'));
app.use('/api/municipios', require('./routes/municipios')); // Incluye /fix/reseed
app.use('/api/tipos-habitacion', require('./routes/tiposHabitacion'));
app.use('/api/checkin-digital', (req, res, next) => {
    if (req.path === '/public' && req.method === 'POST') return next();
    next();
}, require('./routes/checkin'));

// 2. PROTECTED ROUTES (Require Token)
app.use('/api', verifyToken);
app.use(auditMiddleware);

// 3. FEATURE ROUTES
app.use('/api/auditoria', require('./routes/auditoria'));
app.use('/api/habitaciones', require('./routes/habitaciones'));
app.use('/api/registros', require('./routes/registros'));
app.use('/api/medios-pago', require('./routes/mediosPago'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/productos', (req, res, next) => {
    if (req.method !== 'GET') {
        console.log(`[${req.method}] ${req.url} | Content-Type: ${req.headers['content-type']}`);
    }
    next();
}, require('./routes/productos'));
app.use('/api/categorias-gastos', require('./routes/categorias_gastos'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/tipos-registro', require('./routes/tiposRegistro'));
app.use('/api/notas', require('./routes/notas'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/estados-habitacion', require('./routes/estadosHabitacion'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/mantenimiento', require('./routes/mantenimiento'));
app.use('/api/estadisticas', require('./routes/estadisticas'));
app.use('/api/hotel-config', require('./routes/hotelConfig'));

// Global Error Handler for JSON responses
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR]', err.stack);
    
    // Manejo específico para errores de Multer
    if (err.name === 'MulterError') {
        return res.status(500).json({
            message: `Error de subida de archivo: ${err.message}`,
            code: err.code
        });
    }

    res.status(err.status || 500).json({
        message: err.message || 'Error interno del servidor',
        error: err,
        stack: err.stack
    });
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
