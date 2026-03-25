import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const MediosPago = () => {
    const [medios, setMedios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentMedio, setCurrentMedio] = useState({ nombre: '' });

    useEffect(() => {
        fetchMedios();
    }, []);

    const fetchMedios = async () => {
        try {
            const { data } = await api.get('/medios-pago');
            setMedios(data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los medios de pago', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/medios-pago/${currentMedio.id}`, currentMedio);
                Swal.fire('Éxito', 'Medio de pago actualizado', 'success');
            } else {
                await api.post('/medios-pago', currentMedio);
                Swal.fire('Éxito', 'Medio de pago creado', 'success');
            }
            setShowModal(false);
            fetchMedios();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás eliminarlo si está asociado a registros de huéspedes.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/medios-pago/${id}`);
                Swal.fire('Eliminado', 'El medio de pago ha sido eliminado.', 'success');
                fetchMedios();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el medio de pago', 'error');
            }
        }
    };

    const openModal = (medio = null) => {
        if (medio) {
            setCurrentMedio(medio);
            setEditMode(true);
        } else {
            setCurrentMedio({ nombre: '' });
            setEditMode(false);
        }
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Medios de Pago</h1>
                    <p className="text-sm text-gray-500">Administra los métodos de pago aceptados en recepción</p>
                </div>
                <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2">
                    <Plus size={18} />
                    <span>Nuevo Medio</span>
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando medios de pago...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {medios.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 uppercase">{m.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal(m)} className="text-primary-600 hover:text-primary-900 mx-2">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-900 mx-2">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {medios.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-gray-400">
                                            No hay medios de pago registrados.
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
                    <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">{editMode ? 'Editar' : 'Nuevo'} Medio de Pago</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                <input type="text" required className="input-field uppercase" value={currentMedio.nombre}
                                    onChange={e => setCurrentMedio({...currentMedio, nombre: e.target.value})} 
                                    placeholder="Ej. TARJETA VISA" />
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediosPago;
