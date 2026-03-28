import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    Hotel, 
    Calendar, 
    User, 
    Info, 
    CheckCircle, 
    Clock, 
    Trash2, 
    ChevronRight, 
    AlertCircle, 
    RefreshCw, 
    Brush, 
    CheckSquare,
    Loader2,
    DollarSign,
    LogIn,
    LogOut
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import Swal from 'sweetalert2';

const MapaHabitaciones = () => {
    const [habitaciones, setHabitaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [filter, setFilter] = useState('todas');
    const navigate = useNavigate();

    const fetchMapa = async () => {
        if (!updating) setLoading(true);
        try {
            const { data } = await api.get('/habitaciones/mapa-visual');
            setHabitaciones(data);
        } catch (error) {
            console.error('Error fetching visual map:', error);
            // No mostrar alert si es un auto-refresh
            if (loading) Swal.fire('Error', 'No se pudo cargar el mapa de habitaciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMapa();
        const interval = setInterval(fetchMapa, 60000); // 1 min refresh
        return () => clearInterval(interval);
    }, []);

    const toggleLimpieza = async (habId, currentStatus) => {
        setUpdating(habId);
        try {
            const newStatus = currentStatus === 'Sucia' ? 'Limpia' : 'Sucia';
            await api.patch(`/habitaciones/${habId}/limpieza`, {
                estado_limpieza: isClean(currentStatus) ? 'SUCIA' : 'LIMPIA',
                comentario_limpieza: 'Actualizado desde el Mapa Visual'
            });
            await fetchMapa();
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el estado de limpieza', 'error');
        } finally {
            setUpdating(null);
        }
    };

    const isClean = (status) => status && status.toUpperCase() === 'LIMPIA';

    const filteredHabitaciones = habitaciones.filter(h => {
        if (filter === 'todas') return true;
        return h.estadoVisual === filter;
    });

    const getStatusStyles = (estado) => {
        switch (estado) {
            case 'ocupada':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-700',
                    icon: 'text-red-500',
                    badge: 'bg-red-100 text-red-800'
                };
            case 'reservada':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-700',
                    icon: 'text-yellow-600',
                    badge: 'bg-yellow-100 text-yellow-800'
                };
            case 'por_asear':
                return {
                    bg: 'bg-sky-50',
                    border: 'border-sky-200',
                    text: 'text-sky-700',
                    icon: 'text-sky-500',
                    badge: 'bg-sky-100 text-sky-800'
                };
            default: // disponible
                return {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    text: 'text-emerald-700',
                    icon: 'text-emerald-500',
                    badge: 'bg-emerald-100 text-emerald-800'
                };
        }
    };

    const handleRoomClick = (hab) => {
        if (hab.estadoVisual === 'ocupada') {
            navigate(`/registros?habitacion=${hab.numero}`);
        } else if (hab.estadoVisual === 'disponible') {
            navigate(`/registros?nueva=true&habitacionId=${hab.id}`);
        } else {
            // Bloqueo de seguridad solicitado por el usuario
            let mensaje = '';
            if (hab.estadoVisual === 'reservada') mensaje = 'Esta habitación ya tiene una reserva activa para hoy. No puede alquilarse de forma directa.';
            if (hab.estadoVisual === 'por_asear') mensaje = 'La habitación debe estar Limpia antes de poder registrar un nuevo ingreso.';
            
            Swal.fire({
                title: 'Habitación no disponible',
                text: mensaje,
                icon: 'warning',
                confirmButtonColor: '#10b981',
                confirmButtonText: 'Entendido'
            });
        }
    };

    if (loading && habitaciones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <RefreshCw className="animate-spin text-primary-500" size={48} />
                <p className="text-gray-500 font-medium tracking-wide">Cargando mapa visual...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Estado de Habitaciones</h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium tracking-wide">Panel visual de control operativo</p>
                </div>
                
                <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    <button 
                        onClick={() => setFilter('todas')}
                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${filter === 'todas' ? 'bg-gray-950 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Todas
                    </button>
                    <button 
                        onClick={() => setFilter('disponible')}
                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${filter === 'disponible' ? 'bg-emerald-500 text-white shadow-lg' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    >
                        Disponibles
                    </button>
                    <button 
                        onClick={() => setFilter('ocupada')}
                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${filter === 'ocupada' ? 'bg-red-500 text-white shadow-lg' : 'text-red-600 hover:bg-red-50'}`}
                    >
                        Ocupadas
                    </button>
                    <button 
                        onClick={() => setFilter('reservada')}
                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${filter === 'reservada' ? 'bg-yellow-500 text-white shadow-lg' : 'text-yellow-600 hover:bg-yellow-50'}`}
                    >
                        Reservadas
                    </button>
                    <button 
                        onClick={() => setFilter('por_asear')}
                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${filter === 'por_asear' ? 'bg-sky-500 text-white shadow-lg' : 'text-sky-600 hover:bg-sky-50'}`}
                    >
                        Por Asear
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><CheckCircle size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disponibles</p>
                        <p className="text-2xl font-black text-gray-900">{habitaciones.filter(h => h.estadoVisual === 'disponible').length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="bg-red-100 p-3 rounded-2xl text-red-600"><User size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ocupadas</p>
                        <p className="text-2xl font-black text-gray-900">{habitaciones.filter(h => h.estadoVisual === 'ocupada').length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600"><Calendar size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reservadas</p>
                        <p className="text-2xl font-black text-gray-900">{habitaciones.filter(h => h.estadoVisual === 'reservada').length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="bg-sky-100 p-3 rounded-2xl text-sky-600"><RefreshCw size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Por Asear</p>
                        <p className="text-2xl font-black text-gray-900">{habitaciones.filter(h => h.estadoVisual === 'por_asear').length}</p>
                    </div>
                </div>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
                {filteredHabitaciones.map((hab) => {
                    const styles = getStatusStyles(hab.estadoVisual);
                    const isRoomDirty = hab.estadoLimpieza && hab.estadoLimpieza.toUpperCase() === 'SUCIA';
                    
                    return (
                        <div 
                            key={hab.id}
                            className={`group relative transition-all duration-300 transform hover:-translate-y-1`}
                        >
                            <div className={`h-full bg-white rounded-2xl shadow-sm border-2 ${styles.border} overflow-hidden flex flex-col`}>
                                {/* Card Header / Icon area */}
                                <div className={`p-2 ${styles.bg} flex flex-col items-center justify-center space-y-1 relative`}>
                                    {/* Botón de cambio de estado de limpieza rápido */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLimpieza(hab.id, hab.estadoLimpieza);
                                        }}
                                        disabled={updating === hab.id}
                                        className={`absolute top-1 right-1 p-1 rounded-md transition-all shadow-sm border ${
                                            isRoomDirty 
                                            ? 'bg-orange-500 border-orange-400 text-white hover:bg-orange-600' 
                                            : 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600'
                                        }`}
                                        title={isRoomDirty ? 'Marcar como Limpia' : 'Marcar como Sucia'}
                                    >
                                        {updating === hab.id ? <Loader2 size={10} className="animate-spin" /> : (isRoomDirty ? <RefreshCw size={10} /> : <Brush size={10} />)}
                                    </button>

                                    <div className={`p-1.5 rounded-lg bg-white shadow-sm ${styles.icon} transition-transform group-hover:scale-110 duration-500`}>
                                        <Hotel size={20} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-sm font-black text-gray-950 tracking-tighter text-center leading-none">Hab {hab.numero}</h2>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.05em] ${styles.badge}`}>
                                        {hab.estadoVisual.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Card Body */}
                                <div className="p-2 flex-1 flex flex-col space-y-2">
                                    <div className="flex justify-between items-center text-[9px]">
                                        <span className="text-gray-400 font-black uppercase tracking-widest text-[7px]">Tipo</span>
                                        <span className="font-black text-gray-800 tracking-tight truncate ml-1">{hab.tipo}</span>
                                    </div>
                                    
                                    {hab.detalleEstado && (
                                        typeof hab.detalleEstado === 'string' ? (
                                            <div className="flex items-start space-x-1 p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                                                <Info size={10} className={styles.icon + " mt-0.5 shrink-0"} />
                                                <p className="text-[8px] font-black text-gray-600 leading-tight tracking-tight uppercase">{hab.detalleEstado}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 p-2 rounded-xl bg-red-50/50 border border-red-100">
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-red-700 uppercase tracking-tight truncate">
                                                    <User size={10} /> {hab.detalleEstado.huesped}
                                                </div>
                                                <div className="grid grid-cols-2 gap-1 text-[8px] font-bold text-gray-500">
                                                    <div className="flex items-center gap-1"><LogIn size={8} /> {new Date(hab.detalleEstado.entrada).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</div>
                                                    <div className="flex items-center gap-1"><LogOut size={8} /> {new Date(hab.detalleEstado.salida).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</div>
                                                </div>
                                                <div className="pt-1 border-t border-red-100 flex justify-between items-center text-[9px] font-black text-red-800">
                                                    <div className="flex items-center gap-1"><DollarSign size={8} /> TOTAL:</div>
                                                    <div>{formatCurrency(hab.detalleEstado.total)}</div>
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {/* Future Reservations Section */}
                                    <div className="mt-0.5 pt-1 border-t border-gray-100/60">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.05em] flex items-center gap-1">
                                                <Calendar size={10} /> Próximas
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-0.5">
                                            {hab.reservasFuturas.length > 0 ? (
                                                hab.reservasFuturas.slice(0, 3).map((res) => (
                                                    <div key={res.id} className="text-[8px] flex justify-between items-center bg-gray-50/70 p-1 rounded-md border border-transparent hover:border-gray-200 transition-colors">
                                                        <div className="truncate font-black text-gray-800 uppercase tracking-tight max-w-[50px]" title={res.cliente}>
                                                            {res.cliente}
                                                        </div>
                                                        <div className="flex items-center gap-0.5 font-black text-primary-600 bg-primary-50 px-1 py-0.5 rounded-sm">
                                                            {new Date(res.entrada).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-[7px] text-gray-400 font-bold italic text-center py-0.5 bg-gray-50/30 rounded-md border border-dashed border-gray-100">
                                                    Sin reservas
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <button 
                                    onClick={() => handleRoomClick(hab)}
                                    className={`w-full p-2 text-center border-t border-gray-100 transition-all duration-300 group-hover:bg-gray-950`}
                                >
                                    <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${styles.text} group-hover:text-white flex items-center justify-center gap-1`}>
                                        {hab.estadoVisual === 'ocupada' ? 'VER' : 'ALQUILAR'}
                                        <ChevronRight size={12} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredHabitaciones.length === 0 && (
                <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
                    <AlertCircle size={64} className="mx-auto text-gray-200 mb-6" />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-sm">No se encontraron habitaciones</p>
                </div>
            )}
        </div>
    );
};

export default MapaHabitaciones;
