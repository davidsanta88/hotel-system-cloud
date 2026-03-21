import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { Plus, CheckCircle, XCircle, Search, Eye, Edit } from 'lucide-react';
import { formatCurrency, cleanNumericValue } from '../utils/format';
import useTableData from '../hooks/useTableData';
import Pagination from '../components/common/Pagination';

const Registros = () => {
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

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (huespedesList.length === 0) {
                return Swal.fire('Atención', 'Debe agregar al menos un huésped al registro', 'warning');
            }
            const dataToSave = {
                ...formData,
                huespedes: huespedesList
            };
            await api.post('/registros', dataToSave);
            Swal.fire('Éxito', 'Registro creado', 'success');
            setShowModal(false);
            fetchData();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
        }
    };

    const updateStatus = async (id, estado) => {
        try {
            await api.put(`/registros/${id}`, { estado });
            Swal.fire('Actualizado', `Registro marcado como ${estado}`, 'success');
            if (showDetailsModal) {
                const resDet = await api.get(`/registros/${id}`);
                setSelectedRegistroDetails(resDet.data);
            }
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
        }
    };

    const handleUpdateSave = async () => {
        try {
            if (editData.huespedes.length === 0) {
                return Swal.fire('Atención', 'Debe haber al menos un huésped', 'warning');
            }
            await api.put(`/registros/${selectedRegistroDetails.id}`, editData);
            Swal.fire('Exito', 'Registro actualizado correctamente', 'success');
            setIsEditing(false);
            const resDet = await api.get(`/registros/${selectedRegistroDetails.id}`);
            setSelectedRegistroDetails(resDet.data);
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el registro', 'error');
        }
    };

    const handleViewDetails = async (id) => {
        try {
            const [resDet, resCons] = await Promise.all([
                api.get(`/registros/${id}`),
                api.get(`/ventas/consumo/${id}`)
            ]);
            setSelectedRegistroDetails(resDet.data);
            setConsumos(resCons.data);
            setIsEditing(false);
            setShowDetailsModal(true);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los detalles del registro.', 'error');
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
            // Recalculate total for edit mode
            const hab = habitaciones.find(h => h.id === parseInt(newData.habitacion_id));
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
        setEditData({ ...editData, huespedes: newList });
        setGuestEditForm({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '' });
        
        // Trigger total recalculation by calling handleEditFormChange with a dummy event or manual update
        const hab = habitaciones.find(h => h.id === parseInt(editData.habitacion_id));
        if (hab && editData.fecha_ingreso && editData.fecha_salida) {
            const inDate = new Date(editData.fecha_ingreso);
            const outDate = new Date(editData.fecha_salida);
            const diffDays = Math.max(Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)), 1);
            const numPersonas = Math.min(Math.max(newList.length, 1), 6);
            const pNoche = parseFloat(hab[`precio_${numPersonas}`]) || parseFloat(hab.precio_1) || 0;
            const rawTotal = (pNoche * diffDays);
            setEditData(prev => ({ ...prev, huespedes: newList, total: rawTotal.toFixed(2), valor_cobrado: rawTotal.toFixed(2) }));
        }
    };

    const handleRemoveGuestEdit = (index) => {
        const newList = editData.huespedes.filter((_, i) => i !== index);
        const hab = habitaciones.find(h => h.id === parseInt(editData.habitacion_id));
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
            
            // Recargar consumos y productos (para stock)
            const [resCons, resProd] = await Promise.all([
                api.get(`/ventas/consumo/${selectedRegistroDetails.id}`),
                api.get('/productos')
            ]);
            setConsumos(resCons.data);
            setProductos(resProd.data);
            setShowConsumoForm(false);
            setSelectedProducto('');
            setCantidadConsumo(1);
        } catch (error) {
            Swal.fire('Error', 'No se pudo registrar el consumo', 'error');
        }
    };

    const calculateTotal = (habId, fechaIn, fechaOut, listLength = huespedesList.length) => {
        if (!habId || !fechaIn || !fechaOut) return;
        const hab = habitaciones.find(h => h.id === parseInt(habId));
        if (!hab) return;
        
        const inDate = new Date(fechaIn);
        const outDate = new Date(fechaOut);
        
        // Ensure outDate >= inDate
        if (outDate < inDate) return;

        const diffTime = outDate - inDate;
        const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1); // Al menos 1 noche
        
        // Determinar precio según cantidad de personas (1 a 6)
        const numPersonas = Math.min(Math.max(listLength, 1), 6);
        const pNoche = parseFloat(hab[`precio_${numPersonas}`]) || parseFloat(hab.precio_1) || 0;
        
        const rawTotal = (pNoche * diffDays);
        setFormData(prev => ({ 
            ...prev, 
            total: rawTotal.toFixed(2),
            valor_cobrado: rawTotal.toFixed(2) // Por defecto el valor cargado es el mismo total
        }));
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        
        let newFormData = { ...formData, [name]: value };
        
        // Date validation
        if (name === 'fecha_ingreso' && newFormData.fecha_salida) {
            if (new Date(value) > new Date(newFormData.fecha_salida)) {
                newFormData.fecha_salida = value; 
            }
        }
        if (name === 'fecha_salida' && newFormData.fecha_ingreso) {
            if (new Date(value) < new Date(newFormData.fecha_ingreso)) {
                Swal.fire('Advertencia', 'La fecha de check-out no puede ser anterior al check-in.', 'warning');
                return; 
            }
        }

        setFormData(newFormData);
        
        if (name === 'habitacion_id' || name === 'fecha_ingreso' || name === 'fecha_salida') {
            calculateTotal(newFormData.habitacion_id, newFormData.fecha_ingreso, newFormData.fecha_salida);
        }
    };

    const handleClienteSelect = (cliente) => {
        setSelectedCliente(cliente);
        setGuestForm({
            id: cliente.id,
            nombre: cliente.nombre,
            documento: cliente.documento,
            tipo_documento: cliente.tipo_documento || 'CC',
            telefono: cliente.telefono || '',
            email: cliente.email || '',
            municipio_origen_id: cliente.municipio_origen_id || ''
        });
        setClienteSearch('');
    };

    const handleAddGuest = () => {
        if (!guestForm.nombre || !guestForm.documento) {
            return Swal.fire('Error', 'El nombre y documento del huésped son obligatorios', 'error');
        }
        if (huespedesList.find(h => h.documento === guestForm.documento)) {
            return Swal.fire('Error', 'Este huésped ya está en la lista', 'error');
        }
        
        const newList = [...huespedesList, guestForm];
        setHuespedesList(newList);
        calculateTotal(formData.habitacion_id, formData.fecha_ingreso, formData.fecha_salida, newList.length);
        
        setGuestForm({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '' });
        setSelectedCliente(null);
    };

    const handleRemoveGuest = (index) => {
        const newList = huespedesList.filter((_, i) => i !== index);
        setHuespedesList(newList);
        calculateTotal(formData.habitacion_id, formData.fecha_ingreso, formData.fecha_salida, newList.length);
    };

    const filteredClientes = clienteSearch.length > 0 
        ? clientes.filter(c => c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) || c.documento.includes(clienteSearch))
        : [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registro de Huéspedes</h1>
                    <p className="text-sm text-gray-500">Gestione los ingresos y el alojamiento diario</p>
                </div>
                <button onClick={() => {
                    setFormData({ habitacion_id: '', fecha_ingreso: '', fecha_salida: '', total: '', medio_pago_id: '', valor_cobrado: '', valor_pagado: '', tipo_registro_id: '' });
                    setHuespedesList([]);
                    setGuestForm({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '' });
                    setSelectedCliente(null);
                    setClienteSearch('');
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {registros.map((res) => (
                                    <tr key={res.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{res.nombre_cliente}</div>
                                            <div className="text-sm text-gray-500">ID: {res.id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{res.numero_habitacion}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(res.fecha_ingreso), 'dd/MM/yyyy')} - {format(new Date(res.fecha_salida), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="font-medium text-gray-900">${formatCurrency(res.total)}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">{res.tipo_registro_nombre || 'Formal'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
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
                                                <button onClick={() => updateStatus(res.id, 'completada')} className="text-blue-600 hover:text-blue-900 mx-1" title="Check-out">
                                                    Check-out
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {registros.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                                            No hay registros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 mt-12 pb-12">
                    <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">Nuevo Registro</h2>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Cliente details */}
                            <div className="col-span-1 md:col-span-2 flex justify-between items-center border-b pb-2">
                                <h3 className="font-semibold text-gray-700">Participantes del Registro</h3>
                            </div>
                            
                            {/* Buscar cliente */}
                            <div className="col-span-1 md:col-span-2 relative">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Buscar cliente existente (Nombre o Documento)..." 
                                        className="input-field pl-10 bg-gray-50 border-gray-300"
                                        value={clienteSearch}
                                        onChange={(e) => setClienteSearch(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                                </div>
                                {clienteSearch.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredClientes.length > 0 ? (
                                            filteredClientes.map(cliente => (
                                                <div 
                                                    key={cliente.id} 
                                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                                    onClick={() => handleClienteSelect(cliente)}
                                                >
                                                    <div className="font-medium text-gray-800">{cliente.nombre}</div>
                                                    <div className="text-sm text-gray-500">Doc: {cliente.documento}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-sm text-gray-500 text-center">No encontrado. Ingresa los datos abajo para nuevo registro.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Guest entry form */}
                            <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                    <div className="sm:col-span-4">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Completo *</label>
                                        <input type="text" className="input-field text-sm" value={guestForm.nombre} onChange={e => setGuestForm({...guestForm, nombre: e.target.value})} />
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo Doc.</label>
                                        <select className="input-field text-sm" value={guestForm.tipo_documento} onChange={e => setGuestForm({...guestForm, tipo_documento: e.target.value})}>
                                            <option value="CC">Cédula</option>
                                            <option value="CE">Extranjería</option>
                                            <option value="PASAPORTE">Pasaporte</option>
                                            <option value="TI">T. Identidad</option>
                                            <option value="NIT">NIT</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Documento *</label>
                                        <input type="text" className="input-field text-sm" value={guestForm.documento} onChange={e => setGuestForm({...guestForm, documento: e.target.value})} />
                                    </div>
                                    
                                    <div className="sm:col-span-3">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
                                        <input type="text" className="input-field text-sm" value={guestForm.telefono} onChange={e => setGuestForm({...guestForm, telefono: e.target.value})} />
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                        <input type="email" className="input-field text-sm" value={guestForm.email} onChange={e => setGuestForm({...guestForm, email: e.target.value})} />
                                    </div>
                                    <div className="sm:col-span-5">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Lugar Origen</label>
                                        <div className="flex gap-2 items-center">
                                            <select className="input-field text-sm flex-1" value={guestForm.municipio_origen_id} onChange={e => setGuestForm({...guestForm, municipio_origen_id: e.target.value})}>
                                                <option value="">Seleccione...</option>
                                                {municipios.filter(m => m.visualizar).map(m => (
                                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                                ))}
                                            </select>
                                            <button type="button" onClick={handleAddGuest} className="bg-primary-600 text-white p-2.5 rounded-md hover:bg-primary-700 transition shadow-sm h-[38px] flex items-center justify-center shrink-0" title="Añadir al registro">
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {selectedCliente && (
                                    <div className="mt-3 text-xs text-blue-600 flex justify-between items-center px-1">
                                        <span className="font-medium flex items-center gap-1"><CheckCircle size={14}/> Cliente cargado de la base de datos</span>
                                        <button type="button" onClick={() => { setSelectedCliente(null); setGuestForm({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '' }); }} className="hover:underline text-gray-500">Limpiar</button>
                                    </div>
                                )}
                            </div>

                            {/* Added Guests List */}
                            <div className="col-span-1 md:col-span-2 mt-2">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Lista de Participantes ({huespedesList.length})</h4>
                                {huespedesList.length === 0 ? (
                                    <div className="text-sm text-gray-500 italic p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center flex flex-col items-center gap-2">
                                        <span>No hay huéspedes en este registro.</span>
                                        <span>Añade al menos uno usando el formulario superior (el primero será marcado como el Titular responsable).</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {huespedesList.map((h, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                                                        {h.nombre.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800 text-sm flex items-center gap-2">
                                                            <span>{h.nombre}</span>
                                                            {index === 0 && <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-800 rounded-full uppercase tracking-wider border border-green-200">Titular</span>}
                                                            {index !== 0 && <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-full uppercase tracking-wider">Acompañante</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-500">Doc: {h.documento}</div>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveGuest(index)} className="text-red-400 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors" title="Eliminar de la lista">
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Reserva details */}
                            <div className="col-span-1 md:col-span-2 mt-4"><h3 className="font-semibold text-gray-700 border-b pb-2">Detalles del Alojamiento</h3></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Habitación</label>
                                <select name="habitacion_id" required className="input-field" value={formData.habitacion_id} onChange={handleFormChange}>
                                    <option value="">Seleccione una habitación</option>
                                    {habitaciones.filter(h => h.estado_nombre && h.estado_nombre.toLowerCase() === 'disponible').map(h => (
                                        <option key={h.id} value={h.id}>#{h.numero} - {h.tipo_nombre || h.tipo} (P1: ${formatCurrency(h.precio_1)} - P2: ${formatCurrency(h.precio_2)})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tipo de Registro *</label>
                                <select name="tipo_registro_id" required className="input-field" value={formData.tipo_registro_id} onChange={handleFormChange}>
                                    <option value="">Seleccione tipo...</option>
                                    {tiposRegistro.filter(t => t.visualizar).map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha Check-in</label>
                                <input type="date" name="fecha_ingreso" required className="input-field" value={formData.fecha_ingreso} onChange={handleFormChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha Check-out</label>
                                <input type="date" name="fecha_salida" required className="input-field" value={formData.fecha_salida} onChange={handleFormChange} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Total Calculado ($)</label>
                                <input type="text" className="input-field bg-gray-50" readOnly value={formatCurrency(formData.total)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Medio de Pago</label>
                                <select name="medio_pago_id" className="input-field" value={formData.medio_pago_id} onChange={handleFormChange}>
                                    <option value="">Ninguno / Por definir...</option>
                                    {mediosPago.map(mp => (
                                        <option key={mp.id} value={mp.id}>{mp.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Valor Real a Cobrar ($) *</label>
                                <input type="text" required className="input-field" value={formatCurrency(formData.valor_cobrado)} onChange={(e) => setFormData({...formData, valor_cobrado: cleanNumericValue(e.target.value)})} />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Notas / Observaciones</label>
                                <textarea className="input-field" rows="2" value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})}></textarea>
                            </div>
                            
                            <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar Registro</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {showDetailsModal && selectedRegistroDetails && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-6 border-b pb-2">
                            <h2 className="text-2xl font-bold text-gray-800">Detalles del Registro #{selectedRegistroDetails.id}</h2>
                            <div className="flex items-center gap-2">
                                {!isEditing && (
                                    <button onClick={startEditing} className="flex items-center gap-1 bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors border border-primary-200" title="Editar Registro">
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
                        
                        <div className="space-y-6">
                            {/* General Details */}
                            <div>
                                <h3 className="font-semibold text-gray-700 border-b pb-1 mb-3">Información General</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500 block">Habitación</span>
                                        {isEditing ? (
                                            <select name="habitacion_id" className="input-field py-1" value={editData.habitacion_id} onChange={handleEditFormChange}>
                                                {habitaciones.map(h => (
                                                    <option key={h.id} value={h.id}>#{h.numero} - {h.tipo_nombre} ({h.estado_nombre})</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="font-medium text-gray-900">#{selectedRegistroDetails.numero_habitacion}</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Fechas</span>
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <input type="date" name="fecha_ingreso" className="input-field py-1 text-xs" value={editData.fecha_ingreso} onChange={handleEditFormChange} />
                                                <input type="date" name="fecha_salida" className="input-field py-1 text-xs" value={editData.fecha_salida} onChange={handleEditFormChange} />
                                            </div>
                                        ) : (
                                            <span className="font-medium text-gray-900">
                                                {format(new Date(selectedRegistroDetails.fecha_ingreso), 'dd/MM/yyyy')} 
                                                {' - '}
                                                {format(new Date(selectedRegistroDetails.fecha_salida), 'dd/MM/yyyy')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500 block">Titular (Responsable)</span>
                                        <span className="font-medium text-gray-900">{selectedRegistroDetails.nombre_cliente} - {selectedRegistroDetails.documento_cliente}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500 block">Tipo de Registro</span>
                                        {isEditing ? (
                                            <select name="tipo_registro_id" className="input-field py-1" value={editData.tipo_registro_id} onChange={handleEditFormChange}>
                                                {tiposRegistro.map(t => (
                                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 uppercase">
                                                {selectedRegistroDetails.tipo_registro_nombre || 'Formal'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* billing */}
                            <div>
                                <h3 className="font-semibold text-gray-700 border-b pb-1 mb-3">Alojamiento y Pagos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div>
                                        <span className="text-gray-500 block text-xs">Total Estancia ($)</span>
                                        {isEditing ? (
                                            <input type="text" className="input-field py-1 bg-white" value={formatCurrency(editData.total)} readOnly />
                                        ) : (
                                            <span className="font-medium text-gray-900">${formatCurrency(selectedRegistroDetails.valor_cobrado)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs">A Cobrar ($)</span>
                                        {isEditing ? (
                                            <input type="text" name="valor_cobrado" className="input-field py-1 bg-white" value={formatCurrency(editData.valor_cobrado)} onChange={e => setEditData({...editData, valor_cobrado: cleanNumericValue(e.target.value)})} />
                                        ) : (
                                            <span className="font-medium text-gray-900">${formatCurrency(selectedRegistroDetails.valor_cobrado)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs">Medio de Pago</span>
                                        {isEditing ? (
                                            <select name="medio_pago_id" className="input-field py-1 bg-white" value={editData.medio_pago_id} onChange={handleEditFormChange}>
                                                <option value="">Por definir...</option>
                                                {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
                                            </select>
                                        ) : (
                                            <span className="font-medium text-gray-900 text-xs uppercase">{selectedRegistroDetails.medio_pago_nombre || 'No registrado'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs">Estado</span>
                                        {isEditing ? (
                                            <select name="estado" className="input-field py-1 bg-white" value={editData.estado} onChange={handleEditFormChange}>
                                                <option value="pendiente">Pendiente</option>
                                                <option value="activa">Activa</option>
                                                <option value="completada">Completada</option>
                                                <option value="cancelada">Cancelada</option>
                                            </select>
                                        ) : (
                                            <span className="font-medium text-gray-900 text-xs uppercase">{selectedRegistroDetails.estado}</span>
                                        )}
                                    </div>
                                    <div className="md:col-span-4 mt-2 pt-2 border-t border-gray-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-gray-500 text-xs">Alojamiento:</span>
                                            <span className="font-bold text-gray-900">${formatCurrency(selectedRegistroDetails.valor_cobrado)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-gray-500 text-xs">Total Consumos:</span>
                                            <span className="font-bold text-gray-900">${formatCurrency(consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0))}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-300">
                                            <span className="text-sm font-black text-primary-700 uppercase">Total General:</span>
                                            <span className="text-lg font-black text-primary-700">${formatCurrency(
                                                parseFloat(selectedRegistroDetails.valor_cobrado) + 
                                                consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0)
                                            )}</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-4 mt-2 pt-2">
                                        <span className="text-gray-500 block text-xs">Notas / Observaciones</span>
                                        {isEditing ? (
                                            <textarea name="notas" className="input-field py-1 bg-white" rows="2" value={editData.notas} onChange={handleEditFormChange}></textarea>
                                        ) : (
                                            <span className="font-medium text-gray-900 text-xs mt-0.5 block whitespace-pre-line">{selectedRegistroDetails.notas || 'Ninguna'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Consumos - Hidden if editing for simplicity, or just read-only */}
                            {!isEditing && (
                                <div>
                                    <div className="flex justify-between items-center border-b pb-1 mb-3">
                                        <h3 className="font-semibold text-gray-700">Consumos de la Habitación</h3>
                                        {selectedRegistroDetails.estado === 'activa' && (
                                            <button 
                                                onClick={() => setShowConsumoForm(!showConsumoForm)}
                                                className="text-primary-600 hover:text-primary-800 text-xs font-bold flex items-center gap-1"
                                            >
                                                <Plus size={14} /> {showConsumoForm ? 'Cerrar' : 'Agregar Consumo'}
                                            </button>
                                        )}
                                    </div>

                                {showConsumoForm && (
                                    <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 mb-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-12 gap-3 items-end">
                                            <div className="col-span-7">
                                                <label className="block text-[10px] font-bold text-primary-700 uppercase mb-1">Producto</label>
                                                <select 
                                                    className="input-field text-sm bg-white" 
                                                    value={selectedProducto} 
                                                    onChange={e => setSelectedProducto(e.target.value)}
                                                >
                                                    <option value="">Seleccione producto...</option>
                                                    {productos.filter(p => p.stock > 0 && p.tipo_inventario === 'venta').map(p => (
                                                        <option key={p.id} value={p.id}>{p.nombre} (${formatCurrency(p.precio)}) - Stock: {p.stock}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-[10px] font-bold text-primary-700 uppercase mb-1">Cant.</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    className="input-field text-sm bg-white" 
                                                    value={cantidadConsumo} 
                                                    onChange={e => setCantidadConsumo(e.target.value)} 
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <button 
                                                    onClick={handleAddConsumo}
                                                    disabled={!selectedProducto}
                                                    className="btn-primary w-full h-[38px] flex items-center justify-center"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Producto</th>
                                                <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-500 uppercase">Cant.</th>
                                                <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {consumos.map((c, i) => (
                                                <tr key={i} className="text-xs">
                                                    <td className="px-4 py-2 text-gray-900">{c.producto_nombre}</td>
                                                    <td className="px-4 py-2 text-center text-gray-500">{c.cantidad}</td>
                                                    <td className="px-4 py-2 text-right font-medium text-gray-900">${formatCurrency(c.cantidad * c.precio)}</td>
                                                </tr>
                                            ))}
                                            {consumos.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-6 text-center text-gray-400 italic">No hay consumos registrados</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                            {/* Guests */}
                            <div>
                                <h3 className="font-semibold text-gray-700 border-b pb-1 mb-3">
                                    Participantes ({isEditing ? editData.huespedes.length : (selectedRegistroDetails.huespedes?.length || 0)})
                                </h3>
                                
                                {isEditing && (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                                        <div className="relative mb-3">
                                            <input 
                                                type="text" 
                                                placeholder="Buscar cliente existente..." 
                                                className="input-field pl-10 text-xs py-1.5"
                                                value={clienteSearch}
                                                onChange={(e) => setClienteSearch(e.target.value)}
                                            />
                                            <Search className="absolute left-3 top-1.5 text-gray-400" size={16} />
                                            {clienteSearch.length > 0 && (
                                                <div className="absolute z-[70] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                    {filteredClientes.length > 0 ? (
                                                        filteredClientes.map(cliente => (
                                                            <div 
                                                                key={cliente.id} 
                                                                className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-0 text-xs"
                                                                onClick={() => {
                                                                    setGuestEditForm({
                                                                        id: cliente.id,
                                                                        nombre: cliente.nombre,
                                                                        documento: cliente.documento,
                                                                        tipo_documento: cliente.tipo_documento || 'CC',
                                                                        telefono: cliente.telefono || '',
                                                                        email: cliente.email || '',
                                                                        municipio_origen_id: cliente.municipio_origen_id || ''
                                                                    });
                                                                    setClienteSearch('');
                                                                }}
                                                            >
                                                                <div className="font-medium">{cliente.nombre}</div>
                                                                <div className="text-gray-500">Doc: {cliente.documento}</div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-xs text-gray-500 text-center">No encontrado. Ingresa datos manuales.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input type="text" placeholder="Nombre" className="input-field py-1 text-xs" value={guestEditForm.nombre} onChange={e => setGuestEditForm({...guestEditForm, nombre: e.target.value})} />
                                            <input type="text" placeholder="Documento" className="input-field py-1 text-xs" value={guestEditForm.documento} onChange={e => setGuestEditForm({...guestEditForm, documento: e.target.value})} />
                                        </div>
                                        <button onClick={handleAddGuestEdit} className="btn-primary py-1.5 text-xs w-full flex items-center justify-center gap-2">
                                            <Plus size={14} /> Añadir Huésped
                                        </button>
                                    </div>
                                )}

                                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                    {(isEditing ? editData.huespedes : (selectedRegistroDetails.huespedes || [])).map((h, i) => (
                                        <div key={h.id || i} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                            <div>
                                                <div className="font-medium text-sm text-gray-900 flex gap-2 items-center">
                                                    {h.nombre}
                                                    {i === 0 && (
                                                        <span className="px-2 py-0.5 text-[10px] bg-green-100 text-green-800 rounded border border-green-200 uppercase">Titular</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {h.tipo_documento} {h.documento} {h.telefono ? `| Tel: ${h.telefono}` : ''}
                                                </div>
                                            </div>
                                            {isEditing && (
                                                <button onClick={() => handleRemoveGuestEdit(i)} className="text-red-500 hover:text-red-700">
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancelar</button>
                                    <button onClick={handleUpdateSave} className="btn-primary">Guardar Cambios</button>
                                </>
                            ) : (
                                <button onClick={() => setShowDetailsModal(false)} className="btn-secondary">Cerrar</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Registros;
