import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Select from 'react-select';
import { Plus, Calendar as CalendarIcon, List, Search, Save, X, Trash2, CheckCircle, AlertCircle, Edit2, MessageSquare } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePermissions } from '../hooks/usePermissions';
import { formatCurrency, cleanNumericValue } from '../utils/format';

moment.locale('es');
const localizer = momentLocalizer(moment);

const Reservas = () => {
    const { user } = useContext(AuthContext);
    const { canView, canEdit, canDelete } = usePermissions('reservas');
    const [view, setView] = useState('calendar'); // 'calendar' or 'list'
    const [reservas, setReservas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isNewClient, setIsNewClient] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        id: null,
        cliente_id: null,
        nuevoCliente: {
            nombre: '',
            documento: '',
            tipo_documento: 'CC',
            telefono: '',
            email: ''
        },
        habitaciones: [],
        fecha_entrada: '',
        fecha_salida: '',
        numero_personas: 1,
        valor_total: 0,
        valor_abonado: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    // Cálculo automático del valor total estimado
    useEffect(() => {
        if (formData.habitaciones.length > 0 && formData.fecha_entrada && formData.fecha_salida) {
            const entrada = moment(formData.fecha_entrada);
            const salida = moment(formData.fecha_salida);
            const noches = salida.diff(entrada, 'days');
            
            if (noches > 0) {
                const totalHabitaciones = formData.habitaciones.reduce((acc, curr) => acc + curr.precio, 0);
                const totalCalculado = totalHabitaciones * noches;
                setFormData(prev => ({ ...prev, valor_total: totalCalculado }));
            }
        }
    }, [formData.habitaciones, formData.fecha_entrada, formData.fecha_salida]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resReservas, resClientes, resHabitaciones] = await Promise.all([
                api.get('/reservas'),
                api.get('/clientes'),
                api.get('/habitaciones')
            ]);
            setReservas(resReservas.data);
            setClientes(resClientes.data);
            setHabitaciones(resHabitaciones.data.filter(h => h.estado_nombre !== 'Mantenimiento'));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'No se pudo cargar la información', 'error');
            setLoading(false);
        }
    };

    const calendarEvents = useMemo(() => {
        return reservas.map(r => ({
            id: r.id,
            title: `${r.cliente_nombre} - Hab: ${r.habitaciones.map(h => h.numero).join(', ')}`,
            start: new Date(r.fecha_entrada + 'T00:00:00'),
            end: new Date(r.fecha_salida + 'T23:59:59'),
            resource: r,
            allDay: true
        }));
    }, [reservas]);

    const handleSelectEvent = (event) => {
        const r = event.resource;
        Swal.fire({
            title: `Reserva #${r.id}`,
            html: `
                <div class="text-left font-sans">
                    <p class="py-1"><strong>Cliente:</strong> ${r.cliente_nombre}</p>
                    <p class="py-1"><strong>Identificación:</strong> ${r.identificacion || r.documento}</p>
                    <p class="py-1"><strong>Habitaciones:</strong> ${r.habitaciones.map(h => h.numero).join(', ')}</p>
                    <p class="py-1"><strong>Personas:</strong> ${r.numero_personas}</p>
                    <p class="py-1"><strong>Entrada:</strong> ${moment(r.fecha_entrada).format('DD/MM/YYYY')}</p>
                    <p class="py-1"><strong>Salida:</strong> ${moment(r.fecha_salida).format('DD/MM/YYYY')}</p>
                    <p class="py-1"><strong>Total:</strong> <span class="text-emerald-700 font-black">$${formatCurrency(r.valor_total)}</span></p>
                    <p class="py-1"><strong>Abonado:</strong> <span class="text-blue-700 font-black">$${formatCurrency(r.valor_abonado)}</span></p>
                    <p class="py-1"><strong>Estado:</strong> <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.estado === 'Cancelada' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}">${r.estado}</span></p>
                </div>
            `,
            showCancelButton: true,
            showDenyButton: canEdit && r.estado !== 'Cancelada' && r.estado !== 'Concluida',
            confirmButtonText: canDelete && r.estado !== 'Cancelada' ? 'Anular Reserva' : null,
            denyButtonText: 'Editar Reserva',
            cancelButtonText: 'Cerrar',
            confirmButtonColor: '#ef4444',
            denyButtonColor: '#3b82f6',
        }).then((result) => {
            if (result.isConfirmed) {
                updateStatus(r.id, 'Cancelada');
            } else if (result.isDenied) {
                handleEdit(r);
            }
        });
    };

    const handleEdit = (r) => {
        setIsNewClient(false);
        setFormData({
            id: r.id,
            cliente_id: { value: r.cliente_id, label: r.cliente_nombre },
            nuevoCliente: { nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '' },
            habitaciones: r.habitaciones.map(h => ({
                value: h.habitacion_id,
                label: `Hab ${h.numero}`,
                precio: h.precio_acordado
            })),
            fecha_entrada: r.fecha_entrada.split('T')[0],
            fecha_salida: r.fecha_salida.split('T')[0],
            numero_personas: r.numero_personas,
            valor_total: r.valor_total,
            valor_abonado: r.valor_abonado
        });
        setShowModal(true);
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await api.patch(`/reservas/${id}/estado`, { estado: newStatus });
            Swal.fire('Éxito', 'Estado actualizado', 'success');
            fetchData();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al actualizar', 'error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (isNewClient) {
            if (!formData.nuevoCliente.nombre || !formData.nuevoCliente.documento) {
                return Swal.fire('Atención', 'Nombre y documento son obligatorios para el nuevo cliente', 'warning');
            }
        } else if (!formData.cliente_id) {
            return Swal.fire('Atención', 'Debes seleccionar un cliente existente o registrar uno nuevo', 'warning');
        }

        if (formData.habitaciones.length === 0) {
            return Swal.fire('Atención', 'Selecciona al menos una habitación', 'warning');
        }

        try {
            let finalClienteId = formData.cliente_id?.value;

            // Step 1: Create client if new
            if (isNewClient) {
                const resCli = await api.post('/clientes', formData.nuevoCliente);
                finalClienteId = resCli.data.id;
            }

            // Step 2: Save reservation
            const payload = {
                ...formData,
                cliente_id: finalClienteId,
                habitaciones: formData.habitaciones.map(h => ({ id: h.value || h.id, precio: h.precio }))
            };

            if (formData.id) {
                await api.put(`/reservas/${formData.id}`, payload);
                Swal.fire('Éxito', 'Reserva actualizada correctamente', 'success');
            } else {
                await api.post('/reservas', payload);
                Swal.fire('Éxito', 'Reserva creada correctamente', 'success');
            }

            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error en la operación', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            id: null,
            cliente_id: null,
            nuevoCliente: {
                nombre: '',
                documento: '',
                tipo_documento: 'CC',
                telefono: '',
                email: ''
            },
            habitaciones: [],
            fecha_entrada: '',
            fecha_salida: '',
            numero_personas: 1,
            valor_total: 0,
            valor_abonado: 0
        });
        setIsNewClient(false);
    };

    const clientOptions = clientes.map(c => ({
        value: c.id,
        label: `${c.nombre} (${c.documento})`
    }));

    const roomOptions = habitaciones.map(h => ({
        value: h.id,
        label: `Hab ${h.numero} - ${h.tipo_nombre} ($${formatCurrency(h.precio_1)})`,
        precio: h.precio_1
    }));

    const eventStyleGetter = (event) => {
        const color = event.resource.estado === 'Cancelada' ? '#94a3b8' : '#3b82f6';
        return {
            style: {
                backgroundColor: color,
                borderRadius: '8px',
                opacity: 0.8,
                color: 'white',
                border: 'none',
                display: 'block'
            }
        };
    };

    if (!canView) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                <AlertCircle className="text-red-500 w-12 h-12 mb-4" />
                <h2 className="text-xl font-black text-gray-800">Acceso Denegado</h2>
                <p className="text-gray-500 font-medium text-center">No tienes permisos para visualizar el calendario de reservas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <CalendarIcon className="text-blue-600" />
                        Gestión de Reservas
                    </h1>
                    <p className="text-gray-500 font-medium">Planifica y controla la ocupación futura del hotel</p>
                </div>
                
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    <button 
                        onClick={() => setView('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${view === 'calendar' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <CalendarIcon size={18} />
                        Calendario
                    </button>
                    <button 
                        onClick={() => setView('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${view === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <List size={18} />
                        Listado
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    {canEdit && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-md hover:bg-emerald-600 transition-all"
                        >
                            <Plus size={18} />
                            Nueva Reserva
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500 font-bold">Cargando agenda de reservas...</p>
                </div>
            ) : view === 'calendar' ? (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[700px]">
                    <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                        messages={{
                            next: "Sig.",
                            previous: "Ant.",
                            today: "Hoy",
                            month: "Mes",
                            week: "Semana",
                            day: "Día",
                            agenda: "Agenda",
                            date: "Fecha",
                            time: "Hora",
                            event: "Reserva",
                            noEventsInRange: "No hay reservas en este periodo."
                        }}
                    />
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4">ID</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Habitaciones</th>
                                <th className="p-4">Fechas</th>
                                <th className="p-4">Personas</th>
                                <th className="p-4">Financiero</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {reservas.map(r => (
                                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 font-bold text-blue-600">#{r.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{r.cliente_nombre}</div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 font-medium">{r.identificacion || r.documento}</span>
                                            {r.telefono && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded leading-none">{r.telefono}</span>
                                                    <a 
                                                        href={`https://wa.me/${r.telefono.replace(/\s+/g, '')}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-800 transition-colors"
                                                        title="Escribir al WhatsApp"
                                                    >
                                                        <MessageSquare size={12} />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {r.habitaciones.map(h => (
                                                <span key={h.habitacion_id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
                                                    Hab {h.numero}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs font-bold text-gray-700">
                                            {moment(r.fecha_entrada).format('DD MMM')} - {moment(r.fecha_salida).format('DD MMM')}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-medium">
                                            {moment(r.fecha_salida).diff(moment(r.fecha_entrada), 'days')} noches
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-gray-600">{r.numero_personas}</td>
                                    <td className="p-4">
                                        <div className="text-xs font-black text-gray-800">$ {formatCurrency(r.valor_total)}</div>
                                        <div className="text-[10px] text-emerald-600 font-bold">Abono: $ {formatCurrency(r.valor_abonado)}</div>
                                        {r.valor_total - r.valor_abonado > 0 && (
                                            <div className="text-[10px] text-red-500 font-bold">Debe: $ {formatCurrency(r.valor_total - r.valor_abonado)}</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            r.estado === 'Confirmada' ? 'bg-blue-100 text-blue-700' :
                                            r.estado === 'Cancelada' ? 'bg-red-100 text-red-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {r.estado}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {canEdit && r.estado !== 'Cancelada' && r.estado !== 'Concluida' && (
                                                <button 
                                                    onClick={() => handleEdit(r)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar Reserva"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                            )}
                                            {canDelete && r.estado !== 'Cancelada' && (
                                                <button 
                                                    onClick={() => updateStatus(r.id, 'Cancelada')}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Cancelar Reserva"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Nueva Reserva */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-gray-800">Nueva Reservación</h2>
                                <p className="text-sm text-gray-500 font-medium">Registra el ingreso de una reserva futura</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-gray-700">Cliente *</label>
                                        <button 
                                            type="button"
                                            onClick={() => setIsNewClient(!isNewClient)}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            {isNewClient ? '← Seleccionar de la lista' : '+ Registrar nuevo cliente'}
                                        </button>
                                    </div>

                                    {!isNewClient ? (
                                        <Select
                                            options={clientOptions}
                                            value={formData.cliente_id}
                                            onChange={(val) => setFormData({...formData, cliente_id: val})}
                                            placeholder="Buscar cliente por nombre o cédula..."
                                            className="text-sm font-medium"
                                            isClearable
                                        />
                                    ) : (
                                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-4 animate-fade-in">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Tipo Doc.</label>
                                                    <select 
                                                        className="w-full px-3 py-2 rounded-xl border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                                        value={formData.nuevoCliente.tipo_documento}
                                                        onChange={(e) => setFormData({...formData, nuevoCliente: {...formData.nuevoCliente, tipo_documento: e.target.value}})}
                                                    >
                                                        <option value="CC">Cédula de Ciudadanía</option>
                                                        <option value="CE">Cédula de Extranjería</option>
                                                        <option value="TI">Tarjeta de Identidad</option>
                                                        <option value="PP">Pasaporte</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Identificación *</label>
                                                    <input 
                                                        type="text"
                                                        className="w-full px-3 py-2 rounded-xl border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                                        placeholder="N° de documento"
                                                        value={formData.nuevoCliente.documento}
                                                        onChange={(e) => setFormData({...formData, nuevoCliente: {...formData.nuevoCliente, documento: e.target.value}})}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Nombre Completo *</label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-3 py-2 rounded-xl border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                                    placeholder="Nombre y Apelliido"
                                                    value={formData.nuevoCliente.nombre}
                                                    onChange={(e) => setFormData({...formData, nuevoCliente: {...formData.nuevoCliente, nombre: e.target.value}})}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Teléfono</label>
                                                    <input 
                                                        type="tel"
                                                        className="w-full px-3 py-2 rounded-xl border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                                        placeholder="Celular"
                                                        value={formData.nuevoCliente.telefono}
                                                        onChange={(e) => setFormData({...formData, nuevoCliente: {...formData.nuevoCliente, telefono: e.target.value}})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Email</label>
                                                    <input 
                                                        type="email"
                                                        className="w-full px-3 py-2 rounded-xl border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                                        placeholder="correo@ejemplo.com"
                                                        value={formData.nuevoCliente.email}
                                                        onChange={(e) => setFormData({...formData, nuevoCliente: {...formData.nuevoCliente, email: e.target.value}})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Habitaciones a Reservar *</label>
                                    <Select
                                        isMulti
                                        options={roomOptions}
                                        value={formData.habitaciones}
                                        onChange={(val) => setFormData({...formData, habitaciones: val})}
                                        placeholder="Selecciona una o varias habitaciones..."
                                        className="text-sm font-medium"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Entrada *</label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="date"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                                            value={formData.fecha_entrada}
                                            onChange={(e) => setFormData({...formData, fecha_entrada: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Salida *</label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="date"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                                            value={formData.fecha_salida}
                                            onChange={(e) => setFormData({...formData, fecha_salida: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Número de Personas</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                                        value={formData.numero_personas}
                                        onChange={(e) => setFormData({...formData, numero_personas: parseInt(e.target.value)})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Abono Inicial</label>
                                    <input 
                                        type="text"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-emerald-600 text-sm"
                                        value={formatCurrency(formData.valor_abonado)}
                                        onChange={(e) => setFormData({...formData, valor_abonado: cleanNumericValue(e.target.value)})}
                                    />
                                </div>

                                <div className="md:col-span-2 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Valor Total Estimado</label>
                                        <div className="flex items-center text-blue-900">
                                            <span className="text-2xl font-black mr-1">$</span>
                                            <input 
                                                type="text"
                                                className="bg-transparent text-2xl font-black outline-none w-full focus:ring-2 focus:ring-blue-400 rounded-lg px-2"
                                                value={formatCurrency(formData.valor_total)}
                                                onChange={(e) => setFormData({...formData, valor_total: cleanNumericValue(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right border-l border-blue-200 pl-6 ml-6">
                                        <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Saldo</span>
                                        <span className="text-xl font-black text-gray-700">$ {formatCurrency(formData.valor_total - formData.valor_abonado)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Confirmar Reserva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservas;
