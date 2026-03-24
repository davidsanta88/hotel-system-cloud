const Cliente = require('../models/Cliente');

exports.getClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find();
        res.json(clientes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createCliente = async (req, res) => {
    try {
        const { nombre, documento, tipo_documento, telefono, email } = req.body;
        const newCliente = new Cliente({
            nombre,
            documento,
            tipoDocumento: tipo_documento,
            telefono,
            email,
            usuarioCreacion: req.userName
        });
        await newCliente.save();
        res.status(201).json({ message: 'Cliente creado con éxito', id: newCliente._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Cliente.findByIdAndUpdate(id, {
            ...req.body,
            usuarioModificacion: req.userName,
            fechaModificacion: Date.now()
        }, { new: true });
        res.json({ message: 'Cliente actualizado con éxito', cliente: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        await Cliente.findByIdAndDelete(id);
        res.json({ message: 'Cliente eliminado con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
