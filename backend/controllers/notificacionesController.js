const { poolPromise, sql } = require('../config/db');
const nodemailer = require('nodemailer');

const notificacionesController = {
    // Obtener configuración
    getSettings: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT TOP 1 * FROM configuracion_notificaciones');
            const data = result.recordset[0];
            
            // Parse JSON fields
            const email_config = data.email_config_json ? JSON.parse(data.email_config_json) : {};
            const whatsapp_config = data.whatsapp_config_json ? JSON.parse(data.whatsapp_config_json) : {};
            
            res.json({ email_config, whatsapp_config });
        } catch (err) {
            console.error('Error al obtener configuración:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Actualizar configuración
    updateSettings: async (req, res) => {
        const { email_config, whatsapp_config } = req.body;
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('email', sql.NVarChar, JSON.stringify(email_config))
                .input('whatsapp', sql.NVarChar, JSON.stringify(whatsapp_config))
                .query(`
                    UPDATE configuracion_notificaciones 
                    SET email_config_json = @email, whatsapp_config_json = @whatsapp, updated_at = GETDATE()
                `);
            res.json({ message: 'Configuración actualizada correctamente' });
        } catch (err) {
            console.error('Error al actualizar configuración:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Función principal para enviar notificaciones (no es endpoint)
    sendNotifications: async (solicitud) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT TOP 1 * FROM configuracion_notificaciones');
            const config = result.recordset[0];
            if (!config) return;

            const email_config = JSON.parse(config.email_config_json || '{}');
            const whatsapp_config = JSON.parse(config.whatsapp_config_json || '{}');

            const messageBody = `
NUEVA RESERVA RECIBIDA
----------------------
Cliente: ${solicitud.nombre}
Celular: ${solicitud.celular}
Fecha: ${solicitud.fecha_llegada}
Huéspedes: ${solicitud.num_huespedes}
Observación: ${solicitud.notas || 'Ninguna'}
----------------------
            `;

            // 1. Enviar Email
            if (email_config && email_config.user && email_config.pass && email_config.recipients) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: email_config.user,
                        pass: email_config.pass
                    }
                });

                const mailOptions = {
                    from: `"Hotel Management" <${email_config.user}>`,
                    to: email_config.recipients, // Can be comma separated
                    subject: '🔔 Nueva Solicitud de Reserva',
                    text: messageBody
                };

                transporter.sendMail(mailOptions).catch(e => console.error('Error enviando email:', e));
            }

            // 2. Enviar WhatsApp (Ejemplo con UltraMsg o similar)
            if (whatsapp_config && whatsapp_config.instance_id && whatsapp_config.token && whatsapp_config.to) {
                // Usando fetch (Node 18+) o axios si estuviera disponible. 
                // Usaré fetch para mayor compatibilidad si node es >= 18.
                const url = `https://api.ultramsg.com/${whatsapp_config.instance_id}/messages/chat`;
                const data = {
                    token: whatsapp_config.token,
                    to: whatsapp_config.to,
                    body: messageBody,
                    priority: 1
                };

                // Node 18+ includes global fetch.
                if (typeof fetch !== 'undefined') {
                    fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    }).catch(e => console.error('Error enviando WhatsApp (fetch):', e));
                } else {
                    // Fallback simpler HTTP check if fetch not available
                    console.log('Fetch not available for WhatsApp notification');
                }
            }

        } catch (err) {
            console.error('Error en el servicio de notificaciones:', err);
        }
    }
};

module.exports = notificacionesController;
