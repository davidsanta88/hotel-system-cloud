const Cliente = require('../models/Cliente');

exports.getClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find().populate('municipio_origen_id', 'nombre');
        const mappedClientes = [];
        for (const cRaw of clientes) {
            const c = cRaw.toObject ? cRaw.toObject() : cRaw;
            let munObj = c.municipio_origen_id || c.ciudad || c.municipio_id;
            let municipio_nombre = '-';

            if (munObj && typeof munObj === 'object' && munObj.nombre) {
                municipio_nombre = munObj.nombre;
            } else if (munObj) {
                const Municipio = require('../models/Municipio');
                const m = await Municipio.findById(munObj);
                if (m) {
                    municipio_nombre = m.nombre;
                }
            }

            const docNum = c.documento || c.documentoNumero || c.documento_numero || '';
            const docTip = c.tipo_documento || c.documentoTipo || c.tipo_doc || '';

            const obj = {
                id: c._id,
                _id: c._id,
                nombre: c.nombre || '',
                documento: docNum,
                documentoNumero: docNum,
                tipo_documento: docTip,
                documentoTipo: docTip,
                telefono: c.telefono || '',
                email: c.email || '',
                municipio_origen_id: munObj?._id || munObj || null,
                municipio_nombre: municipio_nombre,
                ciudad_nombre: municipio_nombre,
                UsuarioCreacion: c.usuarioCreacion || c.UsuarioCreacion || 'Sistema',
                usuarioCreacion: c.usuarioCreacion || c.UsuarioCreacion || 'Sistema',
                FechaCreacion: c.fechaCreacion || c.FechaCreacion,
                UsuarioModificacion: c.usuarioModificacion || c.UsuarioModificacion || '-',
                FechaModificacion: c.fechaModificacion || c.FechaModificacion
            };
            mappedClientes.push(obj);
        }
        res.json(mappedClientes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createCliente = async (req, res) => {
    try {
        const payload = req.body;
        const nombre = payload.nombre;
        const documento = payload.documento || payload.documentoNumero;
        const tipo_documento = payload.tipo_documento || payload.documentoTipo;
        const telefono = payload.telefono;
        const email = payload.email;
        // SOPORTE PARA TODOS LOS NOMBRES POSIBLES DE ORIGEN
        let originId = payload.municipio_origen_id || payload.ciudad || payload.municipio_id;
        
        if (originId === '' || !originId) originId = null;

        // Check for duplicates
        if (documento) {
            const existing = await Cliente.findOne({ documento });
            if (existing) {
                return res.status(400).json({ message: `El documento ${documento} ya está registrado a nombre de ${existing.nombre}` });
            }
        }

        const newCliente = new Cliente({
            nombre,
            documento,
            tipo_documento,
            telefono,
            email,
            municipio_origen_id: originId,
            usuarioCreacion: req.userName || 'Sistema',
            fechaCreacion: Date.now()
        });

        await newCliente.save();
        res.status(201).json({ message: 'Cliente creado con éxito', id: newCliente._id });
    } catch (err) {
        console.error('Error creating client:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        const cliente = await Cliente.findById(id);
        if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

        cliente.nombre = payload.nombre;
        cliente.documento = payload.documento || payload.documentoNumero;
        cliente.tipo_documento = payload.tipo_documento || payload.documentoTipo;
        cliente.telefono = payload.telefono;
        cliente.email = payload.email;
        
        let originId = payload.municipio_origen_id || payload.ciudad || payload.municipio_id;
        cliente.municipio_origen_id = (originId === '' || !originId) ? null : originId;
        
        cliente.usuarioModificacion = req.userName || 'Sistema';
        cliente.fechaModificacion = Date.now();

        await cliente.save();
        res.json({ message: 'Cliente actualizado con éxito', cliente });
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
