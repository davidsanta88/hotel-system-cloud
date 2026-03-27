import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePermissions } from '../hooks/usePermissions';

const ToggleSwitch = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={disabled ? null : onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-green-500' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

const Municipios = () => {
    const { canEdit, canDelete } = usePermissions('municipios');
    const [municipios, setMunicipios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [current, setCurrent] = useState({ nombre: '', visualizar: true });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.get('/municipios');
            setMunicipios(response.data);
            setLoading(false);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los municipios', 'error');
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setCurrent({
                ...item,
                visualizar: item.visualizar !== false 
            });
            setIsEditing(true);
        } else {
            setCurrent({ nombre: '', visualizar: true });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/municipios/${current.id}`, current);
                Swal.fire('Éxito', 'Municipio actualizado correctamente', 'success');
            } else {
                await api.post('/municipios', current);
                Swal.fire('Éxito', 'Municipio registrado correctamente', 'success');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
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
                await api.delete(`/municipios/${id}`);
                Swal.fire('Eliminado!', 'El municipio ha sido eliminado.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el municipio', 'error');
            }
        }
    };

    const handleToggleVisualizar = async (item) => {
        try {
            await api.put(`/municipios/${item.id}`, { 
                nombre: item.nombre, 
                visualizar: !item.visualizar 
            });
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'No se pudo cambiar la visibilidad';
            Swal.fire('Error', errorMsg, 'error');
        }
    };

    const filtered = municipios.filter(m => 
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando municipios...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Lugares de Origen (Municipios)</h1>
                {canEdit && (
                    <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        Nuevo Lugar
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="Buscar municipio..."
                            className="input-field pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    </div>
                </div>
                
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr className="text-gray-600 border-b border-gray-100">
                                <th className="p-4 font-semibold uppercase text-xs tracking-wider">Nombre del Lugar (Municipio)</th>
                                <th className="p-4 font-semibold text-center uppercase text-xs tracking-wider">Visible</th>
                                <th className="p-4 font-semibold text-right uppercase text-xs tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-4 text-center text-gray-500">
                                        No se encontraron lugares.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">{item.nombre}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <ToggleSwitch
                                                    checked={item.visualizar}
                                                    disabled={!canEdit}
                                                    onChange={() => handleToggleVisualizar(item)}
                                                />
                                                <span className={`text-[10px] font-bold ${item.visualizar ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {item.visualizar ? 'Visible' : 'Oculto'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {canEdit && (
                                                    <button 
                                                        onClick={() => handleOpenModal(item)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditing ? 'Editar Lugar' : 'Nuevo Lugar'}
                            </h2>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (ej: ANTIOQUIA-MEDELLIN) *</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field uppercase"
                                    value={current.nombre}
                                    onChange={e => setCurrent({...current, nombre: e.target.value.toUpperCase()})}
                                />
                            </div>
                            
                            <div className="flex items-center gap-2 mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <input 
                                    type="checkbox" 
                                    id="visualizar"
                                    checked={current.visualizar}
                                    onChange={e => setCurrent({...current, visualizar: e.target.checked})}
                                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer"
                                />
                                <label htmlFor="visualizar" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    Visualizar al registrar cliente
                                </label>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button type="submit" className="flex-1 btn-primary">
                                    Guardar
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
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

export default Municipios;
