import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    Hotel, 
    Calendar, 
    User, 
    Info, 
    CheckCircle, 
    Clock, 
    RefreshCw, 
    LogOut,
    LogIn,
    DollarSign,
    Edit3,
    ClipboardList,
    Loader2,
    Paintbrush,
    CalendarPlus,
    Building2,
    Search,
    Filter
} from 'lucide-react';
import moment from 'moment';
import RegistroModal from '../components/modals/RegistroModal';
import DetallesRegistroModal from '../components/modals/DetallesRegistroModal';
import { formatCurrency } from '../utils/format';
import Swal from 'sweetalert2';

const MapaHabitacionesConsolidado = () => {
    const [habitaciones, setHabitaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [filter, setFilter] = useState('todas');
    const [hotelFilter, setHotelFilter] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showRegistroModal, setShowRegistroModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedHabitacionId, setSelectedHabitacionId] = useState(null);
    const [selectedRegistroId, setSelectedRegistroId] = useState(null);
    const [initialEditMode, setInitialEditMode] = useState(false);
    
    const navigate = useNavigate();

    const fetchMapa = async () => {
        if (!updating) setLoading(true);
        try {
            const { data } = await api.get('/reportes/mapa-habitaciones-consolidado');
            if (Array.isArray(data)) {
                setHabitaciones(data);
            } else {
                setHabitaciones([]);
            }
        } catch (error) {
            console.error('Error fetching consolidated map:', error);
            setHabitaciones([]);
            if (loading) Swal.fire('Error', 'No se pudo cargar el mapa consolidado.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMapa();
        const interval = setInterval(fetchMapa, 60000);
        return () => clearInterval(interval);
    }, []);

    const filteredHabitaciones = useMemo(() => {
        return habitaciones.filter(h => {
            const matchesStatus = filter === 'todas' || h.estado.toLowerCase() === filter.toLowerCase() || (filter === 'por_asear' && h.estadoLimpieza === 'SUCIA');
            const matchesHotel = hotelFilter === 'todos' || h.hotel === hotelFilter;
            const matchesSearch = h.numero.toString().includes(searchTerm) || 
                                 h.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 (h.registroActual?.huesped || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesStatus && matchesHotel && matchesSearch;
        });
    }, [habitaciones, filter, hotelFilter, searchTerm]);

    const getStatusStyles = (estado, limpieza) => {
        if (limpieza === 'SUCIA') {
            return {
                bg: 'bg-sky-50',
                border: 'border-sky-200',
                text: 'text-sky-700',
                icon: 'text-sky-500',
                badge: 'bg-sky-100 text-sky-800',
                label: 'Por Asear'
            };
        }

        switch (estado.toLowerCase()) {
            case 'ocupada':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-700',
                    icon: 'text-red-500',
                    badge: 'bg-red-100 text-red-800',
                    label: 'Ocupada'
                };
            case 'reservada':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-700',
                    icon: 'text-yellow-600',
                    badge: 'bg-yellow-100 text-yellow-800',
                    label: 'Reservada'
                };
            default: // disponible
                return {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    text: 'text-emerald-700',
                    icon: 'text-emerald-500',
                    badge: 'bg-emerald-100 text-emerald-800',
                    label: 'Disponible'
                };
        }
    };

    const handleRoomClick = (hab) => {
        if (hab.hotel !== 'Hotel Plaza') {
            Swal.fire({
                title: 'Cambio de Hotel',
                text: `Esta habitación pertenece al ${hab.hotel}. ¿Desea ir al sistema del ${hab.hotel} para gestionar esta habitación?`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Ir al Colonial',
                cancelButtonText: 'Permanecer aquí'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'https://hotelbalconcolonial.com/mapa-habitaciones';
                }
            });
            return;
        }

        if (hab.estado.toLowerCase() === 'ocupada' && hab.registroActual?.id) {
            setSelectedRegistroId(hab.registroActual.id);
            setInitialEditMode(false);
            setShowDetailsModal(true);
        } else if (hab.estado.toLowerCase() === 'disponible') {
            setSelectedHabitacionId(hab.id);
            setShowRegistroModal(true);
        }
    };

    if (loading && habitaciones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <RefreshCw className="animate-spin text-primary-500" size={48} />
                <p className="text-gray-500 font-medium tracking-wide text-xs uppercase font-black">Cargando mapa consolidado...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-2xl">
                            <Building2 size={28} />
                        </div>
                        Gestión Multi-Hotel
                    </h1>
                    <p className="mt-1 text-xs text-gray-400 font-bold uppercase tracking-widest italic">Estado Global de Habitaciones</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar habitación..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={fetchMapa}
                        className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Hotel Filter */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 overflow-x-auto">
                    <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-1.5">
                        <Filter size={12} /> Hoteles
                    </div>
                    {['todos', 'Hotel Plaza', 'Hotel Colonial'].map(h => (
                        <button
                            key={h}
                            onClick={() => setHotelFilter(h)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                hotelFilter === h ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {h}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 overflow-x-auto">
                    <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-1.5">
                        <Info size={12} /> Estados
                    </div>
                    {['todas', 'disponible', 'ocupada', 'reservada', 'por_asear'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                filter === s ? 'bg-gray-950 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {s.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={20}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disponibles</p>
                        <p className="text-xl font-black text-gray-900">{habitaciones.filter(h => h.estado === 'Disponible').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 border-red-50">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><User size={20}/></div>
                    <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Ocupadas</p>
                        <p className="text-xl font-black text-red-900">{habitaciones.filter(h => h.estado === 'Ocupada').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 border-yellow-50">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl"><Calendar size={20}/></div>
                    <div>
                        <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Reservadas</p>
                        <p className="text-xl font-black text-yellow-700">{habitaciones.filter(h => h.estado === 'Reservada').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 border-sky-50">
                    <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><RefreshCw size={20}/></div>
                    <div>
                        <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Por Asear</p>
                        <p className="text-xl font-black text-sky-700">{habitaciones.filter(h => h.estadoLimpieza === 'SUCIA').length}</p>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="space-y-12">
                {['Hotel Plaza', 'Hotel Colonial'].filter(hotel => hotelFilter === 'todos' || hotel === hotelFilter).map(hotel => (
                    <div key={hotel} className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className={`w-1 h-6 rounded-full ${hotel === 'Hotel Plaza' ? 'bg-indigo-500' : 'bg-slate-500'}`} />
                            <h2 className="text-lg font-black uppercase tracking-tighter text-gray-800">{hotel}</h2>
                            <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {filteredHabitaciones.filter(h => h.hotel === hotel).length} habitaciones
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
                            {filteredHabitaciones.filter(h => h.hotel === hotel).map(hab => {
                                const styles = getStatusStyles(hab.estado, hab.estadoLimpieza);
                                return (
                                    <div 
                                        key={hab.id}
                                        onClick={() => handleRoomClick(hab)}
                                        className={`group relative bg-white rounded-xl shadow-sm border ${styles.border} overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}
                                    >
                                        <div className={`px-2 py-1.5 ${styles.bg} border-b ${styles.border} flex justify-between items-center`}>
                                            <span className="text-[11px] font-black text-gray-900 leading-none">{hab.numero}</span>
                                            <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter ${styles.badge}`}>
                                                {styles.label === 'Por Asear' ? 'ASEO' : styles.label.substring(0, 4)}
                                            </span>
                                        </div>
                                        
                                        <div className="p-1.5 flex-1 flex flex-col justify-between min-h-[50px]">
                                            <div className="text-[7px] font-black text-gray-400 uppercase tracking-tighter truncate">
                                                {hab.tipo}
                                            </div>

                                            {hab.registroActual ? (
                                                <div className="space-y-1">
                                                    <div className="text-[9px] font-black text-slate-700 leading-tight line-clamp-1 break-all">
                                                        {hab.registroActual.huesped}
                                                    </div>
                                                    <div className="flex justify-between text-[7px] font-bold text-slate-400">
                                                        <span>{moment(hab.registroActual.fecha_ingreso).format('DD/MM')}</span>
                                                        <span>→</span>
                                                        <span>{moment(hab.registroActual.fecha_salida).format('DD/MM')}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-0.5">
                                                    {hab.reservasProximas.length > 0 ? (
                                                        hab.reservasProximas.slice(0, 1).map(res => (
                                                            <div key={res.id} className="text-[7px] font-black text-yellow-600 uppercase truncate">
                                                                R: {res.cliente}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-[7px] text-slate-300 italic">Libre</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {filteredHabitaciones.length === 0 && (
                <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100">
                    <Info size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No hay habitaciones que coincidan con los filtros</p>
                </div>
            )}

            {/* Modals compatible only with Hotel Plaza (main system) */}
            {selectedHabitacionId && (
                <RegistroModal 
                    isOpen={showRegistroModal} 
                    onClose={() => {
                        setShowRegistroModal(false);
                        setSelectedHabitacionId(null);
                    }}
                    initialHabitacionId={selectedHabitacionId}
                    onSuccess={fetchMapa}
                />
            )}

            {selectedRegistroId && (
                <DetallesRegistroModal 
                    registroId={selectedRegistroId}
                    isOpen={showDetailsModal}
                    initialEditMode={initialEditMode}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedRegistroId(null);
                        setInitialEditMode(false);
                    }}
                    onSuccess={fetchMapa}
                />
            )}
        </div>
    );
};

export default MapaHabitacionesConsolidado;
