import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { StickyNote, Plus, Search, Save, X, Trash2, Bell, CheckCircle, AlertCircle, User, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

const Notas = () => {
    const { user } = useContext(AuthContext);
    const { canView, canEdit, canDelete } = usePermissions('notas');
    const [notas, setNotas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'sent', 'received'
    
    const [formData, setFormData] = useState({
        id: null,
        titulo: '',
        descripcion: '',
        fecha_alerta: new Date().toISOString().split('T')[0],
        usuario_destino_id: '',
        prioridad: 'Normal'
    });

    useEffect(() => {
        if (canView) {
            fetchData();
        }
    }, [canView]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resNotas, resUsuarios] = await Promise.all([
                api.get('/notas'),
                api.get('/usuarios')
            ]);
            setNotas(resNotas.data);
            setUsuarios(resUsuarios.data);
            setLoading(false);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar la información', 'error');
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await api.put(`/notas/${formData.id}`, formData);
                Swal.fire('Éxito', 'Nota actualizada', 'success');
            } else {
                await api.post('/notas', formData);
                Swal.fire('Éxito', 'Nota creada', 'success');
            }
            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/notas/${id}`);
                Swal.fire('Eliminado', 'La nota ha sido eliminada', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar la nota', 'error');
            }
        }
    };

    const handleEdit = (nota) => {
        setFormData({
            id: nota.id,
            titulo: nota.titulo,
            descripcion: nota.descripcion,
            fecha_alerta: nota.fecha_alerta.split('T')[0],
            usuario_destino_id: nota.usuario_destino_id || '',
            prioridad: nota.prioridad
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            id: null,
            titulo: '',
            descripcion: '',
            fecha_alerta: new Date().toISOString().split('T')[0],
            usuario_destino_id: '',
            prioridad: 'Normal'
        });
    };

    const filteredNotas = notas.filter(n => {
        const matchesSearch = n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            n.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filter === 'sent') return matchesSearch && n.usuario_creacion_id === user.id;
        if (filter === 'received') return matchesSearch && (n.usuario_destino_id === user.id || n.usuario_destino_id === null);
        return matchesSearch;
    });

    if (!canView) return <div className="p-10 text-center font-bold text-red-500">No tienes permisos para acceder a este módulo.</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <StickyNote className="text-yellow-500" />
                        Notas y Alertas Internas
                    </h1>
                    <p className="text-gray-500 font-medium">Gestiona recordatorios y avisos para el personal</p>
                </div>
                
                <button 
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:-translate-y-1"
                >
                    <Plus size={20} />
                    Nueva Nota
                </button>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar en notas..." 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-600 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-gray-50 p-1 rounded-2xl w-full md:w-auto">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        TODAS
                    </button>
                    <button 
                        onClick={() => setFilter('received')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === 'received' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        RECIBIDAS
                    </button>
                    <button 
                        onClick={() => setFilter('sent')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === 'sent' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        ENVIADAS
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-bold">Cargando notas...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotas.map(nota => (
                        <div key={nota.id} className={`group relative bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col ${nota.leida ? 'opacity-75' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    nota.prioridad === 'Urgente' ? 'bg-red-100 text-red-600' :
                                    nota.prioridad === 'Alta' ? 'bg-orange-100 text-orange-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {nota.prioridad}
                                </span>
                                <div className="flex gap-1">
                                    {canEdit && (
                                        <button onClick={() => handleEdit(nota)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                                            <Bell size={16} />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button onClick={() => handleDelete(nota)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-black text-gray-800 mb-2">{nota.titulo}</h3>
                            <p className="text-sm text-gray-500 flex-grow leading-relaxed font-medium">
                                {nota.descripcion}
                            </p>
                            
                            <div className="mt-6 pt-6 border-t border-gray-50 space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <Users size={12} className="text-blue-500" />
                                    Para: {nota.usuario_destino_nombre || 'Todos'}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <User size={12} className="text-emerald-500" />
                                    Por: {nota.usuario_creacion_nombre}
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>Alerta: {new Date(nota.fecha_alerta).toLocaleDateString()}</span>
                                    {nota.leida && <span className="flex items-center gap-1 text-emerald-500"><CheckCircle size={10} /> LEÍDA</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredNotas.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                             <StickyNote className="mx-auto text-gray-200 mb-4" size={48} />
                             <p className="text-gray-400 font-bold">No se encontraron notas</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-black text-gray-800">
                                {formData.id ? 'Editar Nota' : 'Nueva Nota / Alerta'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Título de la alerta</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                                    placeholder="Ej: Pagar servicio público"
                                    required
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mensaje detallado</label>
                                <textarea 
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-600 min-h-[100px]"
                                    placeholder="Describe lo que se debe tener en cuenta..."
                                    required
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fecha Alerta</label>
                                    <input 
                                        type="date" 
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                                        required
                                        value={formData.fecha_alerta}
                                        onChange={(e) => setFormData({...formData, fecha_alerta: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Prioridad</label>
                                    <select 
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                                        value={formData.prioridad}
                                        onChange={(e) => setFormData({...formData, prioridad: e.target.value})}
                                    >
                                        <option value="Normal">Normal</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Urgente">Urgente</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Asignar a:</label>
                                <select 
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                                    value={formData.usuario_destino_id}
                                    onChange={(e) => setFormData({...formData, usuario_destino_id: e.target.value})}
                                >
                                    <option value="">Todos los usuarios</option>
                                    {usuarios.map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 rounded-2xl font-black text-gray-400 bg-gray-100 hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-6 py-3 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Guardar Nota
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notas;
