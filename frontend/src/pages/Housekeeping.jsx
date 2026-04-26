import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Brush, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    MessageSquare, 
    Save, 
    Loader2,
    RefreshCw,
    Search
} from 'lucide-react';

const Housekeeping = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const { data } = await api.get('/habitaciones');
            setRooms(data);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const updateStatus = async (roomId, newStatus, currentComment) => {
        setUpdating(roomId);
        try {
            // Optimistic update locally
            setRooms(prev => prev.map(r => 
                r.id === roomId ? { ...r, estado_limpieza: newStatus, comentario_limpieza: currentComment } : r
            ));

            await api.patch(`/habitaciones/${roomId}/limpieza`, {
                estado_limpieza: newStatus,
                comentario_limpieza: currentComment
            });
            
            // Re-fetch silently to ensure sync without flash
            await fetchRooms(true);
        } catch (err) {
            console.error('Error updating status:', err);
            // Re-fetch to revert to actual state on error
            await fetchRooms();
        } finally {
            setUpdating(null);
        }
    };

    const handleCommentChange = (roomId, newComment) => {
        setRooms(rooms.map(r => r.id === roomId ? { ...r, comentario_limpieza: newComment } : r));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'LIMPIA': return 'bg-green-100 text-green-700 border-green-200';
            case 'SUCIA': return 'bg-red-100 text-red-700 border-red-200';
            case 'EN LIMPIEZA': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredRooms = rooms.filter(r => 
        r.numero.toString().includes(searchTerm) || 
        r.tipo_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <Brush className="text-primary-600" size={32} />
                        Gestión de Aseo
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Control de limpieza y preparación de habitaciones</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar habitación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-primary-500 outline-none transition-all w-full md:w-64"
                        />
                    </div>
                    <button 
                        onClick={fetchRooms}
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        title="Refrescar"
                    >
                        <RefreshCw size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRooms.map(room => {
                    // Defensa contra valores que no sean string (ej: arrays por selección duplicada en SQL)
                    const rawStatus = room.estado_limpieza;
                    const statusStr = Array.isArray(rawStatus) ? rawStatus[0] : (typeof rawStatus === 'string' ? rawStatus : 'SUCIA');
                    const status = (statusStr || 'SUCIA').trim();
                    const isClean = status === 'LIMPIA';
                    const isDirty = status === 'SUCIA';
                    const isCleaning = status === 'EN LIMPIEZA';

                    return (
                        <div key={room.id} className="relative rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
                            {/* Cuerpo del cuadro - Color sólido segun estado */}
                            <div className={`p-8 space-y-6 flex-1 transition-colors duration-500 ${
                                isClean ? 'bg-emerald-600 text-white' :
                                isDirty ? 'bg-rose-600 text-white' :
                                isCleaning ? 'bg-orange-500 text-white' :
                                'bg-white text-gray-900'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                            (isClean || isDirty || isCleaning) ? 'text-white/70' : 'text-gray-400'
                                        }`}>
                                            {room.tipo_nombre}
                                        </span>
                                        <h3 className="text-3xl font-black tracking-tighter leading-none">
                                            Hab. {room.numero}
                                        </h3>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${
                                        (isClean || isDirty || isCleaning) 
                                        ? 'bg-white/20 border-white/30 text-white' 
                                        : 'bg-gray-100 border-gray-200 text-gray-500'
                                    }`}>
                                        {status}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                            (isClean || isDirty || isCleaning) ? 'text-white/60' : 'text-gray-400'
                                        }`}>
                                            <MessageSquare size={13} /> COMENTARIOS
                                        </label>
                                        <textarea 
                                            rows="3"
                                            value={room.comentario_limpieza || ''}
                                            onChange={(e) => handleCommentChange(room.id, e.target.value)}
                                            placeholder="..."
                                            className={`w-full rounded-2xl p-4 text-xs font-bold outline-none transition-all resize-none border shadow-inner ${
                                                (isClean || isDirty || isCleaning) 
                                                ? 'bg-black/10 border-white/10 text-white placeholder:text-white/30 focus:bg-black/20' 
                                                : 'bg-gray-50 border-gray-100 text-gray-700'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botones - Pie del cuadro siempre blanco */}
                            <div className="p-4 bg-white grid grid-cols-3 gap-3 border-t border-gray-100">
                                <button 
                                    onClick={() => updateStatus(room.id, 'LIMPIA', room.comentario_limpieza)}
                                    disabled={updating === room.id || isClean}
                                    className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all border ${
                                        isClean 
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                                        : 'bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                >
                                    <CheckCircle2 size={18} />
                                    <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">Limpia</span>
                                </button>
                                <button 
                                    onClick={() => updateStatus(room.id, 'EN LIMPIEZA', room.comentario_limpieza)}
                                    disabled={updating === room.id || isCleaning}
                                    className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all border ${
                                        isCleaning 
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md' 
                                        : 'bg-white border-orange-100 text-orange-600 hover:bg-orange-50'
                                    }`}
                                >
                                    <Clock size={18} />
                                    <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">Aseo</span>
                                </button>
                                <button 
                                    onClick={() => updateStatus(room.id, 'SUCIA', room.comentario_limpieza)}
                                    disabled={updating === room.id || isDirty}
                                    className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all border ${
                                        isDirty 
                                        ? 'bg-rose-600 border-rose-600 text-white shadow-md' 
                                        : 'bg-white border-rose-100 text-rose-600 hover:bg-rose-50'
                                    }`}
                                >
                                    <Brush size={18} />
                                    <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">Sucia</span>
                                </button>
                            </div>
                            
                            {updating === room.id && (
                                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-20">
                                    <Loader2 className="animate-spin text-white" size={32} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredRooms.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100">
                    <Brush size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500 font-medium">No se encontraron habitaciones</p>
                </div>
            )}
        </div>
    );
};

export default Housekeeping;
