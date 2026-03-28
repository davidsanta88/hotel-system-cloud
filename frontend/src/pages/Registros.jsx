import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { Plus, CheckCircle, XCircle, Search, Eye, Edit, Trash2, Phone, MessageCircle, Info } from 'lucide-react';
import RegistroModal from '../components/modals/RegistroModal';
import { formatCurrency, cleanNumericValue } from '../utils/format';

const Registros = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [registros, setRegistros] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [mediosPago, setMediosPago] = useState([]);
    const [tiposRegistro, setTiposRegistro] = useState([]);
    const [clienteSearch, setClienteSearch] = useState('');
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRegistroDetails, setSelectedRegistroDetails] = useState(null);
    const [consumos, setConsumos] = useState([]);
    const [showConsumoForm, setShowConsumoForm] = useState(false);
    const [productos, setProductos] = useState([]);
    const [selectedProducto, setSelectedProducto] = useState('');
    const [cantidadConsumo, setCantidadConsumo] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [guestEditForm, setGuestEditForm] = useState({ 
        nombre: '', 
        documento: '', 
        tipo_documento: 'CC', 
        telefono: '', 
        email: '', 
        municipio_origen_id: '' 
    });
    
    // New state for Abonos
    const [abonos, setAbonos] = useState([]);
    const [showAbonoForm, setShowAbonoForm] = useState(false);
    const [abonoForm, setAbonoForm] = useState({ monto: '', medio: '', notas: '' });
    
    // Form state
    const [formData, setFormData] = useState({
        habitacion_id: '',
        fecha_ingreso: '',
        fecha_salida: '',
        total: '',
        medio_pago_id: '',
        valor_cobrado: '',
        notas: '',
        tipo_registro_id: ''
    });

    const [huespedesList, setHuespedesList] = useState([]);
    const [guestForm, setGuestForm] = useState({ 
        nombre: '', 
        documento: '', 
        tipo_documento: 'CC', 
        telefono: '', 
        email: '', 
        municipio_origen_id: '' 
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const roomToSelect = searchParams.get('habitacionId');
        const isNew = searchParams.get('nueva');
        const roomToView = searchParams.get('habitacion');
        const verPagos = searchParams.get('verPagos');
        
        if (isNew === 'true' && roomToSelect && habitaciones.length > 0) {
            const fechaIn = format(new Date(), 'yyyy-MM-dd');
            const fechaOut = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
            
            setFormData(prev => ({ 
                ...prev, 
                habitacion_id: roomToSelect,
                fecha_ingreso: fechaIn,
                fecha_salida: fechaOut
            }));
            
            setShowModal(true);
            
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('nueva');
            newSearchParams.delete('habitacionId');
            setSearchParams(newSearchParams);
        } else if (verPagos === 'true' && roomToView && registros.length > 0) {
            const registro = registros.find(r => String(r.numero_habitacion) === String(roomToView) && r.estado === 'activa');
            if (registro) {
                handleViewDetails(registro.id);
            }
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('verPagos');
            newSearchParams.delete('habitacion');
            setSearchParams(newSearchParams);
        }
    }, [habitaciones, registros, searchParams, setSearchParams]);

    const fetchData = async () => {
        try {
            const [resRegistros, resHab, resClientes, resMuni, resMedios, resProd, resTipos] = await Promise.all([
                api.get('/registros'),
                api.get('/habitaciones'),
                api.get('/clientes'),
                api.get('/municipios'),
                api.get('/medios-pago'),
                api.get('/productos'),
                api.get('/tipos-registro')
            ]);
            setRegistros(resRegistros.data);
            setHabitaciones(resHab.data);
            setClientes(resClientes.data);
            setMunicipios(resMuni.data);
            setMediosPago(resMedios.data);
            setProductos(resProd.data);
            setTiposRegistro(resTipos.data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, estado) => {
        try {
            await api.put(`/registros/${id}`, { estado });
            Swal.fire('Actualizado', `Registro marcado como ${estado}`, 'success');
            if (showDetailsModal && selectedRegistroDetails?.id === id) {
                const resDet = await api.get(`/registros/${id}`);
                setSelectedRegistroDetails(resDet.data);
            }
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
        }
    };

    const handleCheckout = async (id) => {
        const result = await Swal.fire({
            title: '¿Confirmar Check-out?',
            text: "La habitación pasará a estado 'Pendiente por asear'.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, finalizar estancia',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // Check if there is a remaining balance
                if (selectedRegistroDetails && (selectedRegistroDetails.total + consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0) - (selectedRegistroDetails.valor_pagado || 0) > 0)) {
                    const balanceResult = await Swal.fire({
                        title: 'Saldo Pendiente',
                        text: "El huésped aún tiene un saldo por pagar. ¿Desea continuar con el checkout de todos modos?",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#ef4444',
                        confirmButtonText: 'Sí, continuar',
                        cancelButtonText: 'Ir a pagos'
                    });
                    if (!balanceResult.isConfirmed) return;
                }

                Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                await api.put(`/registros/checkout/${id}`);
                Swal.fire('Éxito', 'Check-out realizado. Habitación lista para aseo.', 'success');
                fetchData();
                if (showDetailsModal) setShowDetailsModal(false);
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo procesar el check-out', 'error');
            }
        }
    };

    const handleUpdateSave = async () => {
        try {
            if (editData.huespedes.length === 0) {
                return Swal.fire('Atención', 'Debe haber al menos un huésped', 'warning');
            }
            
            Swal.fire({ title: 'Procesando...', text: 'Actualizando registro, por favor espere...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            const processedHuespedesIds = [];
            for (const h of editData.huespedes) {
                if (h.id || h._id) {
                    processedHuespedesIds.push(h.id || h._id);
                } else {
                    const existing = clientes.find(c => c.documento === h.documento);
                    if (existing && (existing.id || existing._id)) {
                        processedHuespedesIds.push(existing.id || existing._id);
                    } else {
                        const res = await api.post('/clientes', h);
                        processedHuespedesIds.push(res.data.id || res.data._id);
                    }
                }
            }

            const dataToUpdate = {
                ...editData,
                cliente_id: processedHuespedesIds[0],
                huespedes: processedHuespedesIds,
                observaciones: editData.notas
            };
            
            await api.put(`/registros/${selectedRegistroDetails.id}`, dataToUpdate);
            
            Swal.close();
            Swal.fire('Éxito', 'Registro actualizado correctamente', 'success');
            setIsEditing(false);
            const resDet = await api.get(`/registros/${selectedRegistroDetails.id}`);
            setSelectedRegistroDetails(resDet.data);
            fetchData();
        } catch (error) {
            Swal.close();
            Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar el registro', 'error');
        }
    };

    const handleViewDetails = async (id) => {
        try {
            const [resDet, resCons, resAbonos] = await Promise.all([
                api.get(`/registros/${id}`),
                api.get(`/ventas/consumo/${id}`),
                api.get(`/registros/${id}/pagos`)
            ]);
            setSelectedRegistroDetails(resDet.data);
            setConsumos(resCons.data);
            setAbonos(resAbonos.data);
            setIsEditing(false);
            setShowDetailsModal(true);
            setShowAbonoForm(false);
            setAbonoForm({ monto: '', medio: '', notas: '' });
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los detalles del registro.', 'error');
        }
    };

    const handleAddAbono = async (e) => {
        e.preventDefault();
        try {
            if (!abonoForm.monto || !abonoForm.medio) {
                return Swal.fire('Atención', 'Monto y medio de pago son obligatorios', 'warning');
            }
            
            await api.post(`/registros/${selectedRegistroDetails.id}/pagos`, abonoForm);
            
            const [resAbonos, resDet] = await Promise.all([
                api.get(`/registros/${selectedRegistroDetails.id}/pagos`),
                api.get(`/registros/${selectedRegistroDetails.id}`)
            ]);
            
            setAbonos(resAbonos.data);
            setSelectedRegistroDetails(resDet.data);
            setShowAbonoForm(false);
            setAbonoForm({ monto: '', medio: '', notas: '' });
            fetchData();
            
            Swal.fire({ icon: 'success', title: 'Abono registrado', timer: 1500, showConfirmButton: false });
        } catch (error) {
            Swal.fire('Error', 'No se pudo registrar el abono', 'error');
        }
    };

    const handleDeleteAbono = async (pagoId) => {
        const result = await Swal.fire({
            title: '¿Eliminar abono?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/registros/${selectedRegistroDetails.id}/pagos/${pagoId}`);
                
                const [resAbonos, resDet] = await Promise.all([
                    api.get(`/registros/${selectedRegistroDetails.id}/pagos`),
                    api.get(`/registros/${selectedRegistroDetails.id}`)
                ]);
                
                setAbonos(resAbonos.data);
                setSelectedRegistroDetails(resDet.data);
                fetchData();
                
                Swal.fire('Eliminado', 'El abono ha sido eliminado', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el abono', 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: "Esta acción eliminará el registro permanentemente y liberará la habitación si está activa.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                Swal.fire({ title: 'Eliminando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                await api.delete(`/registros/${id}`);
                Swal.fire('Eliminado', 'El registro ha sido eliminado correctamente.', 'success');
                fetchData();
            }
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el registro', 'error');
        }
    };

    const startEditing = () => {
        setEditData({
            habitacion_id: selectedRegistroDetails.habitacion_id,
            fecha_ingreso: selectedRegistroDetails.fecha_ingreso.split('T')[0],
            fecha_salida: selectedRegistroDetails.fecha_salida.split('T')[0],
            total: selectedRegistroDetails.total,
            medio_pago_id: selectedRegistroDetails.medio_pago_id || '',
            valor_cobrado: selectedRegistroDetails.valor_cobrado,
            notas: selectedRegistroDetails.notas || '',
            estado: selectedRegistroDetails.estado,
            tipo_registro_id: selectedRegistroDetails.tipo_registro_id || '',
            huespedes: [...selectedRegistroDetails.huespedes]
        });
        setIsEditing(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        let newData = { ...editData, [name]: value };
        
        if (name === 'habitacion_id' || name === 'fecha_ingreso' || name === 'fecha_salida') {
            const hab = habitaciones.find(h => String(h.id || h._id) === String(newData.habitacion_id));
            if (hab && newData.fecha_ingreso && newData.fecha_salida) {
                const inDate = new Date(newData.fecha_ingreso);
                const outDate = new Date(newData.fecha_salida);
                if (outDate >= inDate) {
                    const diffTime = outDate - inDate;
                    const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
                    const numPersonas = Math.min(Math.max(newData.huespedes.length, 1), 6);
                    const pNoche = parseFloat(hab[`precio_${numPersonas}`]) || parseFloat(hab.precio_1) || 0;
                    const rawTotal = (pNoche * diffDays);
                    newData.total = rawTotal.toFixed(2);
                    newData.valor_cobrado = rawTotal.toFixed(2);
                }
            }
        }
        setEditData(newData);
    };

    const handleAddGuestEdit = () => {
        if (!guestEditForm.nombre || !guestEditForm.documento) return;
        const newList = [...editData.huespedes, guestEditForm];
        
        const hab = habitaciones.find(h => String(h.id || h._id) === String(editData.habitacion_id));
        if (hab && editData.fecha_ingreso && editData.fecha_salida) {
            const inDate = new Date(editData.fecha_ingreso);
            const outDate = new Date(editData.fecha_salida);
            const diffDays = Math.max(Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)), 1);
            const numPersonas = Math.min(Math.max(newList.length, 1), 6);
            const pNoche = parseFloat(hab[`precio_${numPersonas}`]) || parseFloat(hab.precio_1) || 0;
            const rawTotal = (pNoche * diffDays);
            setEditData({ ...editData, huespedes: newList, total: rawTotal.toFixed(2), valor_cobrado: rawTotal.toFixed(2) });
        } else {
            setEditData({ ...editData, huespedes: newList });
        }
        setGuestEditForm({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '' });
    };

    const handleRemoveGuestEdit = (index) => {
        const newList = editData.huespedes.filter((_, i) => i !== index);
        const hab = habitaciones.find(h => String(h.id || h._id) === String(editData.habitacion_id));
        if (hab && editData.fecha_ingreso && editData.fecha_salida) {
            const inDate = new Date(editData.fecha_ingreso);
            const outDate = new Date(editData.fecha_salida);
            const diffDays = Math.max(Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)), 1);
            const numPersonas = Math.min(Math.max(newList.length, 1), 6);
            const pNoche = parseFloat(hab[`precio_${numPersonas}`]) || parseFloat(hab.precio_1) || 0;
            const rawTotal = (pNoche * diffDays);
            setEditData({ ...editData, huespedes: newList, total: rawTotal.toFixed(2), valor_cobrado: rawTotal.toFixed(2) });
        } else {
            setEditData({ ...editData, huespedes: newList });
        }
    };

    const handleAddConsumo = async () => {
        if (!selectedProducto || !cantidadConsumo) return;
        const prod = productos.find(p => p.id === parseInt(selectedProducto));
        
        try {
            await api.post('/ventas/consumo', {
                registro_id: selectedRegistroDetails.id,
                productos: [{
                    id: prod.id,
                    cantidad: parseInt(cantidadConsumo),
                    precio: prod.precio
                }]
            });
            
            Swal.fire('Éxito', 'Consumo registrado', 'success');
            
            const [resCons, resProd, resDet] = await Promise.all([
                api.get(`/ventas/consumo/${selectedRegistroDetails.id}`),
                api.get('/productos'),
                api.get(`/registros/${selectedRegistroDetails.id}`)
            ]);
            setConsumos(resCons.data);
            setProductos(resProd.data);
            setSelectedRegistroDetails(resDet.data);
            setShowConsumoForm(false);
            setSelectedProducto('');
            setCantidadConsumo(1);
        } catch (error) {
            Swal.fire('Error', 'No se pudo registrar el consumo', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registro de Huéspedes</h1>
                    <p className="text-sm text-gray-500">Gestione los ingresos y el alojamiento diario</p>
                </div>
                <button onClick={() => {
                    setFormData({ habitacion_id: '', fecha_ingreso: '', fecha_salida: '', total: '', medio_pago_id: '', valor_cobrado: '', notas: '', tipo_registro_id: '' });
                    setHuespedesList([]);
                    setShowModal(true);
                }} className="btn-primary flex items-center space-x-2">
                    <Plus size={18} />
                    <span>Nuevo Registro</span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="text-center p-8 text-gray-400">Cargando registros...</div>
                ) : (
                    <div className="card overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Huésped</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hab.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Alojamiento</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Abonado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Saldo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {registros.map((res) => {
                                    const saldo = (res.total || 0) - (res.valor_pagado || 0);
                                    return (
                                        <tr key={res.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900 uppercase">{res.nombre_cliente}</div>
                                                {res.telefono_cliente && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="text-xs text-blue-600 flex items-center gap-1">
                                                            <Phone size={10} /> {res.telefono_cliente}
                                                        </div>
                                                        <a 
                                                            href={`https://wa.me/${res.telefono_cliente.replace(/\D/g, '')}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-green-500 hover:text-green-600 transition-colors"
                                                            title="Contactar por WhatsApp"
                                                        >
                                                            <MessageCircle size={14} />
                                                        </a>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{res.numero_habitacion}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(res.fecha_ingreso), 'dd/MM/yyyy')} - {format(new Date(res.fecha_salida), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="font-bold text-gray-700 text-sm">${formatCurrency(res.total)}</div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase">{res.tipo_registro_nombre || 'Formal'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="font-bold text-emerald-600 text-sm">${formatCurrency(res.valor_pagado)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className={`font-black text-sm ${saldo > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    ${formatCurrency(saldo)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase
                                                    ${res.estado === 'activa' ? 'bg-green-100 text-green-800' : 
                                                      res.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                      res.estado === 'completada' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {res.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleViewDetails(res.id)} className="text-gray-500 hover:text-gray-900 mx-1" title="Ver Detalles">
                                                    <Eye size={18} />
                                                </button>
                                                {res.estado === 'activa' && (
                                                    <button onClick={() => { handleViewDetails(res.id); setTimeout(() => setShowAbonoForm(true), 100); }} className="text-emerald-600 hover:text-emerald-900 mx-1" title="Registrar Pago / Abono">
                                                        <CreditCard size={18} />
                                                    </button>
                                                )}
                                                {res.estado === 'pendiente' && (
                                                    <>
                                                        <button onClick={() => updateStatus(res.id, 'activa')} className="text-green-600 hover:text-green-900 mx-1" title="Check-in">
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button onClick={() => updateStatus(res.id, 'cancelada')} className="text-red-600 hover:text-red-900 mx-1" title="Cancelar">
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {res.estado === 'activa' && (
                                                    <button onClick={() => handleCheckout(res.id)} className="text-blue-600 hover:text-blue-900 mx-1 font-bold text-[10px] uppercase border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 transition-colors" title="Realizar Check-out">
                                                        SALIDA
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(res.id)} className="text-red-300 hover:text-red-600 mx-1" title="Eliminar Registro">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {registros.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                                            No hay registros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <RegistroModal 
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                initialHabitacionId={formData.habitacion_id}
                onSuccess={() => {
                    fetchData();
                    setShowModal(false);
                }}
            />

            {showDetailsModal && selectedRegistroDetails && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl w-full max-w-4xl m-4">
                        <div className="flex justify-between items-center mb-6 border-b pb-2">
                            <h2 className="text-2xl font-bold text-gray-800 truncate">Detalles Registro #{selectedRegistroDetails.id}</h2>
                            <div className="flex items-center gap-2">
                                {!isEditing && (
                                    <button onClick={startEditing} className="flex items-center gap-1 bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors border border-primary-200">
                                        <Edit size={16} />
                                        <span className="text-xs font-bold uppercase">Editar</span>
                                    </button>
                                )}
                                <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase
                                    ${selectedRegistroDetails.estado === 'activa' ? 'bg-green-100 text-green-800' : 
                                    selectedRegistroDetails.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                    selectedRegistroDetails.estado === 'completada' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {selectedRegistroDetails.estado}
                                </span>
                            </div>
                        </div>

                        {!isEditing && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Total Estancia</div>
                                    <div className="text-lg font-black text-gray-800">${formatCurrency(selectedRegistroDetails.total)}</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                    <div className="text-[10px] font-bold text-blue-400 uppercase mb-0.5">Consumos</div>
                                    <div className="text-lg font-black text-blue-800">
                                        ${formatCurrency(consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0))}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                    <div className="text-[10px] font-bold text-emerald-400 uppercase mb-0.5">Abonado</div>
                                    <div className="text-lg font-black text-emerald-800">
                                        ${formatCurrency(selectedRegistroDetails.valor_pagado || 0)}
                                    </div>
                                </div>
                                <div className={`p-3 rounded-xl border ${ (selectedRegistroDetails.total + consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0) - (selectedRegistroDetails.valor_pagado || 0) > 0) ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Saldo</div>
                                    <div className={`text-lg font-black ${(selectedRegistroDetails.total + consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0) - (selectedRegistroDetails.valor_pagado || 0) > 0) ? 'text-red-600' : 'text-green-600'}`}>
                                        ${formatCurrency(Math.max(0, selectedRegistroDetails.total + consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0) - (selectedRegistroDetails.valor_pagado || 0)))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-700 border-b pb-1 mb-4 text-sm uppercase flex items-center gap-2">
                                        <Info size={14} className="text-gray-400" /> Información General
                                    </h3>
                                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                                        <div>
                                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Habitación</span>
                                            <span className="font-bold text-gray-800">#{selectedRegistroDetails.numero_habitacion}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Huésped Titular</span>
                                            <span className="font-bold text-gray-800 truncate block">{selectedRegistroDetails.nombre_cliente}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Check-in</span>
                                            <span className="font-bold text-gray-800">{format(new Date(selectedRegistroDetails.fecha_ingreso), 'dd/MM/yyyy')}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Check-out (Est.)</span>
                                            <span className="font-bold text-gray-800">{format(new Date(selectedRegistroDetails.fecha_salida), 'dd/MM/yyyy')}</span>
                                        </div>
                                    </div>
                                </div>

                                {!isEditing && (
                                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase">
                                                <Plus size={14} className="text-emerald-500" /> Historial Abonos
                                            </h3>
                                            <button 
                                                onClick={() => setShowAbonoForm(!showAbonoForm)}
                                                className="text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                {showAbonoForm ? 'Cerrar' : '+ Nuevo'}
                                            </button>
                                        </div>

                                        {showAbonoForm && (
                                            <form onSubmit={handleAddAbono} className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mb-4 space-y-3 animate-fade-in">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Monto ($)</label>
                                                        <input 
                                                            type="text" 
                                                            className="input-field text-sm bg-white" 
                                                            value={formatCurrency(abonoForm.monto)}
                                                            onChange={e => setAbonoForm({...abonoForm, monto: cleanNumericValue(e.target.value)})}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Medio</label>
                                                        <select 
                                                            className="input-field text-sm bg-white"
                                                            value={abonoForm.medio}
                                                            onChange={e => setAbonoForm({...abonoForm, medio: e.target.value})}
                                                        >
                                                            <option value="">...</option>
                                                            {mediosPago.map(mp => (
                                                                <option key={mp.id} value={mp.nombre}>{mp.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder="Notas (opcional)"
                                                    className="input-field text-sm bg-white"
                                                    value={abonoForm.notas}
                                                    onChange={e => setAbonoForm({...abonoForm, notas: e.target.value})}
                                                />
                                                <button type="submit" className="bg-emerald-600 text-white w-full py-2 rounded-lg font-bold text-xs uppercase hover:bg-emerald-700 transition-colors">
                                                    Registrar
                                                </button>
                                            </form>
                                        )}

                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {abonos.map((a, i) => (
                                                <div key={a._id || i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                                    <div>
                                                        <div className="font-bold text-gray-800 text-sm">${formatCurrency(a.monto)}</div>
                                                        <div className="text-[10px] text-gray-500 font-medium">
                                                            {a.medio} • {format(new Date(a.fecha), 'dd/MM HH:mm')}
                                                        </div>
                                                        <div className="text-[9px] text-gray-400 italic">{a.usuario_nombre} {a.notas ? `| ${a.notas}` : ''}</div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteAbono(a._id || a.id)}
                                                        className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {abonos.length === 0 && (
                                                <div className="text-center py-6 text-gray-400 italic text-xs border border-dashed border-gray-200 rounded-lg">
                                                    Sin abonos
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                    <h3 className="font-bold text-gray-700 border-b pb-1 mb-4 text-sm uppercase flex items-center gap-2">
                                        <Info size={14} className="text-gray-400" /> Alojamiento y Pagos
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <span className="text-gray-400 block font-bold uppercase text-[9px]">Valor Real a Cobrar (Total)</span>
                                            {isEditing ? (
                                                <div className="relative mt-1">
                                                    <DollarSign className="absolute left-2 top-1.5 text-gray-400" size={10} />
                                                    <input 
                                                        type="text" 
                                                        name="total" 
                                                        className="input-field py-1 pl-6 bg-white border-primary-200 focus:ring-primary-500/20 font-black text-sm" 
                                                        value={formatCurrency(editData.total)} 
                                                        onChange={handleEditFormChange} 
                                                    />
                                                </div>
                                            ) : (
                                                <span className="font-black text-gray-900 text-lg">${formatCurrency(selectedRegistroDetails.total)}</span>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-400 block font-bold uppercase text-[9px]">Medio Cobro</span>
                                            <span className="font-bold text-gray-900 uppercase">{selectedRegistroDetails.medio_pago_nombre || 'No asignado'}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Valor Estancia (Hab.):</span>
                                            <span className="font-bold">${formatCurrency(selectedRegistroDetails.total)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Total Consumos:</span>
                                            <span className="font-bold">${formatCurrency(consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0))}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-300">
                                            <span className="text-xs font-black text-primary-700 uppercase">Total General:</span>
                                            <span className="text-lg font-black text-primary-700">
                                                ${formatCurrency(parseFloat(selectedRegistroDetails.valor_cobrado) + consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-gray-400 block font-bold uppercase text-[9px] mb-1">Notas</span>
                                        {isEditing ? (
                                            <textarea name="notas" className="input-field py-1 bg-white" rows="2" value={editData.notas} onChange={handleEditFormChange}></textarea>
                                        ) : (
                                            <p className="text-[11px] text-gray-600 italic leading-tight">{selectedRegistroDetails.notas || 'Sin notas'}</p>
                                        )}
                                    </div>
                                </div>

                                {!isEditing && (
                                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase">
                                                <Info size={14} className="text-blue-500" /> Consumos Extras
                                            </h3>
                                            <button 
                                                onClick={() => setShowConsumoForm(!showConsumoForm)}
                                                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                {showConsumoForm ? 'Cerrar' : '+ Nuevo'}
                                            </button>
                                        </div>
                                        
                                        {showConsumoForm && (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 animate-fade-in space-y-3">
                                                <div className="grid grid-cols-12 gap-2">
                                                    <div className="col-span-8">
                                                        <select className="input-field text-xs bg-white py-1.5" value={selectedProducto} onChange={e => setSelectedProducto(e.target.value)}>
                                                            <option value="">Producto...</option>
                                                            {productos.filter(p => p.stock > 0 && p.tipo_inventario === 'venta').map(p => (
                                                                <option key={p.id} value={p.id}>{p.nombre} (${formatCurrency(p.precio)})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-4">
                                                        <input type="number" min="1" className="input-field text-xs bg-white py-1.5" value={cantidadConsumo} onChange={e => setCantidadConsumo(e.target.value)} />
                                                    </div>
                                                </div>
                                                <button onClick={handleAddConsumo} disabled={!selectedProducto} className="btn-primary w-full py-2 text-xs uppercase font-bold">Agregar Consumo</button>
                                            </div>
                                        )}

                                        <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100">
                                            <table className="min-w-full divide-y divide-gray-200 text-[10px]">
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {consumos.map((c, i) => (
                                                        <tr key={i}>
                                                            <td className="px-3 py-2 text-gray-900">{c.producto_nombre}</td>
                                                            <td className="px-3 py-2 text-center text-gray-500">{c.cantidad}x</td>
                                                            <td className="px-3 py-2 text-right font-bold">${formatCurrency(c.cantidad * c.precio)}</td>
                                                        </tr>
                                                    ))}
                                                    {consumos.length === 0 && (
                                                        <tr><td colSpan="3" className="px-3 py-4 text-center text-gray-400 italic">Sin consumos</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="btn-secondary px-6">Cancelar</button>
                                    <button onClick={handleUpdateSave} className="btn-primary px-8">Guardar</button>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    {selectedRegistroDetails.estado === 'activa' && (
                                        <button onClick={() => handleCheckout(selectedRegistroDetails.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase transition-colors">
                                            Check-out
                                        </button>
                                    )}
                                    <button onClick={() => setShowDetailsModal(false)} className="btn-secondary px-8">Cerrar</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Registros;
