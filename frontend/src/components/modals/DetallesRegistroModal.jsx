import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import moment from 'moment';
import { format } from 'date-fns';
import { 
    X, 
    Edit, 
    Save, 
    Plus, 
    Trash2, 
    Info, 
    DollarSign, 
    CreditCard, 
    ShoppingBag,
    User,
    Calendar,
    Home,
    Edit3,
    Printer,
    LogOut,
    Clock
} from 'lucide-react';
import { formatCurrency, cleanNumericValue } from '../../utils/format';
import { generateVoucher } from '../../utils/voucherGenerator';

const DetallesRegistroModal = ({ registroId, isOpen, onClose, onSuccess, initialEditMode = false }) => {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(initialEditMode);
    const [details, setDetails] = useState(null);
    const [consumos, setConsumos] = useState([]);
    const [abonos, setAbonos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [mediosPago, setMediosPago] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]);
    
    const [editData, setEditData] = useState({
        fecha_salida: '',
        total: '',
        notas: ''
    });

    const [showAbonoForm, setShowAbonoForm] = useState(false);
    const [abonoForm, setAbonoForm] = useState({ monto: '', medio: '', notas: '' });
    
    const [showConsumoForm, setShowConsumoForm] = useState(false);
    const [consumoForm, setConsumoForm] = useState({ productoId: '', cantidad: 1 });

    useEffect(() => {
        if (isOpen && registroId) {
            fetchData();
            setIsEditing(initialEditMode);
        } else {
            // Reset state when closed
            setDetails(null);
            setIsEditing(false);
            setShowAbonoForm(false);
            setShowConsumoForm(false);
        }
    }, [isOpen, registroId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resDet, resCons, resAbonos, resProd, resMedios, resHab] = await Promise.all([
                api.get(`/registros/${registroId}`),
                api.get(`/ventas/consumo/${registroId}`),
                api.get(`/registros/${registroId}/pagos`),
                api.get('/productos'),
                api.get('/medios-pago'),
                api.get('/habitaciones')
            ]);
            
            const det = resDet.data;
            setDetails(det);
            setConsumos(resCons.data);
            setAbonos(resAbonos.data);
            setProductos(resProd.data);
            setMediosPago(resMedios.data);
            setHabitaciones(resHab.data);
            
            setEditData({
                fecha_salida: det.fecha_salida ? det.fecha_salida.split('T')[0] : '',
                total: det.total || 0,
                notas: det.notas || ''
            });
        } catch (error) {
            console.error("Error fetching registro details:", error);
            Swal.fire('Error', 'No se pudieron cargar los detalles del registro', 'error');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        if (name === 'total') {
            setEditData(prev => ({ ...prev, [name]: cleanNumericValue(value) }));
        } else if (name === 'fecha_salida') {
            const newDate = value;
            const det = details;
            
            // Recalcular total sugerido
            const hab = habitaciones.find(h => String(h.id || h._id) === String(det.habitacion_id || det.habitacion?._id));
            if (hab && det.fecha_ingreso && newDate) {
                const inDate = new Date(det.fecha_ingreso);
                const outDate = new Date(newDate);
                if (outDate >= inDate) {
                    const diffTime = outDate - inDate;
                    const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
                    const numPersonas = Math.min(Math.max(det.huespedes?.length || 1, 1), 6);
                    const pNoche = parseFloat(hab[`precio_${numPersonas}`]) || parseFloat(hab.precio_1) || 0;
                    const rawTotal = (pNoche * diffDays);
                    setEditData(prev => ({ 
                        ...prev, 
                        fecha_salida: newDate,
                        total: rawTotal.toFixed(0)
                    }));
                    return;
                }
            }
            setEditData(prev => ({ ...prev, [name]: value }));
        } else {
            setEditData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        try {
            Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            const dataToUpdate = {
                fechaSalida: editData.fecha_salida,
                total: editData.total,
                notas: editData.notas,
                observaciones: editData.notas // For compatibility
            };
            
            await api.put(`/registros/${registroId}`, dataToUpdate);
            
            Swal.fire({ icon: 'success', title: 'Actualizado correctamente', timer: 1500, showConfirmButton: false });
            setIsEditing(false);
            fetchData();
            if (onSuccess) onSuccess();
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el registro', 'error');
        }
    };

    const handleAddAbono = async (e) => {
        e.preventDefault();
        if (!abonoForm.monto || !abonoForm.medio) return;
        
        try {
            await api.post(`/registros/${registroId}/pagos`, abonoForm);
            setAbonoForm({ monto: '', medio: '', notas: '' });
            setShowAbonoForm(false);
            fetchData();
            if (onSuccess) onSuccess();
            Swal.fire({ icon: 'success', title: 'Abono registrado', timer: 1500, showConfirmButton: false });
        } catch (error) {
            Swal.fire('Error', 'No se pudo registrar el abono', 'error');
        }
    };

    const handleDeleteAbono = async (pagoId) => {
        const result = await Swal.fire({
            title: '¿Eliminar abono?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/registros/${registroId}/pagos/${pagoId}`);
                fetchData();
                if (onSuccess) onSuccess();
                Swal.fire('Eliminado', 'El abono ha sido eliminado', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el abono', 'error');
            }
        }
    };

    const handleAddConsumo = async (e) => {
        e.preventDefault();
        if (!consumoForm.productoId || !consumoForm.cantidad) return;
        
        const prod = productos.find(p => p.id === parseInt(consumoForm.productoId));
        try {
            await api.post('/ventas/consumo', {
                registro_id: registroId,
                productos: [{
                    id: prod.id,
                    cantidad: parseInt(consumoForm.cantidad),
                    precio: prod.precio
                }]
            });
            setConsumoForm({ productoId: '', cantidad: 1 });
            setShowConsumoForm(false);
                    fetchData();
                    if (onSuccess) onSuccess();
                    Swal.fire({ icon: 'success', title: 'Consumo registrado', timer: 1500, showConfirmButton: false });
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'No se pudo registrar el consumo', 'error');
                }
            };

    const handleExtendStay = async () => {
        const inDate = moment.utc(details.fecha_ingreso);
        const outDate = moment.utc(details.fecha_salida);
        const currentDays = Math.max(outDate.diff(inDate, 'days'), 1);
        const currentPricePerNight = details.total / currentDays;

        const { value: formValues } = await Swal.fire({
            title: 'Extender Estancia (Prórroga)',
            html: `
                <div class="text-left space-y-5 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Gestión de Tiempo</p>
                            <h4 class="text-sm font-black text-slate-800">Prórroga de Habitación #${details.numero_habitacion}</h4>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">¿Cuántos días adicionales?</label>
                            <div class="relative">
                                <input id="swal-input-days" type="number" min="1" value="1" 
                                    class="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-black text-slate-800 text-lg focus:ring-2 focus:ring-blue-400 transition-all text-center"
                                />
                                <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">NOCHES</div>
                            </div>
                        </div>

                        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Precio por noche adicional</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold text-lg">$</span>
                                <input id="swal-input-price" type="text" value="${formatCurrency(currentPricePerNight)}" 
                                    class="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 font-black text-slate-800 text-lg focus:ring-2 focus:ring-blue-400 transition-all"
                                    oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200">
                        <div class="flex justify-between items-center opacity-70 text-[10px] font-black uppercase tracking-tighter mb-1">
                            <span>Resumen de Prórroga</span>
                            <span id="swal-preview-days">1 Día extra</span>
                        </div>
                        <div class="flex justify-between items-end">
                            <p class="text-xs font-medium">Nuevo Saldo Sugerido:</p>
                            <p class="text-2xl font-black" id="swal-preview-total">$${formatCurrency(details.total + currentPricePerNight)}</p>
                        </div>
                    </div>
                </div>
            `,
            width: '450px',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Confirmar Prórroga',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            customClass: {
                popup: 'rounded-[2rem] p-4',
                confirmButton: 'rounded-xl font-black uppercase tracking-widest text-xs px-8 py-3.5',
                cancelButton: 'rounded-xl font-black uppercase tracking-widest text-xs px-8 py-3.5'
            },
            didOpen: () => {
                const inputDays = document.getElementById('swal-input-days');
                const inputPrice = document.getElementById('swal-input-price');
                const previewTotal = document.getElementById('swal-preview-total');
                const previewDays = document.getElementById('swal-preview-days');

                const updatePreview = () => {
                    const days = parseInt(inputDays.value) || 0;
                    const price = parseFloat(inputPrice.value.replace(/\./g, '')) || 0;
                    const additional = days * price;
                    const newTotal = details.total + additional;
                    
                    previewTotal.innerText = `$${new Intl.NumberFormat('de-DE').format(newTotal)}`;
                    previewDays.innerText = `${days} Día(s) extra`;
                };

                inputDays.addEventListener('input', updatePreview);
                inputPrice.addEventListener('input', updatePreview);
            },
            preConfirm: () => {
                const days = parseInt(document.getElementById('swal-input-days').value);
                const price = parseFloat(document.getElementById('swal-input-price').value.replace(/\./g, ''));
                
                if (isNaN(days) || days <= 0) {
                    Swal.showValidationMessage('Ingresa un número de días válido');
                    return false;
                }
                if (isNaN(price) || price < 0) {
                    Swal.showValidationMessage('Ingresa un precio válido');
                    return false;
                }

                return { days, price };
            }
        });

        if (formValues) {
            const newOutDate = moment.utc(details.fecha_salida).add(formValues.days, 'days').format('YYYY-MM-DD');
            const additionalTotal = formValues.days * formValues.price;
            const newTotal = details.total + additionalTotal;

            try {
                Swal.fire({ title: 'Actualizando registro...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                
                await api.put(`/registros/${registroId}`, {
                    fechaSalida: newOutDate,
                    total: newTotal,
                    notas: `${details.notas || ''} \n[PRÓRROGA: ${formValues.days} día(s) adicionales por $${formatCurrency(additionalTotal)}]`.trim()
                });
                
                const { isConfirmed } = await Swal.fire({
                    title: '¡Estancia Extendida!',
                    html: `
                        <p class="text-sm text-slate-500 mb-4 font-medium">Se han añadido ${formValues.days} día(s) a la estancia.</p>
                        <div class="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-emerald-700">
                            <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Monto a cobrar por prórroga</p>
                            <p class="text-4xl font-black">$${formatCurrency(additionalTotal)}</p>
                        </div>
                        <p class="text-xs font-bold text-slate-400 mt-4 uppercase">¿Deseas registrar este pago ahora mismo?</p>
                    `,
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, Registrar Pago',
                    cancelButtonText: 'Después',
                    confirmButtonColor: '#10b981',
                    customClass: {
                        popup: 'rounded-[2rem] p-4',
                        confirmButton: 'rounded-xl font-black uppercase tracking-widest text-xs px-8 py-3.5',
                        cancelButton: 'rounded-xl font-black uppercase tracking-widest text-xs px-8 py-3.5'
                    }
                });

                if (isConfirmed) {
                    setAbonoForm({ 
                        monto: additionalTotal, 
                        medio: 'Efectivo', 
                        notas: `Pago por extensión de estadía (${formValues.days} días adicionales)` 
                    });
                    setShowAbonoForm(true);
                }
                
                fetchData();
                if (onSuccess) onSuccess();
            } catch (error) {
                Swal.fire('Error', 'No se pudo procesar la extensión de estadía', 'error');
            }
        }
    };

    const handleCheckout = async () => {
        const result = await Swal.fire({
            title: '¿Confirmar Check-out?',
            html: `
                <div class="text-left space-y-4">
                    <p class="text-lg text-gray-700 font-bold">La habitación pasará a estado 'Pendiente por asear'.</p>
                    ${saldo > 0 ? `
                        <div class="bg-red-50 border-2 border-red-500 p-6 rounded-2xl text-red-700 shadow-lg animate-pulse">
                            <div class="flex items-center gap-2 mb-1 justify-center">
                                <span class="bg-red-500 text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>
                                <strong class="text-xl font-black uppercase tracking-tight">¡SALDO PENDIENTE!</strong>
                            </div>
                            <p class="text-4xl font-black text-center mb-1">$${formatCurrency(saldo)}</p>
                            <p class="text-sm font-bold text-center opacity-90 uppercase tracking-widest leading-tight">REGISTRAR COBRO ANTES DE SALIDA</p>
                        </div>
                    ` : ''}
                    <div class="mt-2">
                        <label class="block text-sm font-black text-gray-400 uppercase mb-1 tracking-wider">Notas de salida (Opcional):</label>
                    </div>
                </div>
            `,
            input: 'textarea',
            inputPlaceholder: 'Observaciones aquí...',
            icon: saldo > 0 ? 'warning' : 'question',
            width: '450px',
            showCancelButton: true,
            confirmButtonColor: saldo > 0 ? '#ef4444' : '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: saldo > 0 ? 'Sí, salir con saldo' : 'Sí, Salir',
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
                Swal.fire('Éxito', 'Check-out realizado. Habitación lista para aseo.', 'success');
                if (onSuccess) onSuccess();
                onClose();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo procesar el check-out', 'error');
            }
        }
    };

    if (!isOpen) return null;

    const totalConsumos = consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0);
    const totalEstancia = isEditing ? parseFloat(editData.total) : (details?.total || 0);
    const totalGeneral = totalEstancia + totalConsumos;
    const abonado = details?.valor_pagado || 0;
    const saldo = totalGeneral - abonado;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto h-full w-full flex items-center justify-center z-[100] p-2 md:p-4">
            <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">
                            Detalles Registro <span className="text-gray-400 font-medium text-sm">#{registroId}</span>
                        </h2>
                        <div className="flex items-center gap-2">
                             <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest ${details?.estado === 'activa' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                                {details?.estado || 'Cargando...'}
                            </span>
                            {!isEditing && (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full hover:bg-blue-100 transition-all border border-blue-100 font-bold text-xs uppercase"
                                    >
                                        <Edit size={14} />
                                        <span>Editar</span>
                                    </button>
                                    {details?.estado === 'activa' && (
                                        <button 
                                            onClick={handleExtendStay}
                                            className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full hover:bg-amber-100 transition-all border border-amber-100 font-bold text-xs uppercase"
                                        >
                                            <Clock size={14} />
                                            <span>Prórroga</span>
                                        </button>
                                    )}
                                    <button 
                                        onClick={async () => {
                                            await generateVoucher({
                                                cliente_nombre: details.nombre_cliente || details.cliente?.nombre || 'Huésped',
                                                identificacion: details.cliente?.documento || details.identificacion || 'N/A',
                                                telefono: details.cliente?.telefono || details.telefono || 'N/A',
                                                fecha_entrada: details.fecha_ingreso,
                                                fecha_salida: details.fecha_salida,
                                                habitaciones: details.habitacion ? [{
                                                    numero: details.habitacion.numero,
                                                    precio_acordado: details.total / Math.max(1, moment.utc(details.fecha_salida).diff(moment.utc(details.fecha_ingreso), 'days'))
                                                }] : [],
                                                valor_total: totalGeneral,
                                                valor_abonado: abonado,
                                                tipo: 'registro'
                                            });
                                        }}
                                        className="flex items-center gap-2 bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full hover:bg-slate-100 transition-all border border-slate-200 font-bold text-xs uppercase"
                                        title="Imprimir Voucher PDF"
                                    >
                                        <Printer size={14} />
                                        <span>Imprimir</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="px-6 py-5">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando información...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Stats Summary Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Total Estancia</p>
                                    <p className="text-xl font-black text-gray-800">${formatCurrency(totalEstancia)}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Consumos</p>
                                    <p className="text-xl font-black text-blue-800">${formatCurrency(totalConsumos)}</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Abonado</p>
                                    <p className="text-xl font-black text-emerald-800">${formatCurrency(abonado)}</p>
                                </div>
                                <div className={`p-4 rounded-2xl border shadow-sm ${saldo > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${saldo > 0 ? 'text-red-400' : 'text-green-400'}`}>Saldo</p>
                                    <p className="text-xl font-black tracking-tight">${formatCurrency(Math.max(0, saldo))}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column */}
                                <div className="space-y-8">
                                    {/* General Info */}
                                    <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100"></div>
                                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                                            <Info size={14} className="text-gray-400" /> Información General
                                        </h3>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                            <div>
                                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Habitación</label>
                                                <div className="flex items-center gap-2 font-black text-gray-800 text-sm">
                                                    <Home size={16} className="text-gray-300" />
                                                    #{details?.numero_habitacion}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Huésped Titular</label>
                                                <div className="flex items-center gap-2 font-black text-gray-800 text-sm truncate" title={details?.nombre_cliente}>
                                                    <User size={16} className="text-gray-300" />
                                                    <span className="truncate">{details?.nombre_cliente}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-in</label>
                                                <div className="flex items-center gap-1.5 font-bold text-gray-800 text-xs">
                                                    <Calendar size={14} className="text-gray-300" />
                                                    {details?.fecha_ingreso ? format(new Date(details.fecha_ingreso), 'dd/MM/yyyy') : '-'}
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-out (Est.)</label>
                                                {isEditing ? (
                                                    <input 
                                                        type="date"
                                                        name="fecha_salida"
                                                        className="w-full bg-blue-50 border-blue-100 border rounded-xl py-2 px-3 font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        value={editData.fecha_salida}
                                                        onChange={handleEditChange}
                                                    />
                                                ) : (
                                                    <div 
                                                        className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors group/field text-xs"
                                                        onClick={() => setIsEditing(true)}
                                                    >
                                                        <Calendar size={14} className="text-gray-300 group-hover/field:text-blue-400" />
                                                        {details?.fecha_salida ? format(new Date(details.fecha_salida), 'dd/MM/yyyy') : '-'}
                                                        <Edit3 size={10} className="opacity-0 group-hover/field:opacity-100 text-blue-400 ml-1 transition-opacity" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Abonos section */}
                                    <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                                <Plus size={14} className="text-emerald-500" /> Historial Abonos
                                            </h3>
                                            <button 
                                                onClick={() => setShowAbonoForm(!showAbonoForm)}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md shadow-emerald-100"
                                            >
                                                {showAbonoForm ? 'Cerrar' : '+ Nuevo'}
                                            </button>
                                        </div>

                                        {showAbonoForm && (
                                            <form onSubmit={handleAddAbono} className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-4 space-y-3 animate-in slide-in-from-top-4 duration-300">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-emerald-600 uppercase mb-1.5">Monto ($)</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full bg-white border-emerald-100 border rounded-xl py-2 px-3 font-bold text-gray-800 focus:outline-none" 
                                                            value={formatCurrency(abonoForm.monto)}
                                                            onChange={e => setAbonoForm({...abonoForm, monto: cleanNumericValue(e.target.value)})}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-emerald-600 uppercase mb-1.5">Medio Pago</label>
                                                        <select 
                                                            className="w-full bg-white border-emerald-100 border rounded-xl py-2 px-3 font-bold text-gray-800 focus:outline-none"
                                                            value={abonoForm.medio}
                                                            onChange={e => setAbonoForm({...abonoForm, medio: e.target.value})}
                                                        >
                                                            <option value="">Seleccione...</option>
                                                            {mediosPago.map(mp => (
                                                                <option key={mp.id} value={mp.nombre}>{mp.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder="Notas u observaciones..."
                                                    className="w-full bg-white border-emerald-100 border rounded-xl py-2 px-3 font-bold text-gray-800 focus:outline-none"
                                                    value={abonoForm.notas}
                                                    onChange={e => setAbonoForm({...abonoForm, notas: e.target.value})}
                                                />
                                                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                                                    Registrar Abono
                                                </button>
                                            </form>
                                        )}

                                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                            {abonos.map((a, i) => (
                                                <div key={a._id || i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group transition-all hover:border-emerald-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-white p-2 rounded-lg text-emerald-600 shadow-sm border border-emerald-50">
                                                            <CreditCard size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800 text-sm">${formatCurrency(a.monto)}</div>
                                                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                                                {a.medio} • {format(new Date(a.fecha), 'dd MMM, HH:mm')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="hidden md:block text-right">
                                                            <p className="text-[8px] font-black text-gray-300 uppercase leading-none mb-0.5">Responsable</p>
                                                            <p className="text-[10px] font-bold text-gray-500 leading-none">{a.usuario_nombre}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDeleteAbono(a._id || a.id)}
                                                            className="p-2 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {abonos.length === 0 && (
                                                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center opacity-40">
                                                    <DollarSign size={32} className="mb-2" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin abonos registrados</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-8">
                                    {/* Billing & Payments */}
                                    <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
                                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                                            <Info size={14} className="text-gray-400" /> Alojamiento y Pagos
                                        </h3>
                                        
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Valor Real a Cobrar (Total)</label>
                                                {isEditing ? (
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 font-bold text-xl">$</span>
                                                        <input 
                                                            type="text" 
                                                            name="total" 
                                                            className="w-full bg-white border-blue-200 border-2 rounded-2xl py-4 pl-10 pr-6 font-black text-gray-800 text-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                                                            value={formatCurrency(editData.total)} 
                                                            onChange={handleEditChange} 
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="text-2xl font-black text-gray-900 tracking-tight">${formatCurrency(details?.total)}</div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Medio Cobro</label>
                                                <div className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-black text-gray-700 border border-slate-200 inline-block uppercase tracking-wider">
                                                    {details?.medio_pago_nombre || 'No asignado'}
                                                </div>
                                            </div>

                                            <div className="pt-4 mt-4 border-t border-slate-200 space-y-2">
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-400 font-bold uppercase">Alojamiento:</span>
                                                    <span className="font-black text-gray-700">${formatCurrency(totalEstancia)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-400 font-bold uppercase">Consumos:</span>
                                                    <span className="font-black text-gray-700">${formatCurrency(totalConsumos)}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-300">
                                                    <span className="text-xs font-black text-blue-800 uppercase tracking-widest">Total Gral:</span>
                                                    <div className="text-2xl font-black text-blue-700 tracking-tight">
                                                        ${formatCurrency(totalGeneral)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-3">
                                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Notas / Observaciones</label>
                                                {isEditing ? (
                                                    <textarea 
                                                        name="notas" 
                                                        className="w-full bg-white border-blue-100 border rounded-2xl py-3 px-4 font-medium text-gray-700 text-xs focus:ring-4 focus:ring-blue-500/10 focus:outline-none min-h-[100px]" 
                                                        value={editData.notas} 
                                                        onChange={handleEditChange}
                                                        placeholder="Observaciones adicionales..."
                                                    ></textarea>
                                                ) : (
                                                    <div className="bg-white/50 p-4 rounded-2xl border border-slate-100 min-h-[60px]">
                                                        <p className="text-xs text-slate-500 italic font-medium leading-relaxed">
                                                            {details?.notas || 'Sin notas registradas.'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {details?.estado === 'finalizado' && (
                                                <div className="pt-3 border-t border-red-100 mt-2">
                                                    <label className="block text-[8px] font-black text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                        <LogOut size={10} /> Notas de Salida (Check-out)
                                                    </label>
                                                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 italic font-black text-red-900 text-[10px] shadow-sm min-h-[50px] flex items-center px-4">
                                                        {details.notasSalida || 'Sin observaciones registradas al momento de salida.'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Consumos Extras Section */}
                                    <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                                <ShoppingBag size={14} className="text-blue-500" /> Consumos Extras
                                            </h3>
                                            <button 
                                                onClick={() => setShowConsumoForm(!showConsumoForm)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md shadow-blue-100"
                                            >
                                                {showConsumoForm ? 'Cerrar' : '+ Nuevo'}
                                            </button>
                                        </div>
                                        
                                        {showConsumoForm && (
                                            <form onSubmit={handleAddConsumo} className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4 space-y-3 animate-in slide-in-from-top-4 duration-300">
                                                <div className="grid grid-cols-12 gap-3">
                                                    <div className="col-span-8">
                                                        <label className="block text-[9px] font-black text-blue-600 uppercase mb-1.5">Producto</label>
                                                        <select 
                                                            className="w-full bg-white border-blue-100 border rounded-xl py-2 px-3 font-bold text-gray-800 focus:outline-none" 
                                                            value={consumoForm.productoId} 
                                                            onChange={e => setConsumoForm({...consumoForm, productoId: e.target.value})}
                                                        >
                                                            <option value="">Buscar producto...</option>
                                                            {productos.filter(p => p.stock > 0 && p.tipo_inventario === 'venta').map(p => (
                                                                <option key={p.id} value={p.id}>{p.nombre} (${formatCurrency(p.precio)})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-4">
                                                        <label className="block text-[9px] font-black text-blue-600 uppercase mb-1.5">Cant.</label>
                                                        <input 
                                                            type="number" 
                                                            min="1" 
                                                            className="w-full bg-white border-blue-100 border rounded-xl py-2 px-3 font-bold text-gray-800 focus:outline-none text-center" 
                                                            value={consumoForm.cantidad} 
                                                            onChange={e => setConsumoForm({...consumoForm, cantidad: e.target.value})} 
                                                        />
                                                    </div>
                                                </div>
                                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all" disabled={!consumoForm.productoId}>
                                                    Agregar Consumo
                                                </button>
                                            </form>
                                        )}

                                        <div className="max-h-48 overflow-y-auto custom-scrollbar rounded-2xl border border-slate-50">
                                            <table className="min-w-full divide-y divide-slate-100">
                                                <thead className="bg-slate-50/50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                                                        <th className="px-4 py-2 text-center text-[8px] font-black text-gray-400 uppercase tracking-widest">Cant.</th>
                                                        <th className="px-4 py-2 text-right text-[8px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-50">
                                                    {consumos.map((c, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-2 text-[11px] font-bold text-gray-700">{c.producto_nombre}</td>
                                                            <td className="px-4 py-2 text-center text-[11px] font-black text-blue-400">{c.cantidad}x</td>
                                                            <td className="px-4 py-2 text-right text-[11px] font-black text-gray-800">${formatCurrency(c.cantidad * c.precio)}</td>
                                                        </tr>
                                                    ))}
                                                    {consumos.length === 0 && (
                                                        <tr>
                                                            <td colSpan="3" className="px-4 py-10 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest opacity-50">
                                                                Sin consumos registrados
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
                    {isEditing ? (
                        <>
                            <button 
                                onClick={() => setIsEditing(false)} 
                                className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95"
                            >
                                Guardar Cambios
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-3">
                            {details?.estado === 'activa' && (
                                <button 
                                    onClick={handleCheckout}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95"
                                >
                                    Check-out
                                </button>
                            )}
                            <button 
                                onClick={onClose} 
                                className="bg-white border-2 border-slate-200 text-slate-600 px-10 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetallesRegistroModal;
