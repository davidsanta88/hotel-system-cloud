const Cliente = require('../models/Cliente');
const Municipio = require('../models/Municipio'); // Asegurar registro del modelo

exports.getClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find().populate('municipio_origen_id', 'nombre departamento');
        const formatted = clientes.map(c => {
            const doc = c._doc || c;
            
            // Lógica mejorada para el nombre del municipio (evitar duplicados de departamento)
            let municipio_nombre = '-';
            if (c.municipio_origen_id && typeof c.municipio_origen_id === 'object' && c.municipio_origen_id.nombre) {
                const nombreMun = c.municipio_origen_id.nombre;
                const deptoMun = c.municipio_origen_id.departamento;
                
                if (deptoMun && !nombreMun.startsWith(deptoMun)) {
                    municipio_nombre = `${deptoMun}-${nombreMun}`;
                } else {
                    municipio_nombre = nombreMun;
                }
            } else if (c.municipio_nombre) {
                municipio_nombre = c.municipio_nombre;
            }


            return {
                ...doc,
                id: c._id.toString(),
                municipio_nombre: municipio_nombre,
                // Asegurar compatibilidad con ambos formatos (el frontend usa Capitalizado)
                UsuarioCreacion: c.usuarioCreacion || c.UsuarioCreacion || '-',
                FechaCreacion: c.fechaCreacion || c.FechaCreacion,
                UsuarioModificacion: c.usuarioModificacion || c.UsuarioModificacion || '-',
                FechaModificacion: c.fechaModificacion || c.FechaModificacion
            };
        });
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.createCliente = async (req, res) => {
    try {
        const newCliente = new Cliente({
            ...req.body,
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
