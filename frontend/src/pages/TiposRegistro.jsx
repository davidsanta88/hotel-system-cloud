import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, ClipboardList } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePermissions } from '../hooks/usePermissions';

// Reusable Toggle Switch Component
const ToggleSwitch = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

const TiposRegistro = () => {
    const { user } = useContext(AuthContext);
    const { canView, canEdit, canDelete } = usePermissions('tipos_registro');
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [current, setCurrent] = useState({ nombre: '', descripcion: '', visualizar: true });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchTipos();
    }, []);

    const fetchTipos = async () => {
        try {
            const response = await api.get('/tipos-registro');
            setTipos(response.data);
            setLoading(false);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            Swal.fire('Error', `No se pudieron cargar los tipos de registro: ${errorMsg}`, 'error');
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setCurrent(item);
            setIsEditing(true);
        } else {
            setCurrent({ nombre: '', descripcion: '', visualizar: true });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/tipos-registro/${current.id}`, current);
                Swal.fire('Éxito', 'Tipo de registro actualizado', 'success');
            } else {
                await api.post('/tipos-registro', current);
                Swal.fire('Éxito', 'Tipo de registro creado', 'success');
            }
            setShowModal(false);
            fetchTipos();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar el tipo de registro', 'error');
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
                await api.delete(`/tipos-registro/${id}`);
                Swal.fire('Eliminado!', 'El tipo de registro ha sido eliminado.', 'success');
                fetchTipos();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el tipo de registro', 'error');
            }
        }
    };

    // Note: usePermissions might need 'tipos_registro' code added to its logic
    // but usually it checks the user permissions object.
    
    const filtered = tipos.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando tipos de registro...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tipos de Registro de Huéspedes</h1>
                    <p className="text-gray-500">Configuración de modalidades de hospedaje (Mensual, Rato, Formal, etc.)</p>
                </div>
                {canEdit && (
                    <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 shadow-lg">
                        <Plus size={20} />
                        Nuevo Tipo
                    </button>
                )}
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="Buscar tipo..."
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
                                <th className="p-4 font-semibold uppercase text-xs tracking-wider">Nombre</th>
                                <th className="p-4 font-semibold">Descripción</th>
                                <th className="p-4 font-semibold text-center">Visible</th>
                                {(canEdit || canDelete) && <th className="p-4 font-semibold text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-4 text-center text-gray-500">
                                        No se encontraron tipos de registro.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-gray-800">{item.nombre}</td>
                                        <td className="p-4 text-gray-600 text-sm">{item.descripcion || '-'}</td>
                                        <td className="p-4 text-center">
                                            <ToggleSwitch
                                                checked={item.visualizar}
                                                onChange={() => {
                                                    if (canEdit) {
                                                        const updated = { ...item, visualizar: !item.visualizar };
                                                        api.put(`/tipos-registro/${item.id}`, updated)
                                                            .then(() => fetchTipos());
                                                    }
                                                }}
                                            />
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit && (
                                                        <button 
                                                            onClick={() => handleOpenModal(item)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 bg-white rounded-lg shadow-sm border border-gray-100"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 bg-white rounded-lg shadow-sm border border-gray-100"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-gray-100">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {isEditing ? 'Editar Tipo' : 'Nuevo Tipo de Registro'}
                                </h2>
                                <p className="text-xs text-gray-500">Configura una modalidad de hospedaje</p>
                            </div>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    placeholder="Ej. Mensual, Formal, Rato..."
                                    value={current.nombre}
                                    onChange={e => setCurrent({...current, nombre: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    className="input-field h-24 resize-none"
                                    placeholder="Detalles sobre esta modalidad..."
                                    value={current.descripcion || ''}
                                    onChange={e => setCurrent({...current, descripcion: e.target.value})}
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Disponible para seleccionar</span>
                                <ToggleSwitch
                                    checked={current.visualizar}
                                    onChange={() => setCurrent({...current, visualizar: !current.visualizar})}
                                />
                            </div>

                            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary py-2.5">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 btn-primary py-2.5 shadow-md">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TiposRegistro;
