const mongoose = require('mongoose');
const sql = require('mssql');

const mssqlConfig = {
    user: 'db_ac7034_dbhotelbalconplaza_admin',
    password: 'K0l0mbia2026*',
    server: 'SQL8010.site4now.net',
    database: 'db_ac7034_dbhotelbalconplaza',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const mongoURI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

// Mongoose Models
const Cliente = require('./models/Cliente');
const Habitacion = require('./models/Habitacion');
const Reserva = require('./models/Reserva');
const TipoHabitacion = require('./models/TipoHabitacion');
const EstadoHabitacion = require('./models/EstadoHabitacion');
const Municipio = require('./models/Municipio');

async function migrate() {
    try {
        console.log('Connecting to MSSQL...');
        const pool = await sql.connect(mssqlConfig);
        console.log('Connected to MSSQL.');

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB.');

        // Wipe Collections and Indexes
        console.log('Cleaning MongoDB collections...');
        const collectionsToDrop = ['clientes', 'habitacions', 'reservas', 'tipohabitacions', 'estadohabitacions', 'municipios'];
        for (const col of collectionsToDrop) {
            try { await mongoose.connection.db.collection(col).drop(); } catch(e) {}
        }
        console.log('Collections cleaned.');

        // 1. Migrate Municipios
        console.log('Migrating Municipios...');
        const sqlMuns = await pool.request().query('SELECT * FROM municipios');
        
        const munsToInsert = sqlMuns.recordset.map(m => {
            const parts = m.nombre.split('-');
            const departamento = parts[0] ? parts[0].trim() : 'VARIOS';
            return {
                nombre: m.nombre,
                departamento: departamento,
                visualizar: m.visualizar === true || m.visualizar === 1,
                codigo_dane: '',
                _mssqlId: m.id // Temp field for mapping
            };
        });
        
        const insertedMuns = await Municipio.insertMany(munsToInsert);
        const munMap = new Map(); // mssqlId -> mongoObjectId
        insertedMuns.forEach(m => munMap.set(m._mssqlId, m._id));
        console.log(`Migrated ${insertedMuns.length} Municipios.`);

        // 2. Migrate Clientes
        console.log('Migrating Clientes...');
        const sqlClientes = await pool.request().query('SELECT * FROM clientes');
        
        const clientsToInsert = sqlClientes.recordset.map(c => {
            const mongoMunId = munMap.get(c.municipio_origen_id);
            return {
                nombre: c.nombre || 'Desconocido',
                documento: c.documento || `MIG-${c.id}`, 
                telefono: c.telefono || '',
                email: c.email || '',
                direccion: c.direccion || '',
                tipo_documento: c.tipo_documento || 'CC',
                municipio_origen_id: mongoMunId || null,
                usuarioCreacion: 'Migracion',
                _mssqlId: c.id
            };
        });
        
        const insertedClients = await Cliente.insertMany(clientsToInsert);
        const clienteMap = new Map();
        insertedClients.forEach(c => clienteMap.set(c._mssqlId, c._id));
        
        // Mark municipios linked to clients as visible
        const linkedMunIds = [...new Set(insertedClients.map(c => c.municipio_origen_id).filter(id => id))];
        await Municipio.updateMany({ _id: { $in: linkedMunIds } }, { visualizar: true });
        console.log(`Migrated ${insertedClients.length} Clientes.`);

        // 3. Prepare Tipos and Estados
        console.log('Preparing Tipos and Estados...');
        const sqlHabs = await pool.request().query('SELECT * FROM habitaciones');
        const uniqueTipos = [...new Set(sqlHabs.recordset.map(h => h.tipo || 'Sencilla'))];
        const uniqueEstados = [...new Set(sqlHabs.recordset.map(h => h.estado || 'Disponible'))];
        
        const tiposToInsert = uniqueTipos.map(t => ({ nombre: t, precioBase: 0 }));
        const insertedTipos = await TipoHabitacion.insertMany(tiposToInsert);
        const tipoMap = new Map();
        insertedTipos.forEach(t => tipoMap.set(t.nombre, t._id));
        
        const estadosToInsert = uniqueEstados.map(e => ({ nombre: e, color: '#cccccc' }));
        const insertedEstados = await EstadoHabitacion.insertMany(estadosToInsert);
        const estadoMap = new Map();
        insertedEstados.forEach(e => estadoMap.set(e.nombre, e._id));

        // 4. Migrate Habitaciones
        console.log('Migrating Habitaciones...');
        const habMap = new Map(); // mssqlId -> mongoObjectId
        const processedNumeros = new Map(); // numero -> mongoObjectId
        const habsToInsert = [];

        for (const h of sqlHabs.recordset) {
            if (processedNumeros.has(h.numero)) {
                habMap.set(h.id, processedNumeros.get(h.numero));
                continue;
            }
            const roomData = {
                numero: h.numero,
                tipo: tipoMap.get(h.tipo || 'Sencilla'),
                estado: estadoMap.get(h.estado || 'Disponible'),
                precio_1: h.precio_acordado || h.precio || 0,
                estadoLimpieza: 'Limpia',
                usuarioCreacion: 'Migracion',
                _mssqlId: h.id
            };
            habsToInsert.push(roomData);
            processedNumeros.set(h.numero, 'PENDING'); // Placeholder to track
        }
        
        const insertedHabs = await Habitacion.insertMany(habsToInsert);
        insertedHabs.forEach(h => {
            habMap.set(h._mssqlId, h._id);
            processedNumeros.set(h.numero, h._id); // Real ID
        });
        
        // Fix mapping for skipped duplicates in the memory map
        for (const h of sqlHabs.recordset) {
             if (!habMap.has(h.id)) {
                 habMap.set(h.id, processedNumeros.get(h.numero));
             }
        }
        console.log(`Migrated ${insertedHabs.length} Unique Habitaciones.`);

        // 5. Migrate Reservas
        console.log('Migrating Reservas...');
        const sqlReservas = await pool.request().query('SELECT * FROM reservas');
        const sqlResHabs = await pool.request().query('SELECT * FROM reservas_habitaciones');

        const reservasToInsert = sqlReservas.recordset.map(r => {
            const mongoClienteId = clienteMap.get(r.cliente_id);
            const habits = sqlResHabs.recordset
                .filter(rh => rh.reserva_id === r.id)
                .map(rh => {
                    const mongoHabId = habMap.get(rh.habitacion_id);
                    const habData = sqlHabs.recordset.find(h => h.id === rh.habitacion_id);
                    return {
                        habitacion: mongoHabId,
                        numero: habData ? habData.numero : '',
                        precio_acordado: rh.precio_acordado || 0
                    };
                });

            return {
                cliente: mongoClienteId,
                fecha_entrada: r.fecha_entrada,
                fecha_salida: r.fecha_salida,
                fechaInicio: r.fecha_entrada,
                fechaFin: r.fecha_salida,
                numero_personas: r.numero_personas || 1,
                valor_total: r.valor_total || 0,
                valor_abonado: r.valor_abonado || 0,
                estado: r.estado || 'Confirmada',
                observaciones: r.observaciones || '',
                habitaciones: habits,
                habitacion: habits.length > 0 ? habits[0].habitacion : null,
                usuarioCreacion: 'Migracion'
            };
        });
        
        const insertedReservas = await Reserva.insertMany(reservasToInsert);
        console.log(`Migrated ${insertedReservas.length} Reservas.`);

        console.log('--- RE-MIGRATION COMPLETED SUCCESSFULLY ---');
        await pool.close();
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    }
}

migrate();
