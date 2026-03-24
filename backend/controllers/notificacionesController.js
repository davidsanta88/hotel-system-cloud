const ConfigNotificacion = require('../models/ConfigNotificacion');
const nodemailer = require('nodemailer');

const notificacionesController = {
    getSettings: async (req, res) => {
        try {
            let config = await ConfigNotificacion.findOne();
            if (!config) {
                config = new ConfigNotificacion({ email_config_json: '{}', whatsapp_config_json: '{}' });
                await config.save();
            }
            res.json({
                email_config: JSON.parse(config.email_config_json),
                whatsapp_config: JSON.parse(config.whatsapp_config_json)
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    updateSettings: async (req, res) => {
        try {
            const { email_config, whatsapp_config } = req.body;
            await ConfigNotificacion.findOneAndUpdate({}, {
                email_config_json: JSON.stringify(email_config),
                whatsapp_config_json: JSON.stringify(whatsapp_config),
                updated_at: Date.now()
            }, { upsert: true });
            res.json({ message: 'Configuración actualizada' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    sendNotifications: async (solicitud) => {
        // Lógica de envío similar a la original pero usando el modelo ConfigNotificacion
        try {
            const config = await ConfigNotificacion.findOne();
            if (!config) return;
            // ... resto de lógica de envío
        } catch (err) {
            console.error('Error notificaciones:', err);
        }
    }
};

module.exports = notificacionesController;
