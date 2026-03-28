import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Hotel, Calendar, User, Info, CheckCircle, Clock, Trash2, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import Swal from 'sweetalert2';

const MapaHabitaciones = () => {
    const [habitaciones, setHabitaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('todas');
    const navigate = useNavigate();

    const fetchMapa = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/habitaciones/mapa-visual');
            setHabitaciones(data);
        } catch (error) {
            console.error('Error fetching visual map:', error);
            Swal.fire('Error', 'No se pudo cargar el mapa de habitaciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMapa();
        // Opcional: Auto-refresh cada 2 minutos
        const interval = setInterval(fetchMapa, 120000);
        return () => clearInterval(interval);
    }, []);

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
            // Ir a ver los registros activos (podemos filtrar por habitacion en la pantalla de registros)
            navigate(`/registros?habitacion=${hab.numero}`);
        } else {
            // Ir a crear nuevo registro
            navigate(`/registros?nueva=true&habitacionId=${hab.id}`);
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
        <div className="space-y-8 pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Estado de Habitaciones</h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium">Vista visual en tiempo real para recepción</p>
                </div>
                
                <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
                    <button 
                        onClick={() => setFilter('todas')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'todas' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Todas
                    </button>
                    <button 
                        onClick={() => setFilter('disponible')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'disponible' ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    >
                        Disponibles
                    </button>
                    <button 
                        onClick={() => setFilter('ocupada')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'ocupada' ? 'bg-red-500 text-white shadow-md' : 'text-red-600 hover:bg-red-50'}`}
                    >
                        Ocupadas
                    </button>
                    <button 
                        onClick={() => setFilter('reservada')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'reservada' ? 'bg-yellow-500 text-white shadow-md' : 'text-yellow-600 hover:bg-yellow-50'}`}
                    >
                        Reservadas
                    </button>
                    <button 
                        onClick={() => setFilter('por_asear')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'por_asear' ? 'bg-sky-500 text-white shadow-md' : 'text-sky-600 hover:bg-sky-50'}`}
                    >
                        Por Asear
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><CheckCircle size={20}/></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disponibles</p>
                        <p className="text-xl font-black text-gray-900">{habitaciones.filter(h => h.estadoVisual === 'disponible').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
                    <div className="bg-red-100 p-2 rounded-lg text-red-600"><User size={20}/></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ocupadas</p>
                        <p className="text-xl font-black text-gray-900">{habitaciones.filter(h => h.estadoVisual === 'ocupada').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
                    <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600"><Calendar size={20}/></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reservadas</p>
                        <p className="text-xl font-black text-gray-900">{habitaciones.filter(h => h.estadoVisual === 'reservada').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
                    <div className="bg-sky-100 p-2 rounded-lg text-sky-600"><RefreshCw size={20}/></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Por Asear</p>
                        <p className="text-xl font-black text-gray-900">{habitaciones.filter(h => h.estadoVisual === 'por_asear').length}</p>
                    </div>
                </div>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6">
                {filteredHabitaciones.map((hab) => {
                    const styles = getStatusStyles(hab.estadoVisual);
                    return (
                        <div 
                            key={hab.id}
                            onClick={() => handleRoomClick(hab)}
                            className={`group cursor-pointer relative transition-all duration-300 transform hover:-translate-y-1`}
                        >
                            <div className={`h-full bg-white rounded-2xl shadow-sm border-2 ${styles.border} overflow-hidden flex flex-col`}>
                                {/* Card Header / Icon area */}
                                <div className={`p-6 ${styles.bg} flex flex-col items-center justify-center space-y-3 relative overflow-hidden`}>
                                    <div className={`p-4 rounded-full bg-white shadow-sm ${styles.icon} transition-transform group-hover:scale-110 duration-300`}>
                                        <Hotel size={40} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900">Hab {hab.numero}</h2>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles.badge}`}>
                                        {hab.estadoVisual.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 flex-1 flex flex-col space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-bold uppercase text-[10px]">Tipo</span>
                                        <span className="font-bold text-gray-700">{hab.tipo}</span>
                                    </div>
                                    
                                    {hab.detalleEstado && (
                                        <div className="flex items-start space-x-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                                            <Info size={14} className={styles.icon + " mt-0.5 shrink-0"} />
                                            <p className="text-[11px] font-bold text-gray-600 leading-tight">{hab.detalleEstado}</p>
                                        </div>
                                    )}

                                    {/* Future Reservations Section */}
                                    <div className="mt-2 pt-3 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                <Calendar size={12} /> Próximas Reservas
                                            </span>
                                            {hab.reservasFuturas.length > 0 && (
                                                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                    {hab.reservasFuturas.length}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            {hab.reservasFuturas.length > 0 ? (
                                                hab.reservasFuturas.map((res, idx) => (
                                                    <div key={res.id} className="text-[10px] flex justify-between items-center bg-gray-50/50 p-1.5 rounded border border-transparent hover:border-gray-200 transition-colors">
                                                        <div className="truncate font-bold text-gray-800" title={res.cliente}>
                                                            {res.cliente}
                                                        </div>
                                                        <div className="text-gray-500 shrink-0 ml-2">
                                                            {new Date(res.entrada).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-gray-400 italic text-center py-1">Sin reservas próximas</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className={`p-3 text-center border-t border-gray-100 group-hover:${styles.bg} transition-colors duration-300`}>
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${styles.text} flex items-center justify-center gap-1`}>
                                        {hab.estadoVisual === 'ocupada' ? 'Ver Detalles' : 'Nuevo Registro'}
                                        <ChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredHabitaciones.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                    <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-bold">No se encontraron habitaciones con este filtro.</p>
                </div>
            )}
        </div>
    );
};

export default MapaHabitaciones;
