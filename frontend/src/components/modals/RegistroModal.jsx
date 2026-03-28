import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { 
    Plus, 
    CheckCircle, 
    X, 
    Search, 
    User, 
    Calendar,
    Hotel,
    Info,
    DollarSign,
    CreditCard,
    Clipboard,
    Type,
    Phone,
    Mail,
    MapPin,
    Loader2
} from 'lucide-react';
import { formatCurrency, cleanNumericValue } from '../../utils/format';

const RegistroModal = ({ isOpen, onClose, initialHabitacionId, onSuccess }) => {
    const [habitaciones, setHabitaciones] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [mediosPago, setMediosPago] = useState([]);
    const [tiposRegistro, setTiposRegistro] = useState([]);
    const [clienteSearch, setClienteSearch] = useState('');
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        habitacion_id: initialHabitacionId || '',
        fecha_ingreso: format(new Date(), 'yyyy-MM-dd'),
        fecha_salida: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
        total: '0.00',
        medio_pago_id: '',
        valor_cobrado: '0.00',
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
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialHabitacionId) {
            setFormData(prev => ({ ...prev, habitacion_id: initialHabitacionId }));
        }
    }, [initialHabitacionId]);

    // Recalculate total when relevant fields change
    useEffect(() => {
        if (habitaciones.length > 0 && formData.habitacion_id && formData.fecha_ingreso && formData.fecha_salida) {
            calculateTotal(formData.habitacion_id, formData.fecha_ingreso, formData.fecha_salida, huespedesList.length);
        }
    }, [habitaciones, formData.habitacion_id, formData.fecha_ingreso, formData.fecha_salida, huespedesList.length]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [resHab, resClientes, resMuni, resMedios, resTipos] = await Promise.all([
                api.get('/habitaciones'),
                api.get('/clientes'),
                api.get('/municipios'),
                api.get('/medios-pago'),
                api.get('/tipos-registro')
            ]);
            setHabitaciones(resHab.data);
            setClientes(resClientes.data);
            setMunicipios(resMuni.data);
            setMediosPago(resMedios.data);
            setTiposRegistro(resTipos.data);
            
            // Si hay un ID inicial y tipos de registro, preseleccionar el primero si hay solo uno
            if (resTipos.data.length > 0) {
                const formal = resTipos.data.find(t => t.nombre.toLowerCase().includes('formal')) || resTipos.data[0];
                setFormData(prev => ({ ...prev, tipo_registro_id: formal.id }));
            }
        } catch (error) {
            console.error('Error fetching modal data:', error);
            Swal.fire('Error', 'No se pudieron cargar los datos necesarios para el registro', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = (habId, fechaIn, fechaOut, listLength) => {
        const hab = habitaciones.find(h => String(h.id || h._id) === String(habId));
        if (!hab) return;
        
        const inDate = new Date(fechaIn);
        const outDate = new Date(fechaOut);
        if (outDate < inDate) return;

        const diffTime = outDate - inDate;
        const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
        
        const numPersonas = Math.min(Math.max(listLength, 1), 6);
        const pNoche = parseFloat(hab[`precio_${numPersonas}`]) || parseFloat(hab.precio_1) || 0;
        
        const rawTotal = (pNoche * diffDays);
        setFormData(prev => ({ 
            ...prev, 
            total: rawTotal.toFixed(2),
            valor_cobrado: rawTotal.toFixed(2)
        }));
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        
        setHuespedesList(prev => [...prev, guestForm]);
        setGuestForm({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '' });
        setSelectedCliente(null);
    };

    const handleRemoveGuest = (index) => {
        setHuespedesList(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (huespedesList.length === 0) {
            return Swal.fire('Atención', 'Debe agregar al menos un huésped al registro', 'warning');
        }
        if (!formData.habitacion_id) {
            return Swal.fire('Atención', 'Debe seleccionar una habitación', 'warning');
        }
        if (!formData.tipo_registro_id) {
            return Swal.fire('Atención', 'Debe seleccionar un tipo de registro', 'warning');
        }

        setSaving(true);
        try {
            Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            // Logic to handle new clients
            const processedHuespedesIds = [];
            for (const h of huespedesList) {
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

            const dataToSave = {
                ...formData,
                cliente_id: processedHuespedesIds[0],
                huespedes: processedHuespedesIds,
                observaciones: formData.notas
            };
            
            await api.post('/registros', dataToSave);
            
            Swal.close();
            Swal.fire('Éxito', 'Registro creado correctamente', 'success');
            onSuccess();
            onClose();
        } catch (error) {
            Swal.close();
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar el registro', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const filteredClientes = clientes.filter(c => 
        (c.nombre && c.nombre.toLowerCase().includes(clienteSearch.toLowerCase())) || 
        (c.documento && c.documento.includes(clienteSearch))
    ).slice(0, 5);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gray-950 p-6 flex justify-between items-center text-white border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                            <Plus size={20} endurance={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Nuevo Registro</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80">Mapa Operativo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 size={40} className="animate-spin text-emerald-500" />
                        <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Preparando Formulario...</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto max-h-[75vh]">
                        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
                            {/* PASO 1: CLIENTES */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <User size={16} />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Paso 1: Participantes</h3>
                                </div>
                                
                                <div className="relative">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="Busca un cliente por nombre o cédula..." 
                                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                                            value={clienteSearch}
                                            onChange={(e) => setClienteSearch(e.target.value)}
                                        />
                                    </div>
                                    
                                    {clienteSearch.length >= 2 && (
                                        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                            {filteredClientes.length > 0 ? (
                                                filteredClientes.map(cliente => (
                                                    <div 
                                                        key={cliente.id} 
                                                        className="p-4 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center group"
                                                        onClick={() => handleClienteSelect(cliente)}
                                                    >
                                                        <div>
                                                            <div className="font-black text-gray-900 uppercase text-xs">{cliente.nombre}</div>
                                                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">#{cliente.documento}</div>
                                                        </div>
                                                        <Plus size={16} className="text-gray-300 group-hover:text-emerald-500" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-6 text-center text-xs text-gray-400 font-bold italic">No se encontraron clientes. Ingresa los datos abajo.</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Formulario rápido de huésped */}
                                <div className="bg-gray-50 border-2 border-gray-100 p-5 rounded-[1.25rem] space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1 block">Nombre Completo</label>
                                            <div className="relative">
                                                <Type className="absolute left-3 top-2.5 text-gray-300" size={14} />
                                                <input type="text" className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:border-emerald-500 outline-none" value={guestForm.nombre} onChange={e => setGuestForm({...guestForm, nombre: e.target.value.toUpperCase()})} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1 block">Documento</label>
                                            <div className="flex gap-2">
                                                <select className="bg-white border border-gray-200 rounded-lg text-[10px] font-black px-2 py-1 outline-none" value={guestForm.tipo_documento} onChange={e => setGuestForm({...guestForm, tipo_documento: e.target.value})}>
                                                    <option value="CC">CC</option>
                                                    <option value="CE">CE</option>
                                                    <option value="PAS">PAS</option>
                                                    <option value="TI">TI</option>
                                                </select>
                                                <input type="text" className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:border-emerald-500 outline-none" value={guestForm.documento} onChange={e => setGuestForm({...guestForm, documento: e.target.value})} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1 block">Teléfono / WhatsApp</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-2.5 text-gray-300" size={14} />
                                                <input type="text" className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold" value={guestForm.telefono} onChange={e => setGuestForm({...guestForm, telefono: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1 block">Lugar Origen</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-2.5 text-gray-300" size={14} />
                                                    <select className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none" value={guestForm.municipio_origen_id} onChange={e => setGuestForm({...guestForm, municipio_origen_id: e.target.value})}>
                                                        <option value="">SELECCIONA...</option>
                                                        {municipios.filter(m => m.visualizar).map(m => (
                                                            <option key={m.id} value={m.id}>{m.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <button type="button" onClick={handleAddGuest} className="bg-emerald-500 text-white p-2.5 rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center">
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    {selectedCliente && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100/50 rounded-xl border border-emerald-100">
                                            <CheckCircle size={14} className="text-emerald-600" />
                                            <span className="text-[9px] font-bold text-emerald-600 uppercase">Cliente cargado del sistema</span>
                                            <button type="button" onClick={() => { setSelectedCliente(null); setGuestForm({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '' }); }} className="ml-auto text-[9px] font-black text-gray-400 hover:text-red-500 uppercase tracking-tighter">Limpiar</button>
                                        </div>
                                    )}
                                </div>

                                {/* Lista de agregados */}
                                <div className="space-y-2">
                                    {huespedesList.map((h, idx) => (
                                        <div key={idx} className="bg-white border border-gray-100 p-3 rounded-xl flex justify-between items-center shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                                                    {h.nombre.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-gray-800 flex items-center gap-2">
                                                        {h.nombre}
                                                        {idx === 0 && <span className="text-[7px] bg-emerald-100 text-emerald-700 px-1 rounded-sm uppercase tracking-widest">Titular</span>}
                                                    </div>
                                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Doc: {h.documento}</div>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => handleRemoveGuest(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {huespedesList.length === 0 && (
                                        <div className="p-8 border-2 border-dashed border-gray-100 rounded-[1.25rem] text-center">
                                            <User size={32} className="mx-auto text-gray-100 mb-2" />
                                            <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Sin huéspedes agregados</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <hr className="border-gray-50" />

                            {/* PASO 2: ALOJAMIENTO */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Hotel size={16} />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Paso 2: Alojamiento</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Habitación</label>
                                        <select name="habitacion_id" required className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-black focus:border-emerald-500 outline-none" value={formData.habitacion_id} onChange={handleFormChange}>
                                            <option value="">SELECCIONA HABITACIÓN...</option>
                                            {habitaciones.map(h => (
                                                <option key={h.id} value={h.id}>HAB {h.numero} - {h.tipo?.nombre || 'TIPO'} (${formatCurrency(h.precio_1)})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Tipo de Registro</label>
                                        <select name="tipo_registro_id" required className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-black focus:border-emerald-500 outline-none uppercase" value={formData.tipo_registro_id} onChange={handleFormChange}>
                                            <option value="">SELECCIONA TIPO...</option>
                                            {tiposRegistro.filter(t => t.visualizar).map(t => (
                                                <option key={t.id} value={t.id}>{t.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Fecha Check-In</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-3.5 text-gray-300" size={16} />
                                            <input type="date" name="fecha_ingreso" className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-black focus:border-emerald-500 outline-none" value={formData.fecha_ingreso} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Fecha Check-Out</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-3.5 text-gray-300" size={16} />
                                            <input type="date" name="fecha_salida" className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-black focus:border-emerald-500 outline-none" value={formData.fecha_salida} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-emerald-50 rounded-[1.25rem] border border-emerald-100">
                                    <div>
                                        <label className="text-[8px] font-black uppercase tracking-widest text-emerald-600/60 mb-1 block">Total Sugerido</label>
                                        <div className="text-xl font-black text-emerald-700">${formatCurrency(formData.total)}</div>
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black uppercase tracking-widest text-emerald-600/60 mb-1 block">Medio de Pago</label>
                                        <select name="medio_pago_id" className="w-full bg-white border border-emerald-200 rounded-lg text-[9px] font-black px-2 py-1.5 outline-none" value={formData.medio_pago_id} onChange={handleFormChange}>
                                            <option value="">POR DEFINIR...</option>
                                            {mediosPago.map(mp => (
                                                <option key={mp.id} value={mp.id}>{mp.nombre.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black uppercase tracking-widest text-emerald-600/60 mb-1 block">Valor a Cobrar</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2 top-2 text-emerald-300" size={12} />
                                            <input 
                                                type="text" 
                                                className="w-full pl-6 pr-2 py-1.5 bg-white border border-emerald-200 rounded-lg text-sm font-black text-emerald-800 outline-none focus:ring-2 ring-emerald-500/20" 
                                                value={formatCurrency(formData.valor_cobrado)} 
                                                onChange={(e) => setFormData(prev => ({ ...prev, valor_cobrado: cleanNumericValue(e.target.value) }))} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Notas u Observaciones</label>
                                    <div className="relative">
                                        <Clipboard className="absolute left-4 top-3.5 text-gray-300" size={16} />
                                        <textarea name="notas" className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-bold focus:border-emerald-500 outline-none" rows="2" value={formData.notas} onChange={handleFormChange} placeholder="Escribe notas relevantes aquí..."></textarea>
                                    </div>
                                </div>
                            </section>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Cancelar</button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="flex-[2] py-4 bg-gray-950 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-800 shadow-xl shadow-gray-950/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Hotel size={16} />}
                                    {saving ? 'PROCESANDO...' : 'CONFIRMAR REGISTRO'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegistroModal;
