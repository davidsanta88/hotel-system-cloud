import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, MessageSquare } from 'lucide-react';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { usePermissions } from '../hooks/usePermissions';

const Clientes = () => {
    const { user } = useContext(AuthContext);
    const { canEdit, canDelete } = usePermissions('clientes');
    const [clientes, setClientes] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentCliente, setCurrentCliente] = useState({
        nombre: '',
        documento: '',
        tipo_documento: 'CC',
        telefono: '',
        email: '',
        municipio_origen_id: '',
        observaciones: ''
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            const [clientesRes, municipiosRes] = await Promise.all([
                api.get('/clientes'),
                api.get('/municipios')
            ]);
            setClientes(clientesRes.data);
            setMunicipios(municipiosRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching clientes:', error);
            setLoading(false);
            Swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
        }
    };

    const handleOpenModal = (cliente = null) => {
        if (cliente) {
            setCurrentCliente({
                ...cliente,
                tipo_documento: cliente.tipo_documento || 'CC',
                municipio_origen_id: cliente.municipio_origen_id || ''
            });
            setIsEditing(true);
        } else {
            setCurrentCliente({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '', observaciones: '' });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentCliente({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '', observaciones: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/clientes/${currentCliente.id}`, currentCliente);
                Swal.fire('Éxito', 'Cliente actualizado correctamente', 'success');
            } else {
                await api.post('/clientes', currentCliente);
                Swal.fire('Éxito', 'Cliente registrado correctamente', 'success');
            }
            handleCloseModal();
            fetchClientes();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar cliente', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/clientes/${id}`);
                Swal.fire('Eliminado!', 'El cliente ha sido eliminado.', 'success');
                fetchClientes();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el cliente', 'error');
            }
        }
    };

    const filteredClientes = clientes.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.documento.includes(searchTerm)
    );

    // Opciones para el buscador de municipios
    const municipioOptions = municipios
        .filter(m => m.visualizar)
        .map(m => ({
            value: m.id,
            label: m.nombre
        }));

    const selectedMunicipioOption = municipioOptions.find(opt => String(opt.value) === String(currentCliente.municipio_origen_id)) || null;

    const selectStyles = {
        control: (base, state) => ({
            ...base,
            border: state.isFocused ? '1px solid #3b82f6' : '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '2px',
            fontSize: '14px',
            boxShadow: 'none',
            '&:hover': { border: '1px solid #3b82f6' }
        }),
        option: (base, state) => ({
            ...base,
            fontSize: '13px',
            backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
            color: state.isSelected ? 'white' : '#374151',
            padding: '10px'
        }),
        menu: (base) => ({
            ...base,
            borderRadius: '0.75rem',
            overflow: 'hidden',
            zIndex: 60
        })
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando clientes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h1>
                {canEdit && (
                    <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        Nuevo Cliente
                    </button>
                )}
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o documento..."
                            className="input-field pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                                <th className="p-4 font-semibold">T. Doc</th>
                                <th className="p-4 font-semibold">Documento</th>
                                <th className="p-4 font-semibold">Nombre Completo</th>
                                <th className="p-4 font-semibold">Contacto</th>
                                <th className="p-4 font-semibold">Origen</th>
                                <th className="p-4 font-semibold text-xs text-gray-400 uppercase tracking-wider">Registrado Por</th>
                                <th className="p-4 font-semibold text-xs text-gray-400 uppercase tracking-wider">Última Mod.</th>
                                {(canEdit || canDelete) && <th className="p-4 font-semibold text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClientes.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-4 text-center text-gray-500">
                                        No se encontraron clientes.
                                    </td>
                                </tr>
                            ) : (
                                filteredClientes.map(cliente => (
                                    <tr key={cliente.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-600 font-mono text-sm">{cliente.tipo_documento}</td>
                                        <td className="p-4 font-medium text-gray-800">{cliente.documento}</td>
                                        <td className="p-4 text-gray-600">{cliente.nombre}</td>
                                        <td className="p-4 text-gray-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span>{cliente.telefono || '-'}</span>
                                                {cliente.telefono && (
                                                    <a 
                                                        href={`https://wa.me/${cliente.telefono.replace(/\s+/g, '')}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-800 transition-colors"
                                                        title="Escribir al WhatsApp"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </a>
                                                )}
                                            </div>
                                             <div className="text-gray-400 text-[10px]">{cliente.email || ''}</div>
                                             {cliente.observaciones && (
                                                <div className="mt-1 p-1 bg-amber-50 text-[10px] text-amber-700 rounded border border-amber-100 italic">
                                                    Obs: {cliente.observaciones}
                                                </div>
                                             )}
                                         </td>
                                        <td className="p-4 text-gray-600 text-sm whitespace-nowrap">
                                            {cliente.municipio_nombre || (cliente.municipio_origen_id && municipios.find(m => String(m.id) === String(cliente.municipio_origen_id))?.nombre) || '-'}
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <div className="text-gray-900 font-medium">{cliente.UsuarioCreacion || cliente.usuarioCreacion || '-'}</div>
                                            <div className="text-gray-400 text-[10px]">{(cliente.FechaCreacion || cliente.fechaCreacion) ? new Date(cliente.FechaCreacion || cliente.fechaCreacion).toLocaleDateString() : ''}</div>
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <div className="text-gray-900 font-medium">{cliente.UsuarioModificacion || cliente.usuarioModificacion || '-'}</div>
                                            <div className="text-gray-400 text-[10px]">{(cliente.FechaModificacion || cliente.fechaModificacion) ? new Date(cliente.FechaModificacion || cliente.fechaModificacion).toLocaleDateString() : ''}</div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit && (
                                                        <button 
                                                            onClick={() => handleOpenModal(cliente)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDelete(cliente.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para Crear/Editar */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={currentCliente.nombre}
                                    onChange={e => setCurrentCliente({...currentCliente, nombre: e.target.value})}
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Doc. *</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={currentCliente.tipo_documento}
                                        onChange={e => setCurrentCliente({...currentCliente, tipo_documento: e.target.value})}
                                    >
                                        <option value="CC">CÉDULA</option>
                                        <option value="CE">EXTRANJERÍA</option>
                                        <option value="PASAPORTE">PASAPORTE</option>
                                        <option value="TI">T. IDENTIDAD</option>
                                        <option value="NIT">NIT</option>
                                    </select>
                                </div>
                                <div className="w-full sm:w-2/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Documento *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={currentCliente.documento}
                                        onChange={e => setCurrentCliente({...currentCliente, documento: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={currentCliente.telefono}
                                        onChange={e => setCurrentCliente({...currentCliente, telefono: e.target.value})}
                                    />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={currentCliente.email}
                                        onChange={e => setCurrentCliente({...currentCliente, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Origen</label>
                                <Select
                                    placeholder="Buscar ciudad/municipio..."
                                    options={municipioOptions}
                                    value={selectedMunicipioOption}
                                    onChange={(opt) => setCurrentCliente({...currentCliente, municipio_origen_id: opt ? opt.value : ''})}
                                    styles={selectStyles}
                                    noOptionsMessage={() => "No se encontró el municipio"}
                                    isClearable
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Observaciones</label>
                                <textarea
                                    className="input-field min-h-[80px]"
                                    placeholder="Notas especiales del cliente..."
                                    value={currentCliente.observaciones || ''}
                                    onChange={e => setCurrentCliente({...currentCliente, observaciones: e.target.value})}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button type="submit" className="flex-1 btn-primary">
                                    Guardar
                                </button>
                                <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clientes;
