import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
    ClipboardCheck, 
    Plus, 
    Calendar, 
    User, 
    Home, 
    Layers, 
    CheckCircle2, 
    XCircle, 
    MinusCircle, 
    MessageSquare, 
    Trash2,
    Search,
    ChevronRight,
    ArrowRight,
    Save
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AuditoriaLimpieza = () => {
    const [auditorias, setAuditorias] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [checklistTemplate, setChecklistTemplate] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        tipo: 'HABITACION',
        habitacion_id: '',
        area_general: '',
        items: [],
        notas_generales: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [auditoriasRes, roomsRes, configRes] = await Promise.all([
                api.get('/auditoria-limpieza'),
                api.get('/habitaciones'),
                api.get('/hotel-config')
            ]);
            setAuditorias(auditoriasRes.data);
            setRooms(roomsRes.data);
            setChecklistTemplate(configRes.data.checklistAuditoria || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'No se pudo cargar la información', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            tipo: 'HABITACION',
            habitacion_id: '',
            area_general: '',
            items: checklistTemplate.map(name => ({
                nombre: name,
                estado: 'CUMPLE',
                observaciones: ''
            })),
            notas_generales: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.tipo === 'HABITACION' && !formData.habitacion_id) {
            return Swal.fire('Error', 'Debe seleccionar una habitación', 'error');
        }
        if (formData.tipo === 'GENERAL' && !formData.area_general) {
            return Swal.fire('Error', 'Debe especificar el área general', 'error');
        }

        try {
            // Calcular puntuación básica (porcentaje de "Cumple")
            const cumpleCount = formData.items.filter(i => i.estado === 'CUMPLE').length;
            const totalEval = formData.items.filter(i => i.estado !== 'N/A').length;
            const puntuacion = totalEval > 0 ? (cumpleCount / totalEval) * 100 : 100;

            await api.post('/auditoria-limpieza', { ...formData, puntuacion });
            Swal.fire('Éxito', 'Auditoría registrada correctamente', 'success');
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving audit:', error);
            Swal.fire('Error', 'No se pudo guardar la auditoría', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar auditoría?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/auditoria-limpieza/${id}`);
                setAuditorias(auditorias.filter(a => a.id !== id));
                Swal.fire('Eliminado', 'La auditoría ha sido eliminada', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    };

    const getEstadoIcon = (estado) => {
        switch (estado) {
            case 'CUMPLE': return <CheckCircle2 className="text-emerald-500" size={18} />;
            case 'NO_CUMPLE': return <XCircle className="text-rose-500" size={18} />;
            default: return <MinusCircle className="text-slate-400" size={18} />;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-primary-100 rounded-3xl text-primary-600">
                            <ClipboardCheck size={36} />
                        </div>
                        Seguimiento de Limpieza
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 max-w-lg">
                        Control periódico y auditorías de aseo general para garantizar los estándares de calidad del hotel.
                    </p>
                </div>
                
                <button 
                    onClick={handleOpenModal}
                    className="flex items-center gap-3 bg-primary-600 text-white px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    Nueva Auditoría
                </button>
            </div>

            {/* List of Audits */}
            <div className="grid grid-cols-1 gap-6">
                {auditorias.length > 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fecha / Auditor</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Objetivo</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Puntuación</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {auditorias.map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-slate-100 rounded-2xl text-slate-500 group-hover:bg-white transition-colors">
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-700">
                                                        {format(new Date(a.fecha_auditoria), "d 'de' MMMM, yyyy", { locale: es })}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                        <User size={12} /> {a.realizado_por_nombre}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                {a.tipo === 'HABITACION' ? (
                                                    <>
                                                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                                            <Home size={16} />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">Habitación {a.habitacion_numero}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                                            <Layers size={16} />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">{a.area_general}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${a.puntuacion >= 80 ? 'bg-emerald-500' : a.puntuacion >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${a.puntuacion}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-sm font-black ${a.puntuacion >= 80 ? 'text-emerald-600' : a.puntuacion >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                    {Math.round(a.puntuacion)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => handleDelete(a.id)}
                                                className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ClipboardCheck size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">No hay auditorías registradas</h3>
                        <p className="text-slate-500 mt-2">Comienza realizando la primera inspección de limpieza.</p>
                    </div>
                )}
            </div>

            {/* Modal for New Audit */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <Plus className="text-primary-600" />
                                Nueva Auditoría de Limpieza
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                                <XCircle size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Target Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, tipo: 'HABITACION'})}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                                        formData.tipo === 'HABITACION' 
                                        ? 'border-primary-500 bg-primary-50/50 text-primary-700 shadow-lg shadow-primary-100' 
                                        : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                    }`}
                                >
                                    <Home size={32} />
                                    <span className="font-black uppercase tracking-widest text-[10px]">Habitación</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, tipo: 'GENERAL'})}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                                        formData.tipo === 'GENERAL' 
                                        ? 'border-primary-500 bg-primary-50/50 text-primary-700 shadow-lg shadow-primary-100' 
                                        : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                    }`}
                                >
                                    <Layers size={32} />
                                    <span className="font-black uppercase tracking-widest text-[10px]">Área General</span>
                                </button>
                            </div>

                            {/* Specific Target Selection */}
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                {formData.tipo === 'HABITACION' ? (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Habitación</label>
                                        <select
                                            value={formData.habitacion_id}
                                            onChange={(e) => setFormData({...formData, habitacion_id: e.target.value})}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white outline-none transition-all"
                                            required
                                        >
                                            <option value="">Seleccione...</option>
                                            {rooms.map(r => (
                                                <option key={r.id} value={r.id}>Habitación {r.numero} - {r.tipo_nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Área</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Pasillo Principal, Piscina, Lobby..."
                                            value={formData.area_general}
                                            onChange={(e) => setFormData({...formData, area_general: e.target.value})}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white outline-none transition-all"
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Checklist Items */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <ClipboardCheck size={14} /> Ítems a Evaluar
                                </label>
                                
                                <div className="space-y-3">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-slate-700">{item.nombre}</span>
                                                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 gap-1">
                                                    {['CUMPLE', 'NO_CUMPLE', 'N/A'].map(est => (
                                                        <button
                                                            key={est}
                                                            type="button"
                                                            onClick={() => {
                                                                const newItems = [...formData.items];
                                                                newItems[index].estado = est;
                                                                setFormData({...formData, items: newItems});
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${
                                                                item.estado === est 
                                                                ? est === 'CUMPLE' ? 'bg-emerald-500 text-white shadow-md' :
                                                                  est === 'NO_CUMPLE' ? 'bg-rose-500 text-white shadow-md' :
                                                                  'bg-slate-400 text-white shadow-md'
                                                                : 'text-slate-400 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {est.replace('_', ' ')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute left-3 top-3 text-slate-300">
                                                    <MessageSquare size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Observaciones específicas..."
                                                    value={item.observaciones}
                                                    onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[index].observaciones = e.target.value;
                                                        setFormData({...formData, items: newItems});
                                                    }}
                                                    className="w-full pl-9 pr-4 py-2 bg-white/50 border border-slate-100 rounded-xl text-xs font-medium text-slate-600 outline-none focus:bg-white transition-all"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* General Notes */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Generales</label>
                                <textarea
                                    rows="3"
                                    value={formData.notas_generales}
                                    onChange={(e) => setFormData({...formData, notas_generales: e.target.value})}
                                    placeholder="Cualquier comentario adicional sobre el estado general..."
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-700 focus:bg-white outline-none transition-all resize-none"
                                />
                            </div>
                        </form>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-4 px-6 border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-2 py-4 px-12 bg-primary-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Guardar Auditoría
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditoriaLimpieza;
