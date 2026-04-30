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
app.set('trust proxy', true); // Trust proxy (Vercel, Heroku, Nginx)

// Conectar a MongoDB
connectDB();

// Registro preventivo de modelos para evitar MissingSchemaError en populates
require('./models/Rol');
require('./models/Usuario');
require('./models/Municipio');
require('./models/Empresa');
require('./models/Cliente');
require('./models/TipoHabitacion');
require('./models/EstadoHabitacion');
require('./models/Habitacion');
require('./models/Registro');
require('./models/Reserva');
require('./models/Categoria');
require('./models/Producto');
require('./models/Venta');
require('./models/Gasto');
require('./models/MedioPago');
require('./models/Mesa');
require('./models/Comanda');
require('./models/Proveedor');
require('./models/DocumentoHotel');


const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Middlewares
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow images to be viewed from across origins

// Configurar CORS estricto
const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://hotelbalconplaza.com',
    'https://www.hotelbalconplaza.com'
];
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por CORS'));
        }
    },
    credentials: true
}));

// Límite global contra Ataques DoS automáticos o abuso
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Límite de 1000 peticiones por IP
    message: { message: "Demasiadas peticiones desde esta IP. Intente de nuevo más tarde." }
});
app.use(globalLimiter);

app.use(express.json({ limit: '10mb' })); // Limitar tamaño del body
app.use(mongoSanitize()); // Prevenir Inyecciones NoSQL
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



const { verifyToken } = require('./middleware/auth');

// Root route for initial health check
app.get('/', (req, res) => res.send('Hotel System API is running (v1.2.12)'));

// Ping route for deployment verification (Versioned)
app.get('/api/ping', (req, res) => {
    res.json({ 
        status: 'UP', 
        version: '1.2.18 (Consolidated Reports Fix)', 
        time: new Date().toISOString(),
        sharedConn: 'OK'
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
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/hotel-config', require('./routes/hotelConfig'));

// Permitir descarga de documentos sin pasar por el verifyToken global (se validará opcionalmente en el controlador)
app.get('/api/documentos-hotel/download/:id', require('./controllers/documentoController').downloadDocumento);

// 2. PROTECTED ROUTES (Require Token)
app.use('/api', verifyToken);

// 3. FEATURE ROUTES
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
app.use('/api/empresas', require('./routes/empresas'));
app.use('/api/estados-habitacion', require('./routes/estadosHabitacion'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/mantenimiento', require('./routes/mantenimiento'));
app.use('/api/estadisticas', require('./routes/estadisticas'));
app.use('/api/cierres-caja', require('./routes/cierresCaja'));
app.use('/api/auditoria-limpieza', require('./routes/auditoriaLimpieza'));
app.use('/api/cotizaciones', require('./routes/cotizaciones'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/search', require('./routes/search'));
app.use('/api/restaurante', require('./routes/restaurante'));
app.use('/api/proveedores', require('./routes/proveedor'));
app.use('/api/documentos-hotel', require('./routes/documento'));
app.use('/api/aliados', require('./routes/aliadoRoutes'));

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
