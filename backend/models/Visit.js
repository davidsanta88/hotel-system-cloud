const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    sessionHash: { type: String, required: true }, // Hash IP + Fecha para evitar duplicados en el contador
    ip: String, // Guardar la IP real para validación y depuración
    city: String,
    country: String,
    countryCode: String,
    region: String,
    lat: Number,
    lon: Number,
    device: { type: String, enum: ['mobile', 'desktop', 'tablet', 'unknown'], default: 'unknown' },
    userAgent: String,
    path: { type: String, default: '/' }
});

// Index for better performance on analytics queries
visitSchema.index({ timestamp: -1 });
visitSchema.index({ country: 1, city: 1 });

module.exports = mongoose.model('Visit', visitSchema);
