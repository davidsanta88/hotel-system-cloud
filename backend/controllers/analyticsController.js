const Visit = require('../models/Visit');
const crypto = require('crypto');

/**
 * Registra una visita única por día (basada en el hash de la IP)
 */
exports.trackVisit = async (req, res) => {
    try {
        const { path, userAgent } = req.body;
        const ua = (userAgent || req.headers['user-agent'] || '').toLowerCase();
        
        // 1. FILTRAR BOTS (Google, Facebook, etc.)
        const bots = ['bot', 'crawler', 'spider', 'slurp', 'googlebot', 'bingbot', 'yandexbot', 'baiduspider', 'facebookexternalhit', 'twitterbot', 'linkedinbot', 'slackbot', 'embedly', 'quora', 'whatsapp', 'telegram'];
        if (bots.some(bot => ua.includes(bot))) {
            return res.status(200).json({ status: 'ok', msg: 'Bot ignored' });
        }

        // 2. DETECTAR IP REAL (Priorizando encabezados de proxy y declaración del cliente)
        let ip = req.body.clientIp || 
                 req.headers['cf-connecting-ip'] || 
                 req.headers['x-real-ip'] || 
                 req.headers['true-client-ip'] ||
                 req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                 req.ip || 
                 req.socket.remoteAddress ||
                 '127.0.0.1';

        // Limpiar prefijos de IPv6 si existen (::ffff:)
        if (ip.includes('::ffff:')) {
            ip = ip.replace('::ffff:', '');
        }
        if (ip === '::1') ip = '127.0.0.1';

        console.log(`[DEBUG TRACK] IP Detectada: ${ip} | User-Agent: ${ua.slice(0, 40)}`);

        // Identificar si la IP es local/privada (localhost, 192.168, 10.x, 172.16-31)
        const isLocal = ip === '127.0.0.1' || 
                        ip.startsWith('192.168.') || 
                        ip.startsWith('10.') || 
                        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
        
        // Crear un hash anónimo de la IP + Fecha local (para permitir 1 registro por día sin guardar IPs reales)
        const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }); 
        const sessionHash = crypto.createHash('sha256').update(`${ip}-${dateStr}-${path}`).digest('hex');

        // TEMPORALMENTE DESHABILITADO PARA PRUEBAS: Verificar si ya existe este hash para hoy y para esta misma ruta
        // const existing = await Visit.findOne({ sessionHash });
        // if (existing) {
        //     return res.status(200).json({ status: 'ok', msg: 'Session already tracked' });
        // }

        // CONSULTAR GEOLOCALIZACIÓN (Solo si no es local)
        let geoData = {};
        if (!isLocal) {
            try {
                const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,lat,lon`;
                const response = await fetch(url);
                const data = await response.json();
                
                console.log(`[DEBUG GEO] Geodata para ${ip}:`, data);
                
                if (data.status === 'success') {
                    geoData = {
                        city: data.city,
                        country: data.country,
                        countryCode: data.countryCode,
                        region: data.regionName,
                        lat: data.lat,
                        lon: data.lon
                    };
                } else {
                    console.warn(`[GEOLOCATION WARN] No se pudo geolocalizar ${ip}: ${data.message || 'Sin mensaje'}`);
                }
            } catch (geoErr) {
                console.error('[GEOLOCATION ERROR]', geoErr.message);
            }
        } else {
            // Valores para tráfico local/interno
            geoData = {
                city: 'Localhost',
                country: 'Red Interna',
                countryCode: 'LOC',
                region: 'Pruebas',
                lat: 4.5709, // Centro de Colombia (opcional)
                lon: -74.2973
            };
        }

        // Determinar tipo de dispositivo
        let device = 'desktop';
        if (/mobile|android|iphone|ipad|phone/i.test(ua)) device = 'mobile';
        else if (/tablet/i.test(ua)) device = 'tablet';

        const newVisit = new Visit({
            sessionHash,
            ip, // Guardamos la IP real
            city: geoData.city || 'Desconocida',
            country: geoData.country || 'Colombia',
            countryCode: geoData.countryCode || 'CO',
            region: geoData.region || 'Desconocida',
            lat: geoData.lat,
            lon: geoData.lon,
            device,
            userAgent: userAgent || req.headers['user-agent'],
            path: path || '/'
        });

        await newVisit.save();
        res.status(201).json({ status: 'ok', data: { country: newVisit.country, city: newVisit.city } });

    } catch (err) {
        console.error('[TRACK ERROR]', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * Obtiene estadísticas agregadas para el dashboard
 */
exports.getStats = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        let query = {};
        
        if (inicio && fin) {
            query.timestamp = { 
                $gte: new Date(`${inicio}T00:00:00-05:00`), 
                $lte: new Date(`${fin}T23:59:59-05:00`) 
            };
        }

        // 1. Visitas diarias
        const dailyVisits = await Visit.aggregate([
            { $match: query },
            { $group: { 
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: "America/Bogota" } },
                visitas: { $sum: 1 }
            }},
            { $sort: { "_id": 1 } },
            { $project: { fecha: "$_id", visitas: 1, _id: 0 } }
        ]);

        // 2. Top Ciudades
        const topCities = await Visit.aggregate([
            { $match: query },
            { $group: { 
                _id: { 
                    $concat: [
                        { $ifNull: ["$city", "Desconocida"] },
                        ", ",
                        { $ifNull: ["$countryCode", "??"] }
                    ]
                }, 
                valor: { $sum: 1 },
                lat: { $first: "$lat" },
                lon: { $first: "$lon" }
            } },
            { $sort: { valor: -1 } },
            { $limit: 12 },
            { $project: { nombre: "$_id", valor: 1, lat: 1, lon: 1, _id: 0 } }
        ]);

        // 3. Top Países
        const topCountries = await Visit.aggregate([
            { $match: query },
            { $group: { _id: "$country", valor: { $sum: 1 } } },
            { $sort: { valor: -1 } },
            { $limit: 5 },
            { $project: { nombre: "$_id", valor: 1, _id: 0 } }
        ]);

        // 4. Dispositivos
        const devices = await Visit.aggregate([
            { $match: query },
            { $group: { _id: "$device", valor: { $sum: 1 } } },
            { $project: { tipo: "$_id", valor: 1, _id: 0 } }
        ]);

        // 5. Total Hoy vs Ayer (Local Colombia)
        const moment = require('moment-timezone');
        const startToday = moment.tz("America/Bogota").startOf('day').toDate();
        const startYesterday = moment.tz("America/Bogota").subtract(1, 'day').startOf('day').toDate();

        const [todayCount, yesterdayCount, recentVisits] = await Promise.all([
            Visit.countDocuments({ timestamp: { $gte: startToday } }),
            Visit.countDocuments({ 
                timestamp: { 
                    $gte: startYesterday, 
                    $lt: startToday 
                } 
            }),
            Visit.find(query).sort({ timestamp: -1 }).limit(20).lean()
        ]);

        res.json({
            dailyVisits,
            topCities,
            topCountries,
            devices,
            recentVisits, // Lista para validación en tiempo real
            summary: {
                today: todayCount,
                yesterday: yesterdayCount,
                total: await Visit.countDocuments(query)
            }
        });

    } catch (err) {
        console.error('[STATS ERROR]', err);
        res.status(500).json({ message: err.message });
    }
};
