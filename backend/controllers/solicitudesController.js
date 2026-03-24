const SolicitudReserva = require('../models/SolicitudReserva');
const notificacionesController = require('./notificacionesController');

const solicitudesController = {
    crearSolicitud: async (req, res) => {
        try {
            const newS = new SolicitudReserva(req.body);
            await newS.save();
            notificacionesController.sendNotifications(req.body);
            res.json({ message: 'Solicitud enviada' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getSolicitudes: async (req, res) => {
        try {
            const list = await SolicitudReserva.find().sort({ createdAt: -1 });
            res.json(list);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    actualizarEstado: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await SolicitudReserva.findByIdAndUpdate(id, { estado: req.body.estado }, { new: true });
            res.json(updated);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = solicitudesController;
