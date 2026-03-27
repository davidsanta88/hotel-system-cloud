const SolicitudReserva = require('../models/SolicitudReserva');
const Cliente = require('../models/Cliente');
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

    convertirACliente: async (req, res) => {
        try {
            const { id } = req.params;
            const solicitud = await SolicitudReserva.findById(id);
            if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

            // Verificar si el cliente ya existe por documento
            let cliente = await Cliente.findOne({ documento: solicitud.documento });
            
            if (!cliente) {
                cliente = new Cliente({
                    nombre: solicitud.nombre,
                    tipo_documento: solicitud.tipoDocumento,
                    documento: solicitud.documento,
                    telefono: solicitud.celular,
                    email: solicitud.correo || '',
                    observaciones: `Migrado desde solicitud de reserva. Notas: ${solicitud.notas || 'Ninguna'}`
                });
                await cliente.save();
            }

            // Actualizar estado de la solicitud
            solicitud.estado = 'convertida';
            solicitud.convertido = true;
            await solicitud.save();

            res.json({ message: 'Cliente migrado exitosamente', clienteId: cliente._id });
        } catch (err) {
            console.error(err);
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
    },

    eliminarSolicitud: async (req, res) => {
        try {
            const { id } = req.params;
            await SolicitudReserva.findByIdAndDelete(id);
            res.json({ message: 'Solicitud eliminada' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = solicitudesController;
