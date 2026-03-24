const Registro = require('../models/Registro');
const Habitacion = require('../models/Habitacion');
const Cliente = require('../models/Cliente');

exports.getRegistros = async (req, res) => {
    try {
        const registros = await Registro.find()
            .populate('habitacion', 'numero')
            .populate('cliente', 'nombre')
            .sort({ fechaCreacion: -1 });
        res.json(registros);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getActiveRegistros = async (req, res) => {
    try {
        const registros = await Registro.find({ estado: 'activo' })
            .populate('habitacion', 'numero')
            .populate('cliente', 'nombre')
            .sort({ fechaCreacion: -1 });
        res.json(registros);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRegistroById = async (req, res) => {
    try {
        const { id } = req.params;
        const registro = await Registro.findById(id)
            .populate('habitacion')
            .populate('cliente')
            .populate('huespedes');
        
        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });
        res.json(registro);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createRegistro = async (req, res) => {
    try {
        const { habitacion_id, cliente_id, fecha_ingreso, fecha_salida, huespedes, total, observaciones } = req.body;

        const newReg = new Registro({
            habitacion: habitacion_id,
            cliente: cliente_id,
            huespedes: huespedes || [cliente_id],
            fechaEntrada: fecha_ingreso,
            fechaSalida: fecha_salida,
            total,
            observaciones,
            usuarioCreacion: req.userName
        });

        await newReg.save();
        
        // Actualizar estado de habitación
        await Habitacion.findByIdAndUpdate(habitacion_id, { estado: 'ocupada' });

        res.status(201).json({ message: 'Registro creado con éxito', registro: newReg });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateRegistro = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Registro.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ message: 'Registro actualizado', registro: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
