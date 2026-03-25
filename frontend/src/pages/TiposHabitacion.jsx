import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { Plus, Edit2, Trash2, Home } from 'lucide-react';

const TiposHabitacion = () => {
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentTipo, setCurrentTipo] = useState({ id: null, nombre: '' });

    useEffect(() => {
        fetchTipos();
    }, []);

    const fetchTipos = async () => {
        try {
            const { data } = await api.get('/tipos-habitacion');
            setTipos(data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los tipos de habitación', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/tipos-habitacion/${currentTipo.id}`, { nombre: currentTipo.nombre });
                Swal.fire('Éxito', 'Tipo de habitación actualizado', 'success');
            } else {
                await api.post('/tipos-habitacion', { nombre: currentTipo.nombre });
                Swal.fire('Éxito', 'Tipo de habitación creado', 'success');
            }
            setShowModal(false);
            fetchTipos();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/tipos-habitacion/${id}`);
                Swal.fire('Eliminado', 'El tipo de habitación ha sido eliminado.', 'success');
                fetchTipos();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el tipo', 'error');
            }
        }
    };

    const openModal = (tipo = null) => {
        if (tipo) {
            setCurrentTipo(tipo);
            setEditMode(true);
        } else {
            setCurrentTipo({ id: null, nombre: '' });
            setEditMode(false);
        }
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tipos de Habitación</h1>
                    <p className="text-sm text-gray-500">Administra las clasificaciones de habitaciones</p>
                </div>
                <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2">
                    <Plus size={18} />
                    <span>Nuevo Tipo</span>
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando tipos de habitación...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Tipo</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tipos.map((tipo) => (
                                    <tr key={tipo.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tipo.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal(tipo)} className="text-primary-600 hover:text-primary-900 mx-2">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(tipo.id)} className="text-red-600 hover:text-red-900 mx-2">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {tipos.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-gray-400">
                                            No hay tipos registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="bg-primary-100 p-2 rounded-lg text-primary-600">
                                <Home size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{editMode ? 'Editar' : 'Nuevo'} Tipo</h2>
                        </div>
                        
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="input-field" 
                                    value={currentTipo.nombre}
                                    placeholder="Ej. Simple, Doble, Suite, Presidencial..."
                                    onChange={e => setCurrentTipo({...currentTipo, nombre: e.target.value})} 
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 btn-primary">
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

export default TiposHabitacion;
