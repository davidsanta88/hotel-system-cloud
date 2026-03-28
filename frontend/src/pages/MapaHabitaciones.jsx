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
    LogOut,
    LogIn,
    DollarSign,
    Edit3,
    ClipboardList,
    Loader2,
    Paintbrush,
    CalendarPlus
} from 'lucide-react';
import moment from 'moment';
import RegistroModal from '../components/modals/RegistroModal';
import DetallesRegistroModal from '../components/modals/DetallesRegistroModal';
import { formatCurrency } from '../utils/format';
import Swal from 'sweetalert2';

const MapaHabitaciones = () => {
    const [habitaciones, setHabitaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [filter, setFilter] = useState('todas');
    const [showRegistroModal, setShowRegistroModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedHabitacionId, setSelectedHabitacionId] = useState(null);
    const [selectedRegistroId, setSelectedRegistroId] = useState(null);
    const [initialEditMode, setInitialEditMode] = useState(false);
    const navigate = useNavigate();

    const fetchMapa = async () => {
        if (!updating) setLoading(true);
        try {
            const { data } = await api.get('/habitaciones/mapa-visual');
            console.log('[CLIENT DEBUG] Datos recibidos:', data);
            if (Array.isArray(data)) {
                setHabitaciones(data);
            } else {
                console.error('[CLIENT ERROR] La API no devolvió un array:', data);
                setHabitaciones([]);
            }
        } catch (error) {
            console.error('Error fetching visual map:', error);
            setHabitaciones([]);
            if (loading) Swal.fire('Error', 'No se pudo cargar el mapa de habitaciones. Recargue la página.', 'error');
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
        const nextStatus = isClean(currentStatus) ? 'SUCIA' : 'LIMPIA';
        
        // Optimistic update
        setHabitaciones(prev => prev.map(h => 
            h.id === habId ? { ...h, estadoLimpieza: nextStatus } : h
        ));

        try {
            await api.patch(`/habitaciones/${habId}/limpieza`, {
                estado_limpieza: nextStatus,
                comentario_limpieza: 'Actualizado desde el Mapa Visual'
            });
            await fetchMapa();
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el estado de limpieza', 'error');
            await fetchMapa(); // Revert on error
        } finally {
            setUpdating(null);
        }
    };

    const isClean = (status) => status && status.toUpperCase() === 'LIMPIA';
    const isDirty = (status) => status && status.toUpperCase() === 'SUCIA';


    const filteredHabitaciones = Array.isArray(habitaciones) ? habitaciones.filter(h => {
        if (!h) return false;
        if (filter === 'todas') return true;
        return h.estadoVisual === filter;
    }) : [];

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
        if (hab.estadoVisual === 'ocupada' && hab.detalleEstado?.id_registro) {
            setSelectedRegistroId(hab.detalleEstado.id_registro);
            setInitialEditMode(false);
            setShowDetailsModal(true);
        } else if (hab.estadoVisual === 'disponible') {
            setSelectedHabitacionId(hab.id);
            setShowRegistroModal(true);
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

    const handleQuickCheckout = async (habId, registroId, saldo = 0) => {
        const tieneSaldo = saldo > 0;
        
        const result = await Swal.fire({
            title: tieneSaldo ? '¡Atención! Saldo Pendiente' : '¿Realizar Check-out?',
            html: tieneSaldo 
                ? `<div class="text-left p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <p class="font-bold text-orange-800 text-sm">Esta habitación aún tiene un saldo de:</p>
                    <p class="text-2xl font-black text-orange-600 my-1">${formatCurrency(saldo)}</p>
                    <p class="text-xs text-gray-500">¿Está seguro de liberar la habitación sin registrar el pago?</p>
                   </div>`
                : "Esta acción liberará la habitación y la marcará para aseo.",
            icon: tieneSaldo ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: tieneSaldo ? '#f59e0b' : '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: tieneSaldo ? 'Sí, salir con saldo' : 'Sí, Salida',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.put(`/registros/checkout/${registroId}`);
                Swal.fire('Éxito', 'Check-out realizado', 'success');
                fetchMapa();
            } catch (error) {
                Swal.fire('Error', 'No se pudo completar el check-out', 'error');
            }
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
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">Estado de Habitaciones</h1>
                        <p className="mt-2 text-sm text-gray-500 font-medium tracking-wide">Panel visual de control operativo</p>
                    </div>
                    <button 
                        onClick={() => navigate('/registros')}
                        className="mt-4 md:mt-0 flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95"
                    >
                        <ClipboardList size={20} />
                        <span>Lista Registro Huespedes</span>
                    </button>
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
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/reservas')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-bold text-sm shadow-sm"
                        >
                            <Calendar size={18} />
                            Lista Reservas
                        </button>
                        <button 
                            onClick={fetchMapa}
                            disabled={loading}
                            className={`p-2 rounded-xl border border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm ${loading ? 'animate-spin' : ''}`}
                            title="Refrescar Mapa"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><CheckCircle size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disponibles</p>
                        <p className="text-2xl font-black text-gray-900">{(habitaciones || []).filter(h => h && h.estadoVisual === 'disponible').length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="bg-red-100 p-3 rounded-2xl text-red-600"><User size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ocupadas</p>
                        <p className="text-2xl font-black text-gray-900">{(habitaciones || []).filter(h => h && h.estadoVisual === 'ocupada').length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600"><Calendar size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reservadas</p>
                        <p className="text-2xl font-black text-gray-900">{(habitaciones || []).filter(h => h && h.estadoVisual === 'reservada').length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="bg-sky-100 p-3 rounded-2xl text-sky-600"><RefreshCw size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Por Asear</p>
                        <p className="text-2xl font-black text-gray-900">{(habitaciones || []).filter(h => h && h.estadoVisual === 'por_asear').length}</p>
                    </div>
                </div>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
                {filteredHabitaciones.map((hab) => {
                    const styles = getStatusStyles(hab.estadoVisual);
                    
                    return (
                        <div 
                            key={hab.id}
                            onClick={() => handleRoomClick(hab)}
                            className={`group relative transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
                        >
                            <div className={`h-full bg-white rounded-2xl shadow-sm border-2 ${styles.border} overflow-hidden flex flex-col`}>
                                {/* Card Header / Icon area */}
                                <div className={`p-2 ${styles.bg} flex flex-col items-center justify-center space-y-1 relative`}>
                                    {/* Botón de cambio de estado de limpieza rápido */}
                                    <div className="absolute top-1 right-1 flex flex-col gap-1">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleLimpieza(hab.id, hab.estadoLimpieza);
                                            }}
                                            disabled={updating === hab.id}
                                            className={`p-1 rounded-md transition-all shadow-sm border ${
                                                isDirty(hab.estadoLimpieza) 
                                                ? 'bg-orange-500 border-orange-400 text-white hover:bg-orange-600' 
                                                : 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600'
                                            }`}
                                            title={isDirty(hab.estadoLimpieza) ? 'Marcar como Limpia' : 'Marcar como Sucia'}
                                        >
                                            {updating === hab.id ? <Loader2 size={10} className="animate-spin" /> : (isDirty(hab.estadoLimpieza) ? <RefreshCw size={10} /> : <Paintbrush size={10} />)}
                                        </button>

                                        {hab.estadoVisual === 'ocupada' && hab.detalleEstado?.id_registro && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickCheckout(hab.id, hab.detalleEstado.id_registro, hab.detalleEstado.saldo);
                                                }}
                                                className="p-1 rounded-md bg-red-600 border border-red-500 text-white hover:bg-red-700 shadow-sm transition-all"
                                                title="Realizar Salida Rápida"
                                            >
                                                <LogOut size={10} />
                                            </button>
                                        )}

                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/reservas', { state: { fromMap: true, selectedHab: hab } });
                                            }}
                                            className="p-1 rounded-md bg-sky-500 border border-sky-400 text-white hover:bg-sky-600 shadow-sm transition-all"
                                            title="Reservar para el Futuro"
                                        >
                                            <CalendarPlus size={10} />
                                        </button>
                                    </div>

                                    <div className={`p-1.5 rounded-lg bg-white shadow-sm ${styles.icon} transition-transform group-hover:scale-110 duration-500`}>
                                        <Hotel size={20} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-base font-black text-gray-950 tracking-tighter text-center leading-none">Hab {hab.numero}</h2>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${styles.badge}`}>
                                        {hab.estadoVisual.replace('_', ' ')}
                                        {isDirty(hab.estadoLimpieza) && hab.estadoVisual === 'ocupada' && (
                                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" title="Requiere aseo"></span>
                                        )}
                                    </span>
                                </div>

                                {/* Card Body */}
                                <div className="p-2 flex-1 flex flex-col space-y-2">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400 font-black uppercase tracking-widest text-[8px]">Tipo</span>
                                        <span className="font-black text-gray-800 tracking-tight truncate ml-1 uppercase">{hab.tipo}</span>
                                    </div>
                                    
                                    {hab.detalleEstado && (
                                        typeof hab.detalleEstado === 'string' ? (
                                            <div className="flex items-start space-x-1 p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                                                <Info size={10} className={styles.icon + " mt-0.5 shrink-0"} />
                                                <p className="text-[8px] font-black text-gray-600 leading-tight tracking-tight uppercase">{hab.detalleEstado}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 p-2 rounded-xl bg-red-50/50 border border-red-100">
                                                <div className="flex items-center justify-between gap-1.5 text-[10px] font-black text-red-700 uppercase tracking-tight border-b border-red-100 pb-1 mb-1">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <User size={12} /> {hab.detalleEstado.huesped}
                                                    </div>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedRegistroId(hab.detalleEstado.id_registro);
                                                            setInitialEditMode(true);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-1 hover:bg-red-200/50 rounded-md transition-colors text-red-800"
                                                        title="Editar Registro / Pagos"
                                                    >
                                                        <Edit3 size={12} />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-bold text-gray-500">
                                                    <div className="flex items-center gap-1"><LogIn size={10} /> {moment.utc(hab.detalleEstado.entrada).format('DD/MM')}</div>
                                                    <div className="flex items-center gap-1"><LogOut size={10} /> {moment.utc(hab.detalleEstado.salida).format('DD/MM')}</div>
                                                    <div className="col-span-2 pt-1 mt-1 border-t border-gray-100 flex justify-between text-[8px] uppercase tracking-tighter">
                                                        <span className={hab.detalleEstado.esEstimado ? 'text-amber-600 italic font-bold' : ''}>
                                                            Aloj. + Consumos {hab.detalleEstado.esEstimado ? '(EST.)' : ''}:
                                                        </span>
                                                        <span className="font-black text-gray-700">${formatCurrency(hab.detalleEstado.totalGeneral || 0)}</span>
                                                    </div>
                                                    <div className="col-span-2 flex justify-between text-[8px] uppercase tracking-tighter">
                                                        <span>Abonado:</span>
                                                        <span className="font-black text-emerald-600">${formatCurrency(hab.detalleEstado.pagado || 0)}</span>
                                                    </div>
                                                </div>
                                                <div className={`mt-1 p-1.5 rounded-lg flex justify-between items-center text-[10px] font-black ${ (hab.detalleEstado.saldo || 0) > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    <div className="flex items-center gap-1"><DollarSign size={10} /> SALDO:</div>
                                                    <div>${formatCurrency(hab.detalleEstado.saldo || 0)}</div>
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
                                            {hab.reservasFuturas && hab.reservasFuturas.length > 0 ? (
                                                hab.reservasFuturas.slice(0, 3).map((res) => (
                                                    <div key={res.id} className="text-[8px] flex justify-between items-center bg-gray-50/70 p-1 rounded-md border border-transparent hover:border-gray-200 transition-colors">
                                                        <div className="truncate font-black text-gray-800 uppercase tracking-tight max-w-[50px]" title={res.cliente}>
                                                            {res.cliente}
                                                        </div>
                                                        <div className="flex items-center gap-0.5 font-black text-primary-600 bg-primary-50 px-1 py-0.5 rounded-sm">
                                                            {moment.utc(res.entrada).format('DD/MM')}
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

            {/* Modal de Registro Integrado */}
            <RegistroModal 
                isOpen={showRegistroModal}
                onClose={() => {
                    setShowRegistroModal(false);
                    setSelectedHabitacionId(null);
                }}
                initialHabitacionId={selectedHabitacionId}
                onSuccess={() => {
                    fetchMapa();
                }}
            />

            <DetallesRegistroModal 
                registroId={selectedRegistroId}
                isOpen={showDetailsModal}
                initialEditMode={initialEditMode}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedRegistroId(null);
                    setInitialEditMode(false);
                }}
                onSuccess={() => {
                    fetchMapa();
                }}
            />
        </div>
    );
};

export default MapaHabitaciones;
