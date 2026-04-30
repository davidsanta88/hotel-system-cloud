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
    Filter,
    Brush
} from 'lucide-react';
import moment from 'moment-timezone';
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

    const toggleLimpieza = async (habId, currentEstado, hotel) => {
        const isPlaza = window.location.hostname.includes('plaza') || window.location.port === '5173';
        const targetHotel = isPlaza ? 'Hotel Plaza' : 'Hotel Colonial';
        
        if (hotel !== targetHotel) {
            Swal.fire({
                title: 'Cambio de Hotel',
                text: `Para gestionar la limpieza del ${hotel}, debe ir a su respectivo sistema.`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: `Ir al ${hotel.split(' ')[1]}`,
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = hotel.includes('Plaza') ? 'https://hotelbalconplaza.com/mapa-habitaciones' : 'https://hotelbalconcolonial.com/mapa-habitaciones';
                }
            });
            return;
        }

        try {
            setUpdating(habId);
            const isDirty = currentEstado === 'SUCIA' || currentEstado === 'PENDIENTE POR ASEAR';
            const nuevoEstado = isDirty ? 'LIMPIA' : 'SUCIA';
            
            await api.patch(`/habitaciones/${habId}/limpieza`, { 
                estado_limpieza: nuevoEstado,
                comentario_limpieza: 'Actualizado desde el Mapa Consolidado'
            });
            await fetchMapa();
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el estado de limpieza', 'error');
        } finally {
            setUpdating(null);
        }
    };

    const handleQuickCheckout = async (habId, registroId, saldo, hotel) => {
        const isPlaza = window.location.hostname.includes('plaza') || window.location.port === '5173';
        const targetHotel = isPlaza ? 'Hotel Plaza' : 'Hotel Colonial';
        
        if (hotel !== targetHotel) {
            Swal.fire({
                title: 'Cambio de Hotel',
                text: `Para realizar el check-out en el ${hotel}, debe ir a su respectivo sistema.`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: `Ir al ${hotel.split(' ')[1]}`,
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = hotel.includes('Plaza') ? 'https://hotelbalconplaza.com/mapa-habitaciones' : 'https://hotelbalconcolonial.com/mapa-habitaciones';
                }
            });
            return;
        }

        const tieneSaldo = (saldo || 0) > 0;
        
        const result = await Swal.fire({
            title: '¿Confirmar Check-out?',
            html: `
                <div class="text-left space-y-4">
                    <p class="text-lg text-gray-700 font-bold">Esta acción liberará la habitación y la marcará para aseo.</p>
                    <p class="bg-amber-50 text-amber-700 p-2 rounded-lg border border-amber-200 text-[11px] font-black uppercase text-center mt-2 animate-pulse">Favor reclamar las llaves y validar que la habitacion quede todo OK</p>
                    ${tieneSaldo ? `
                        <div class="bg-red-50 border-2 border-red-500 p-6 rounded-2xl text-red-700 shadow-lg animate-pulse">
                            <div class="flex items-center gap-3 mb-2 justify-center">
                                <span class="bg-red-500 text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>
                                <strong class="text-2xl font-black uppercase tracking-tighter">¡SALDO PENDIENTE!</strong>
                            </div>
                            <p class="text-4xl font-black text-center mb-1">$${formatCurrency(saldo)}</p>
                            <p class="text-sm font-bold text-center opacity-90 uppercase tracking-widest">DEBE COBRAR ANTES DE LIBERAR LA HABITACIÓN</p>
                        </div>
                    ` : ''}
                    <div class="mt-2">
                        <label class="block text-sm font-black text-gray-400 uppercase mb-1 tracking-wider">Notas de salida (Opcional):</label>
                    </div>
                </div>
            `,
            input: 'textarea',
            inputPlaceholder: 'Escriba observaciones aquí...',
            icon: (saldo || 0) > 0 ? 'warning' : 'question',
            width: 'min(95%, 450px)',
            showCancelButton: true,
            confirmButtonColor: (saldo || 0) > 0 ? '#ef4444' : '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: (saldo || 0) > 0 ? 'Sí, salir con saldo' : 'Sí, finalizar estancia',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'rounded-3xl shadow-2xl border border-gray-100',
                title: 'text-2xl font-black text-gray-800',
                htmlContainer: 'text-base font-medium',
                confirmButton: 'rounded-xl font-black uppercase tracking-widest text-sm px-8 py-4 transition-transform active:scale-95',
                cancelButton: 'rounded-xl font-black uppercase tracking-widest text-sm px-8 py-4 transition-transform active:scale-95'
            }
        });

        if (result.isConfirmed) {
            try {
                const notasCapturadas = result.value || '';
                Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                await api.put(`/registros/checkout/${registroId}`, { notasSalida: notasCapturadas });
                Swal.fire('Éxito', 'Check-out realizado', 'success');
                fetchMapa();
            } catch (error) {
                Swal.fire('Error', 'No se pudo completar el check-out', 'error');
            }
        }
    };

    useEffect(() => {
        fetchMapa();
        const interval = setInterval(fetchMapa, 60000);
        return () => clearInterval(interval);
    }, []);

    const filteredHabitaciones = useMemo(() => {
        return habitaciones.filter(h => {
            const matchesStatus = filter === 'todas' || 
                                 (filter === 'entregan_hoy' && h.registroActual?.salida && moment().tz('America/Bogota').isSame(moment(h.registroActual.salida).tz('America/Bogota'), 'day')) ||
                                 h.estado.toLowerCase() === filter.toLowerCase() || 
                                 (filter === 'por_asear' && h.estadoLimpieza === 'SUCIA');
            const matchesHotel = hotelFilter === 'todos' || h.hotel === hotelFilter;
            const matchesSearch = h.numero.toString().includes(searchTerm) || 
                                 h.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 (h.registroActual?.huesped || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesStatus && matchesHotel && matchesSearch;
        }).sort((a, b) => {
            const numA = parseInt(a.numero.toString().replace(/\D/g, '')) || 0;
            const numB = parseInt(b.numero.toString().replace(/\D/g, '')) || 0;
            return numA - numB;
        });
    }, [habitaciones, filter, hotelFilter, searchTerm]);

    const stats = useMemo(() => {
        const total = habitaciones.length;
        const ocupadas = habitaciones.filter(h => h.estado.toLowerCase() === 'ocupada').length;
        const ocupacionTotal = total > 0 ? ((ocupadas / total) * 100).toFixed(1) : 0;
        
        const plaza = habitaciones.filter(h => h.hotel === 'Hotel Plaza');
        const colonial = habitaciones.filter(h => h.hotel === 'Hotel Colonial');
        
        const plazaOcupadas = plaza.filter(h => h.estado.toLowerCase() === 'ocupada').length;
        const colonialOcupadas = colonial.filter(h => h.estado.toLowerCase() === 'ocupada').length;
        
        const plazaPerc = plaza.length > 0 ? (plazaOcupadas / plaza.length) * 100 : 0;
        const colonialPerc = colonial.length > 0 ? (colonialOcupadas / colonial.length) * 100 : 0;

        // Ingresos proyectados hoy (por salidas)
        const ingresosHoy = habitaciones.reduce((acc, h) => {
            if (h.registroActual?.salida && moment().tz('America/Bogota').isSame(moment(h.registroActual.salida).tz('America/Bogota'), 'day')) {
                return acc + (h.registroActual.total || 0);
            }
            return acc;
        }, 0);

        // Disponibilidad por tipo
        const disponibilidadPorTipo = {};
        habitaciones.forEach(h => {
            if (h.estado.toLowerCase() === 'disponible' && h.estadoLimpieza !== 'SUCIA') {
                disponibilidadPorTipo[h.tipo] = (disponibilidadPorTipo[h.tipo] || 0) + 1;
            }
        });

        return {
            total, ocupadas, ocupacionTotal,
            plazaPerc, colonialPerc,
            ingresosHoy,
            disponibilidadPorTipo,
            entreganHoy: habitaciones.filter(h => h.registroActual?.salida && moment().tz('America/Bogota').isSame(moment(h.registroActual.salida).tz('America/Bogota'), 'day')).length
        };
    }, [habitaciones]);

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
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Actualizar
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
                    {['todas', 'disponible', 'ocupada', 'reservada', 'por_asear', 'entregan_hoy'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                filter === s ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {s === 'entregan_hoy' ? 'Entregan Hoy' : s.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Management Dashboard Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Global Occupancy & Comparative */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4">Ocupación Grupal</p>
                        <div className="flex items-end gap-2 mb-6">
                            <span className="text-5xl font-black text-indigo-600 leading-none">{stats.ocupacionTotal}%</span>
                            <span className="text-xs font-bold text-gray-400 mb-1 uppercase">Capacidad Total</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase">
                                <span className="text-gray-600">Hotel Plaza</span>
                                <span className="text-indigo-600">{stats.plazaPerc.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${stats.plazaPerc}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase">
                                <span className="text-gray-600">Hotel Colonial</span>
                                <span className="text-slate-600">{stats.colonialPerc.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-500 rounded-full transition-all duration-1000" style={{ width: `${stats.colonialPerc}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projected Revenue & Turnovers */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4">Proyección y Operación Hoy</p>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingresos por Salidas</p>
                                    <p className="text-2xl font-black text-gray-900">${formatCurrency(stats.ingresosHoy)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                                    <LogOut size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-outs Programados</p>
                                    <p className="text-2xl font-black text-orange-600">{stats.entreganHoy} <span className="text-xs text-gray-400">HABITACIONES</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setFilter('entregan_hoy')}
                        className="w-full py-3 mt-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        Ver Salidas del Día
                    </button>
                </div>

                {/* Availability Summary */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4">Disponibilidad por Tipo</p>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(stats.disponibilidadPorTipo).length > 0 ? (
                            Object.entries(stats.disponibilidadPorTipo).map(([tipo, count]) => (
                                <div key={tipo} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                    <span className="text-[10px] font-black text-slate-700 uppercase">{tipo}</span>
                                    <span className="px-3 py-1 bg-white text-emerald-600 rounded-xl text-xs font-black shadow-sm border border-emerald-100">
                                        {count} LIBRES
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-[10px] font-black text-slate-300 uppercase italic">Sin disponibilidad inmediata</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={20}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disponibles Total</p>
                        <p className="text-xl font-black text-gray-900">{habitaciones.filter(h => h.estado.toLowerCase() === 'disponible' && h.estadoLimpieza !== 'SUCIA').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 border-red-50">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><User size={20}/></div>
                    <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Ocupadas Total</p>
                        <p className="text-xl font-black text-red-900">{stats.ocupadas}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 border-yellow-50">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl"><Calendar size={20}/></div>
                    <div>
                        <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Reservadas Total</p>
                        <p className="text-xl font-black text-yellow-700">{habitaciones.filter(h => h.estado.toLowerCase() === 'reservada').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 border-sky-50">
                    <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><Brush size={20}/></div>
                    <div>
                        <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Por Asear Total</p>
                        <p className="text-xl font-black text-sky-700">{habitaciones.filter(h => h.estadoLimpieza === 'SUCIA').length}</p>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="space-y-4">
                {['Hotel Plaza', 'Hotel Colonial'].filter(hotel => hotelFilter === 'todos' || hotel === hotelFilter).map(hotel => {
                    const hotelHabs = filteredHabitaciones
                        .filter(h => h.hotel === hotel)
                        .sort((a, b) => {
                            const numA = parseInt(a.numero.toString().replace(/\D/g, '')) || 0;
                            const numB = parseInt(b.numero.toString().replace(/\D/g, '')) || 0;
                            return numA - numB;
                        });
                    if (hotelHabs.length === 0) return null;
                    
                    return (
                        <div key={hotel} className="bg-white/50 backdrop-blur-sm rounded-3xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-6 rounded-full ${hotel === 'Hotel Plaza' ? 'bg-indigo-500' : 'bg-slate-500'}`} />
                                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">{hotel}</h2>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                                        {hotelHabs.length} {filter === 'todas' ? 'HABITACIONES' : filter.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2">
                                {hotelHabs.map(hab => {
                                    const styles = getStatusStyles(hab.estado, hab.estadoLimpieza);
                                    
                                    return (
                                        <div 
                                            key={hab.id}
                                            onClick={() => handleRoomClick(hab)}
                                            className={`group relative rounded-xl border ${styles.bg} ${styles.border} p-1.5 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col min-h-[100px]`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-900 leading-none">{hab.numero}</span>
                                                    <span className={`mt-1 text-[7px] font-black px-1.5 py-0.5 rounded-md ${styles.text} bg-white/80 border ${styles.border} shadow-sm uppercase tracking-tighter w-fit`}>
                                                        {styles.label === 'Por Asear' ? 'ASEO' : styles.label.substring(0, 4)}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col justify-end space-y-0.5">
                                                <p className="text-[8px] font-bold text-gray-500 truncate leading-none mb-1 uppercase opacity-60">{hab.tipo}</p>
                                                
                                                {hab.registroActual ? (
                                                    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className={`text-[9px] font-black ${styles.text} leading-tight truncate uppercase`}>
                                                                {hab.registroActual.huesped}
                                                            </p>
                                                            {hab.registroActual?.salida && moment().tz('America/Bogota').isSame(moment(hab.registroActual.salida).tz('America/Bogota'), 'day') && (
                                                                <Clock size={10} className="text-orange-500 animate-pulse shrink-0" />
                                                            )}
                                                        </div>
                                                        <div className={`mt-1 pt-1 border-t border-black/5 flex justify-between items-center text-[8px] font-black ${ (hab.registroActual.saldo || 0) > 100000 ? 'text-red-600 animate-pulse' : '' }`}>
                                                            <span>${new Intl.NumberFormat().format(hab.registroActual?.total || 0)}</span>
                                                            {(hab.registroActual.saldo || 0) > 0 && (
                                                                <span className="bg-red-50 px-1 rounded text-[7px]">S: ${new Intl.NumberFormat().format(hab.registroActual.saldo)}</span>
                                                            )}
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
                                                            <div className="text-[8px] text-slate-300 italic font-medium uppercase tracking-tighter">Libre</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
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
