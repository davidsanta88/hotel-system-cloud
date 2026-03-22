const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads'));

// Main Routes
app.use('/api/auth', require('./routes/auth'));
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
const ventasRoutes = require('./routes/ventas');
const clientesRoutes = require('./routes/clientes');
const municipiosRoutes = require('./routes/municipios');
const tiposHabitacionRoutes = require('./routes/tiposHabitacion');
const estadosHabitacionRoutes = require('./routes/estadosHabitacion');
const inventarioRoutes = require('./routes/inventario');
const reportesRoutes = require('./routes/reportes');
const reservasRoutes = require('./routes/reservas');

app.use('/api/ventas', ventasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/municipios', municipiosRoutes);
app.use('/api/tipos-habitacion', tiposHabitacionRoutes);
app.use('/api/estados-habitacion', estadosHabitacionRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/reservas', reservasRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
