import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { Plus, Edit2, Trash2, ShieldCheck } from 'lucide-react';

const EstadosHabitacion = () => {
    const [estados, setEstados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentEstado, setCurrentEstado] = useState({ id: null, nombre: '' });

    useEffect(() => {
        fetchEstados();
    }, []);

    const fetchEstados = async () => {
        try {
            const { data } = await api.get('/estados-habitacion');
            setEstados(data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los estados de habitación', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/estados-habitacion/${currentEstado.id}`, { nombre: currentEstado.nombre });
                Swal.fire('Éxito', 'Estado actualizado', 'success');
            } else {
                await api.post('/estados-habitacion', { nombre: currentEstado.nombre });
                Swal.fire('Éxito', 'Estado creado', 'success');
            }
            setShowModal(false);
            fetchEstados();
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
                await api.delete(`/estados-habitacion/${id}`);
                Swal.fire('Eliminado', 'El estado ha sido eliminado.', 'success');
                fetchEstados();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar', 'error');
            }
        }
    };

    const openModal = (estado = null) => {
        if (estado) {
            setCurrentEstado(estado);
            setEditMode(true);
        } else {
            setCurrentEstado({ id: null, nombre: '' });
            setEditMode(false);
        }
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Estados de Habitación</h1>
                    <p className="text-sm text-gray-500">Administra los estados posibles de los cuartos (Limpieza, Mantenimiento, etc)</p>
                </div>
                <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2">
                    <Plus size={18} />
                    <span>Nuevo Estado</span>
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando estados...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {estados.map((est) => (
                                    <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{est.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Impedir borrar estados base como sugerencia visual, aunque el backend protegerá si están en uso */}
                                            <button onClick={() => openModal(est)} className="text-primary-600 hover:text-primary-900 mx-2">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(est.id)} className="text-red-600 hover:text-red-900 mx-2">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {estados.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-gray-400">
                                            No hay estados registrados.
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
                                <ShieldCheck size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{editMode ? 'Editar' : 'Nuevo'} Estado</h2>
                        </div>
                        
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="input-field" 
                                    value={currentEstado.nombre}
                                    placeholder="Ej. Limpieza, Disponible..."
                                    onChange={e => setCurrentEstado({...currentEstado, nombre: e.target.value})} 
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

export default EstadosHabitacion;
