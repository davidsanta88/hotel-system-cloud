import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
    Plus, 
    Search, 
    FileText, 
    Trash2, 
    Printer, 
    Eye, 
    Users, 
    DollarSign, 
    Tag, 
    Building2,
    Calendar,
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Cotizaciones = () => {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [hotelConfig, setHotelConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewingCotizacion, setViewingCotizacion] = useState(null);
    const [editingId, setEditingId] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        cliente: '',
        correo: '',
        telefono: '',
        numeroPersonal: 1,
        valorPersonalNormal: 0,
        valorDescuento: 0,
        detalles: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cotsRes, configRes] = await Promise.all([
                api.get('/cotizaciones'),
                api.get('/hotel-config')
            ]);
            setCotizaciones(cotsRes.data);
            setHotelConfig(configRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name.includes('valor') || name === 'numeroPersonal' ? Number(value) : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/cotizaciones/${editingId}`, formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Cotización Actualizada',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                const res = await api.post('/cotizaciones', formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Cotización Creada',
                    text: `La cotización ${res.data.numeroCotizacion} se ha generado correctamente.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({
                cliente: '',
                correo: '',
                telefono: '',
                numeroPersonal: 1,
                valorPersonalNormal: 0,
                valorDescuento: 0,
                detalles: ''
            });
            fetchData();
        } catch (error) {
            console.error('Error saving cotización:', error);
            Swal.fire('Error', 'No se pudo guardar la cotización', 'error');
        }
    };

    const handleEdit = (cot) => {
        setEditingId(cot._id);
        setFormData({
            cliente: cot.cliente,
            correo: cot.correo || '',
            telefono: cot.telefono || '',
            numeroPersonal: cot.numeroPersonal,
            valorPersonalNormal: cot.valorPersonalNormal,
            valorDescuento: cot.valorDescuento,
            detalles: cot.detalles || ''
        });
        setShowModal(true);
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.put(`/cotizaciones/${id}/status`, { estado: newStatus });
            Swal.fire({
                icon: 'success',
                title: 'Estado Actualizado',
                text: `La cotización ahora está ${newStatus}.`,
                timer: 1500,
                showConfirmButton: false
            });
            fetchData();
            if (viewingCotizacion) {
                const updated = cotizaciones.find(c => c._id === id);
                if (updated) setViewingCotizacion({ ...updated, estado: newStatus });
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/cotizaciones/${id}`);
                Swal.fire('Eliminado', 'La cotización ha sido eliminada.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar la cotización', 'error');
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const subtotal = formData.numeroPersonal * formData.valorPersonalNormal;
    const total = subtotal - formData.valorDescuento;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (viewingCotizacion) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
                <button 
                    onClick={() => setViewingCotizacion(null)}
                    className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors print:hidden"
                >
                    <ArrowLeft size={20} />
                    Volver al Listado
                </button>

                {/* COTIZACION PRINTABLE VIEW */}
                <div className="bg-white p-8 md:p-16 shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0">
                    {/* Header: Logo and Basic Hotel Info */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 border-b-2 border-slate-900 pb-8">
                        <div className="flex flex-col gap-4">
                            <img src="/logo.jpg" alt="Logo Hotel" className="h-24 w-auto object-contain" />
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase">{viewingCotizacion.hotelSnapshot.nombre}</h2>
                                <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Nit: {viewingCotizacion.hotelSnapshot.nit}</p>
                                <a href="https://www.hotelbalconplaza.com/" target="_blank" rel="noreferrer" className="text-blue-600 font-black text-xs hover:underline mt-1 block print:text-slate-800">
                                    www.hotelbalconplaza.com
                                </a>
                            </div>
                        </div>
                        <div className="text-right flex flex-col justify-end h-full">
                            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl inline-block mb-4">
                                <h1 className="text-3xl font-black tracking-tighter leading-none">COTIZACIÓN</h1>
                                <p className="text-blue-400 font-black text-sm mt-1">{viewingCotizacion.numeroCotizacion}</p>
                            </div>
                            <p className="text-slate-500 font-bold text-sm italic">
                                Fecha de Emisión: {format(new Date(viewingCotizacion.fecha), "dd 'de' MMMM, yyyy", { locale: es })}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-12">
                        {/* Info Section */}
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-white bg-slate-900 px-3 py-1 inline-block uppercase tracking-widest">Información del Cliente</h3>
                                <div className="space-y-1">
                                    <p className="text-xl font-black text-slate-800">{viewingCotizacion.cliente}</p>
                                    {viewingCotizacion.correo && <p className="text-slate-500 font-bold">Email: {viewingCotizacion.correo}</p>}
                                    {viewingCotizacion.telefono && <p className="text-slate-500 font-bold">Teléfono: {viewingCotizacion.telefono}</p>}
                                </div>
                            </div>
                            <div className="space-y-4 text-right">
                                <h3 className="text-xs font-black text-white bg-slate-900 px-3 py-1 inline-block uppercase tracking-widest">Ubicación y Contacto</h3>
                                <div className="space-y-1 text-sm font-bold text-slate-600">
                                    <p>{viewingCotizacion.hotelSnapshot.direccion}</p>
                                    <p>Tel: {viewingCotizacion.hotelSnapshot.telefono}</p>
                                    <p>{viewingCotizacion.hotelSnapshot.correo}</p>
                                </div>
                            </div>
                        </div>

                        {/* Proposal Details Table */}
                        <div>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-y-2 border-slate-900">
                                        <th className="py-4 text-left text-xs font-black uppercase tracking-widest text-slate-900">Concepto / Servicios Incluidos</th>
                                        <th className="py-4 text-center text-xs font-black uppercase tracking-widest text-slate-900">Cant. Pers</th>
                                        <th className="py-4 text-right text-xs font-black uppercase tracking-widest text-slate-900">Valor Unit.</th>
                                        <th className="py-4 text-right text-xs font-black uppercase tracking-widest text-slate-900">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-8 align-top">
                                            <p className="text-lg font-black text-slate-800 mb-2 uppercase">Servicios de Hospedaje y Atención</p>
                                            <div className="text-slate-500 font-medium text-sm leading-relaxed whitespace-pre-wrap max-w-md">
                                                {viewingCotizacion.detalles || 'Servicio integral de hotelería según estándares de calidad del Hotel Balcón Plaza.'}
                                            </div>
                                        </td>
                                        <td className="py-8 text-center align-top">
                                            <span className="font-black text-slate-700">{viewingCotizacion.numeroPersonal}</span>
                                        </td>
                                        <td className="py-8 text-right align-top">
                                            <span className="font-bold text-slate-700">${viewingCotizacion.valorPersonalNormal.toLocaleString()}</span>
                                        </td>
                                        <td className="py-8 text-right align-top">
                                            <span className="font-black text-slate-900">${viewingCotizacion.subtotal.toLocaleString()}</span>
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="2"></td>
                                        <td className="py-4 text-right text-slate-500 font-bold uppercase text-xs">Subtotal Bruto</td>
                                        <td className="py-4 text-right text-slate-700 font-black">${viewingCotizacion.subtotal.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2"></td>
                                        <td className="py-2 text-right text-rose-500 font-bold uppercase text-xs">
                                            Descuento Comercial ({viewingCotizacion.subtotal > 0 ? ((viewingCotizacion.valorDescuento / viewingCotizacion.subtotal) * 100).toFixed(1) : 0}%)
                                        </td>
                                        <td className="py-2 text-right text-rose-600 font-black">-${viewingCotizacion.valorDescuento.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-t-2 border-slate-900">
                                        <td colSpan="2"></td>
                                        <td className="py-6 text-right text-slate-900 font-black uppercase text-sm tracking-tighter">Valor Total de Propuesta</td>
                                        <td className="py-6 text-right text-blue-600 font-black text-3xl tracking-tighter">${viewingCotizacion.total.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Términos y Condiciones Generales</h4>
                            <div className="text-[11px] text-slate-500 font-medium leading-relaxed space-y-2">
                                <p>• {hotelConfig?.politica || 'La presente cotización tiene una validez de 15 días a partir de la fecha de emisión.'}</p>
                                <p>• Reserva sujeta a disponibilidad al momento de la confirmación.</p>
                                <p>• Los valores expresados no incluyen IVA (si aplica) ni servicios adicionales no especificados.</p>
                                <p>• Para formalizar la reserva se requiere el 50% de anticipo.</p>
                            </div>
                        </div>

                        {/* Signatures and Footer */}
                        <div className="pt-20 grid grid-cols-2 gap-16">
                            <div className="text-center">
                                <div className="border-t border-slate-400 pt-4">
                                    <p className="text-sm font-black text-slate-800">Aceptado por Cliente</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Firma y Sello</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-slate-400 pt-4">
                                    <p className="text-sm font-black text-slate-800">Gestión Comercial</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{viewingCotizacion.hotelSnapshot.nombre}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-12 text-center">
                            <p className="text-slate-400 font-black italic text-sm">"{viewingCotizacion.hotelSnapshot.lema || 'Gracias por elegirnos'}"</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4 print:hidden">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase hover:bg-slate-800 transition-all shadow-lg"
                    >
                        <Printer size={18} />
                        Imprimir / Guardar PDF
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FileText className="text-blue-600" size={32} />
                        Gestión de Cotizaciones
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Cree y gestione propuestas comerciales profesionales para sus clientes.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                    <Plus size={20} />
                    Nueva Cotización
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cotización</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Pers.</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {cotizaciones.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <FileText size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold">No hay cotizaciones registradas aún.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                cotizaciones.map((cot) => (
                                    <tr key={cot._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <span className="font-black text-blue-600">{cot.numeroCotizacion}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-700">{cot.cliente}</span>
                                                <span className="text-xs text-slate-400 font-bold">{cot.correo || 'Sin correo'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-bold text-slate-500 uppercase">
                                                {format(new Date(cot.fecha), "dd MMM, yyyy", { locale: es })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-xs">
                                                {cot.numeroPersonal}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                cot.estado === 'Aceptada' ? 'bg-emerald-100 text-emerald-600' :
                                                cot.estado === 'Rechazada' ? 'bg-rose-100 text-rose-600' :
                                                cot.estado === 'Enviada' ? 'bg-blue-100 text-blue-600' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                                {cot.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="font-black text-slate-800">${cot.total.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                {cot.estado === 'Pendiente' && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(cot._id, 'Aceptada')}
                                                        className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Aprobar"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleEdit(cot)}
                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => setViewingCotizacion(cot)}
                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Ver/Imprimir"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(cot._id)}
                                                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight">
                                    {editingId ? <Edit2 className="text-blue-500" size={24} /> : <Plus className="text-blue-500" size={24} />}
                                    {editingId ? 'Editar Cotización' : 'Generar Cotización'}
                                </h2>
                                <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">
                                    {editingId ? 'Modifique los datos de la propuesta' : 'Complete los datos para la propuesta'}
                                </p>
                            </div>
                            <button onClick={() => { setShowModal(false); setEditingId(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cliente */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Nombre del Cliente / Empresa</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <Building2 size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            name="cliente"
                                            value={formData.cliente}
                                            onChange={handleInputChange}
                                            required
                                            className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="Ej: Juan Pérez o Empresa S.A.S"
                                        />
                                    </div>
                                </div>

                                {/* Correo */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleInputChange}
                                        className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
                                        placeholder="cliente@correo.com"
                                    />
                                </div>

                                {/* Telefono */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Teléfono</label>
                                    <input
                                        type="text"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                        className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
                                        placeholder="300 000 0000"
                                    />
                                </div>

                                {/* Numero Personal */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Número de Personas</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <Users size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            name="numeroPersonal"
                                            value={formData.numeroPersonal}
                                            onChange={handleInputChange}
                                            min="1"
                                            required
                                            className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Valor Unitario */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Valor por Persona</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <DollarSign size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            name="valorPersonalNormal"
                                            value={formData.valorPersonalNormal}
                                            onChange={handleInputChange}
                                            required
                                            className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Descuento */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Valor Descuento Total</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <Tag size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            name="valorDescuento"
                                            value={formData.valorDescuento}
                                            onChange={handleInputChange}
                                            className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Total Preview */}
                                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex flex-col justify-center">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 text-center">Resumen de Totales</span>
                                    {formData.valorDescuento > 0 && (
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="text-rose-400 font-bold text-[10px] uppercase">Descuento ({subtotal > 0 ? ((formData.valorDescuento / subtotal) * 100).toFixed(1) : 0}%):</span>
                                            <span className="text-rose-500 font-bold text-xs">-${formData.valorDescuento.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-slate-500 font-bold text-xs uppercase">Total:</span>
                                        <span className="text-2xl font-black text-blue-600">${total.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Detalles */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Detalles Adicionales / Observaciones</label>
                                    <textarea
                                        name="detalles"
                                        value={formData.detalles}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
                                        placeholder="Ej: Incluye desayuno, uso de zonas húmedas, etc."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3.5 rounded-2xl font-black text-sm uppercase text-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                >
                                    Guardar y Generar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cotizaciones;
