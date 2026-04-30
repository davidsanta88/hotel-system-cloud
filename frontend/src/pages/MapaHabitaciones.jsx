import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    CalendarPlus,
    Brush
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
    const [selectedReserva, setSelectedReserva] = useState(null);
    const navigate = useNavigate();

    const location = useLocation();

    const fetchMapa = async () => {
        if (!updating) setLoading(true);
        try {
            const { data } = await api.get('/habitaciones/mapa-visual');
            console.log('[CLIENT DEBUG] Datos recibidos:', data);
            if (Array.isArray(data)) {
                // Asegurar el orden numérico / natural en el frontend mas robusto
                const sortedData = [...data].sort((a, b) => {
                    const nA = String(a.numero).match(/\d+/) || [0];
                    const nB = String(b.numero).match(/\d+/) || [0];
                    return parseInt(nA[0]) - parseInt(nB[0]);
                });
                setHabitaciones(sortedData);
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

    // Manejar redirección desde Alertas/Anomalías
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const searchId = queryParams.get('search');
        if (searchId) {
            console.log('[DEBUG] Abriendo detalle desde URL:', searchId);
            setSelectedRegistroId(searchId);
            setShowDetailsModal(true);
        }
    }, [location.search]);

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
        } else if (hab.estadoVisual === 'reservada') {
            const huesped = hab.detalleEstado?.huesped || 'Cliente';
            
            Swal.fire({
                title: 'Habitación Reservada',
                html: `Esta habitación tiene una reserva activa para hoy a nombre de: <b>${huesped}</b>.<br/><br/>
                       ¿Desea registrar el ingreso ahora o dirigirse al listado de reservas?`,
                icon: 'info',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonColor: '#059669',
                denyButtonColor: '#3b82f6',
                confirmButtonText: 'Registrar Ingreso',
                denyButtonText: 'Ir a Reservas',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Confirmación adicional para evitar errores
                    Swal.fire({
                        title: 'Confirmar Ingreso',
                        text: `¿Está seguro de registrar la reserva a nombre del huésped ${huesped}?`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonColor: '#059669',
                        confirmButtonText: 'Sí, registrar',
                        cancelButtonText: 'No, esperar'
                    }).then((nestedResult) => {
                        const resId = hab.detalleEstado?.id_reserva || hab.detalleEstado?.reserva_id || hab.id_reserva;
                        if (nestedResult.isConfirmed) {
                            if (resId) {
                                handleCheckinFromReserva(hab, resId);
                            } else {
                                Swal.fire('Error', 'No se encontró el ID de la reserva en los datos del mapa. Por favor reinicie el servidor o use el listado de reservas.', 'error');
                            }
                        }
                    });
                } else if (result.isDenied) {
                    navigate('/reservas');
                }
            });
        } else {
            // Bloqueo de seguridad solicitado por el usuario para otros estados
            let mensaje = '';
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

    const handleCheckinFromReserva = async (hab, resId) => {
        const idToUse = resId || hab.detalleEstado?.id_reserva || hab.id_reserva;
        
        if (!idToUse) {
            Swal.fire('Error', 'No se encontró el ID de la reserva.', 'error');
            return;
        }

        try {
            Swal.fire({ 
                title: 'Cargando datos...', 
                html: 'Preparando formulario de registro',
                allowOutsideClick: false, 
                didOpen: () => Swal.showLoading() 
            });
            
            console.log(`[DEBUG-CHECKIN] Buscando reserva ID: ${idToUse} para habitación: ${hab.numero}`);
            const res = await api.get(`/reservas/${idToUse}`);
            
            setSelectedHabitacionId(hab.id);
            setSelectedReserva(res.data);
            setShowRegistroModal(true);
            Swal.close();
        } catch (error) {
            console.error('Error fetching reservation:', error);
            const status = error.response?.status;
            let msg = 'No se pudieron obtener los detalles de la reserva.';
            if (status === 404) msg = 'La reserva no existe en el servidor. Por favor verifique el listado de reservas.';
            
            Swal.fire('Error', msg, 'error');
        }
    };

    const handleQuickCheckout = async (habId, registroId, saldo) => {
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
                    <div className="bg-sky-100 p-3 rounded-2xl text-sky-600"><Brush size={24}/></div>
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
                    const isCheckoutToday = hab.detalleEstado?.salida && moment().isSame(moment.utc(hab.detalleEstado.salida), 'day');
                    const isHighBalance = (hab.detalleEstado?.saldo || 0) > 250000;

                    return (
                        <div 
                            key={hab.id}
                            onClick={() => handleRoomClick(hab)}
                            className={`group relative transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
                        >
                            <div className={`h-full bg-white rounded-2xl shadow-sm border-2 ${isCheckoutToday ? 'border-orange-400 ring-2 ring-orange-100 ring-offset-1' : styles.border} overflow-hidden flex flex-col`}>
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
                                            {updating === hab.id ? <Loader2 size={10} className="animate-spin" /> : (isDirty(hab.estadoLimpieza) ? <Brush size={10} /> : <CheckCircle size={10} />)}
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
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${styles.badge}`}>
                                            {hab.estadoVisual.replace('_', ' ')}
                                            {isDirty(hab.estadoLimpieza) && hab.estadoVisual === 'ocupada' && (
                                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" title="Requiere aseo"></span>
                                            )}
                                        </span>
                                        {isCheckoutToday && (
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500 text-white text-[8px] font-black uppercase rounded-md animate-pulse">
                                                <Clock size={8} /> Salida Hoy
                                            </span>
                                        )}
                                    </div>
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
                                                </div>
                                                <div className="grid grid-cols-2 gap-1 mt-1 pt-1 border-t border-gray-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] text-gray-400 uppercase font-black">Total</span>
                                                        <span className="text-[9px] font-black text-gray-700">${formatCurrency(hab.detalleEstado.totalGeneral || 0)}</span>
                                                    </div>
                                                    <div className="flex flex-col text-right">
                                                        <span className="text-[7px] text-gray-400 uppercase font-black">Pagado</span>
                                                        <span className="text-[9px] font-black text-emerald-600">${formatCurrency(hab.detalleEstado.pagado || 0)}</span>
                                                    </div>
                                                </div>
                                                <div className={`mt-1 p-1.5 rounded-lg flex justify-between items-center text-[10px] font-black ${ (hab.detalleEstado.saldo || 0) > 0 ? (isHighBalance ? 'bg-red-600 text-white ring-2 ring-red-200' : 'bg-red-100 text-red-700 animate-pulse') : 'bg-emerald-100 text-emerald-700'}`}>
                                                    <div className="flex items-center gap-1">
                                                        {isHighBalance ? <AlertCircle size={10} /> : <DollarSign size={10} />} 
                                                        SALDO:
                                                    </div>
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
                                                hab.reservasFuturas.slice(0, 3).map((res) => {
                                                    const isTomorrow = moment().add(1, 'day').isSame(moment.utc(res.entrada), 'day');
                                                    return (
                                                        <div key={res.id} className={`text-[8px] flex justify-between items-center ${isTomorrow ? 'bg-blue-50 border-blue-100' : 'bg-gray-50/70 border-transparent'} p-1 rounded-md border hover:border-gray-200 transition-colors`}>
                                                            <div className="truncate font-black text-gray-800 uppercase tracking-tight max-w-[50px]" title={res.cliente}>
                                                                {res.cliente}
                                                            </div>
                                                            <div className={`flex items-center gap-0.5 font-black px-1 py-0.5 rounded-sm ${isTomorrow ? 'bg-blue-500 text-white animate-pulse' : 'text-primary-600 bg-primary-50'}`}>
                                                                {isTomorrow ? 'MAÑANA' : moment.utc(res.entrada).format('DD/MM')}
                                                            </div>
                                                        </div>
                                                    );
                                                })
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
                    setSelectedReserva(null);
                    setSelectedHabitacionId(null);
                }}
                initialHabitacionId={selectedHabitacionId}
                initialReserva={selectedReserva}
                onSuccess={fetchMapa}
            />

            <DetallesRegistroModal 
                registroId={selectedRegistroId}
                isOpen={showDetailsModal}
                initialEditMode={initialEditMode}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedRegistroId(null);
                    setInitialEditMode(false);
                    // Si veníamos por URL, limpiamos el parámetro al cerrar
                    if (location.search.includes('search')) {
                        navigate(location.pathname, { replace: true });
                    }
                }}
                onSuccess={() => {
                    fetchMapa();
                }}
            />
        </div>
    );
};

export default MapaHabitaciones;
