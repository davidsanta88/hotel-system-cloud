import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Wrench, 
    AlertTriangle, 
    CheckCircle2, 
    Plus, 
    Clock, 
    ChevronRight, 
    X,
    Loader2,
    DollarSign,
    ClipboardList,
    MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Mantenimiento = () => {
    const [tasks, setTasks] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSolveModal, setShowSolveModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [formData, setFormData] = useState({
        habitacion_id: '',
        descripcion: '',
        prioridad: 'MEDIA'
    });
    
    // Form for solving task
    const [solveData, setSolveData] = useState({
        costo: 0,
        solucion_notas: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, habsRes] = await Promise.all([
                api.get('/mantenimiento'),
                api.get('/habitaciones')
            ]);
            setTasks(tasksRes.data);
            setHabitaciones(habsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/mantenimiento', formData);
            setShowModal(false);
            setFormData({ habitacion_id: '', descripcion: '', prioridad: 'MEDIA' });
            fetchData();
        } catch (err) {
            console.error('Error creating maintenance:', err);
        }
    };

    const handleStatus = async (id, status, extraData = {}) => {
        try {
            await api.put(`/mantenimiento/${id}`, { estado: status, ...extraData });
            fetchData();
        } catch (err) {
            console.error('Error updating maintenance:', err);
        }
    };

    const openSolveModal = (task) => {
        setSelectedTask(task);
        setSolveData({ costo: 0, solucion_notas: '' });
        setShowSolveModal(true);
    };

    const handleSolve = async () => {
        if (!selectedTask) return;
        await handleStatus(selectedTask.id, 'SOLUCIONADO', solveData);
        setShowSolveModal(false);
        setSelectedTask(null);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Wrench className="text-primary-600" size={32} />
                        Mantenimiento
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Control de daños y reparaciones técnicas de las habitaciones</p>
                </div>
                
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 active:scale-95"
                >
                    <Plus size={16} />
                    Reportar Daño
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                        <div className="p-8 space-y-6 flex-1">
                            <div className="flex justify-between items-start">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    task.prioridad === 'ALTA' ? 'bg-red-50 text-red-600' : 
                                    task.prioridad === 'MEDIA' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    {task.prioridad}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <Clock size={12} />
                                    {task.fecha_reporte ? format(new Date(task.fecha_reporte), "dd MMM, yyyy", { locale: es }) : '---'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Hab. {task.habitacion_numero}</h3>
                                <p className="text-sm text-gray-500 font-medium italic">"{task.descripcion}"</p>
                            </div>

                            {task.solucion_notas && (
                                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <MessageSquare size={10} /> Notas de solución
                                    </p>
                                    <p className="text-xs text-emerald-900 font-medium italic">{task.solucion_notas}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reportado por</p>
                                    <p className="text-sm font-bold text-gray-700">{task.usuario_nombre || 'Sistema'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Costo</p>
                                    <p className="text-sm font-black text-gray-900">$${new Intl.NumberFormat().format(task.costo || 0)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                            {task.estado === 'PENDIENTE' && (
                                <>
                                    <button 
                                        onClick={() => handleStatus(task.id, 'EN PROCESO')}
                                        className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                    >
                                        En Proceso
                                    </button>
                                    <button 
                                        onClick={() => openSolveModal(task)}
                                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        Solucionar
                                    </button>
                                </>
                            )}
                            {task.estado === 'EN PROCESO' && (
                                <button 
                                    onClick={() => openSolveModal(task)}
                                    className="w-full bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                                >
                                    Terminar y Solucionar
                                </button>
                            )}
                            {task.estado === 'SOLUCIONADO' && (
                                <div className="w-full py-3 text-center text-emerald-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                    <CheckCircle2 size={16} />
                                    Solucionado {task.fecha_solucion ? `el ${format(new Date(task.fecha_solucion), "dd/MM")}` : ''}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Reportar Daño */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 space-y-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Reportar Daño</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Habitación</label>
                                    <select 
                                        required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 ring-primary-500/20"
                                        value={formData.habitacion_id}
                                        onChange={e => setFormData({...formData, habitacion_id: e.target.value})}
                                    >
                                        <option value="">Seleccione habitación...</option>
                                        {habitaciones.map(h => (
                                            <option key={h.id} value={h.id}>Habitación {h.numero} - {h.tipo_nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción del problema</label>
                                    <textarea 
                                        required
                                        placeholder="Ej: Fuga de agua en el baño, bombillo fundido..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 ring-primary-500/20 h-32 resize-none"
                                        value={formData.descripcion}
                                        onChange={e => setFormData({...formData, descripcion: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prioridad</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['BAJA', 'MEDIA', 'ALTA'].map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setFormData({...formData, prioridad: p})}
                                                className={`py-3 rounded-xl text-[10px] font-black tracking-widest border transition-all ${
                                                    formData.prioridad === p 
                                                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all mt-4"
                                >
                                    Enviar Reporte
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Solucionar Daño (NUEVO) */}
            {showSolveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="bg-emerald-600 p-8 text-center space-y-2">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white mx-auto mb-2 backdrop-blur-md">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Cerrar Reporte</h2>
                            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Habitación {selectedTask?.habitacion_numero}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <DollarSign size={12} /> Costo de reparación
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input 
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-8 pr-4 py-4 text-lg font-black outline-none focus:bg-white focus:border-emerald-500 transition-all"
                                        value={solveData.costo}
                                        onChange={e => setSolveData({...solveData, costo: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <ClipboardList size={12} /> Observaciones
                                </label>
                                <textarea 
                                    placeholder="Detalles sobre lo que se reparó..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-emerald-500 transition-all h-24 resize-none"
                                    value={solveData.solucion_notas}
                                    onChange={e => setSolveData({...solveData, solucion_notas: e.target.value})}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setShowSolveModal(false)}
                                    className="flex-1 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSolve}
                                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                                >
                                    Finalizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mantenimiento;
