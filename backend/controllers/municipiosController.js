const Municipio = require('../models/Municipio');

exports.getMunicipios = async (req, res) => {
    try {
        const municipios = await Municipio.find().sort({ nombre: 1 });
        res.json(municipios);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createMunicipio = async (req, res) => {
    try {
        const newMun = new Municipio(req.body);
        await newMun.save();
        res.status(201).json(newMun);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateMunicipio = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Municipio.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteMunicipio = async (req, res) => {
    try {
        const { id } = req.params;
        await Municipio.findByIdAndDelete(id);
        res.json({ message: 'Municipio eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
