const mongoose = require('mongoose');

const configNotificacionSchema = new mongoose.Schema({
    email_config_json: String,
    whatsapp_config_json: String,
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ConfigNotificacion', configNotificacionSchema);
