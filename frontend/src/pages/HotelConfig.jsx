import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { Save, Building2, Phone, Mail, MapPin, FileText, Info, CreditCard, Globe, Quote, X, DollarSign, ShieldAlert, TrendingDown } from 'lucide-react';

const HotelConfig = () => {
    const [config, setConfig] = useState({
        nombre: '',
        nit: '',
        direccion: '',
        telefono: '',
        correo: '',
        sitioWeb: '',
        politica: '',
        datosBancarios: '',
        lema: '',
        checklistAuditoria: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/hotel-config');
            setConfig(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching config:', error);
            Swal.fire('Error', 'No se pudo cargar la configuración', 'error');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/hotel-config', config);
            Swal.fire({
                icon: 'success',
                title: 'Configuración Guardada',
                text: 'Los datos del hotel han sido actualizados correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error updating config:', error);
            Swal.fire('Error', 'No se pudo guardar la configuración', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Building2 className="text-blue-600" size={28} />
                    Configuración del Hotel
                </h1>
                <p className="text-slate-500 font-medium">Gestione la información corporativa y políticas que aparecerán en los vouchers y documentos.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre del Hotel */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Nombre Comercial</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Building2 size={18} />
                            </div>
                            <input
                                type="text"
                                name="nombre"
                                value={config.nombre}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700"
                                placeholder="Ej: Hotel Balcón Plaza"
                                required
                            />
                        </div>
                    </div>

                    {/* NIT */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">NIT / Identificación Tributaria</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Info size={18} />
                            </div>
                            <input
                                type="text"
                                name="nit"
                                value={config.nit}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700"
                                placeholder="Ej: 900.123.456-7"
                                required
                            />
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow md:col-span-2">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Dirección Física</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <MapPin size={18} />
                            </div>
                            <input
                                type="text"
                                name="direccion"
                                value={config.direccion}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700"
                                placeholder="Calle Principal # 12-34..."
                                required
                            />
                        </div>
                    </div>

                    {/* Teléfono */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Teléfono de Contacto</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Phone size={18} />
                            </div>
                            <input
                                type="text"
                                name="telefono"
                                value={config.telefono}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700"
                                placeholder="(+57) 300 000 0000"
                                required
                            />
                        </div>
                    </div>

                    {/* Correo */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Correo Electrónico</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                name="correo"
                                value={config.correo}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700"
                                placeholder="reservas@hotel.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Sitio Web */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Página Web</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Globe size={18} />
                            </div>
                            <input
                                type="text"
                                name="sitioWeb"
                                value={config.sitioWeb}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700"
                                placeholder="www.hotel.com"
                            />
                        </div>
                    </div>

                    {/* Política del Hotel */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow md:col-span-2">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Política General (Legal)</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 flex items-center pointer-events-none text-slate-400">
                                <FileText size={18} />
                            </div>
                            <textarea
                                name="politica"
                                value={config.politica}
                                onChange={handleChange}
                                rows={4}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700"
                                placeholder="Escriba aquí los términos y condiciones que aparecerán en el voucher..."
                                required
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 font-medium italic">* Este texto aparecerá en el pie de página de los vouchers PDF.</p>
                    </div>

                    {/* Datos Bancarios */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow md:col-span-2">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Datos Bancarios para Transferencias</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 flex items-center pointer-events-none text-slate-400">
                                <DollarSign size={18} />
                            </div>
                            <textarea
                                name="datosBancarios"
                                value={config.datosBancarios}
                                onChange={handleChange}
                                rows={3}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700"
                                placeholder="Ej: Banco: Bancolombia | Cuenta Ahorros # 000... | Nequi: 300..."
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 font-medium italic">* Estos datos aparecerán en las cotizaciones para facilitar el pago de reservas.</p>
                    </div>

                    {/* Lema del Hotel */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow md:col-span-2">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Lema / Eslogan del Hotel</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Quote size={18} />
                            </div>
                            <input
                                type="text"
                                name="lema"
                                value={config.lema}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-slate-700"
                                placeholder="Ej: Un oasis de paz y tradición"
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 font-medium italic">* Este mensaje aparecerá como despedida en el pie de página de los vouchers.</p>
                    </div>

                    {/* ALERTA DE CAJA */}
                    <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100 hover:shadow-md transition-shadow md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldAlert className="text-indigo-600" size={24} />
                            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Alertas de Tesorería</h3>
                        </div>
                        <label className="block text-xs font-black text-indigo-400 uppercase mb-2 ml-1">Monto Límite en Caja (+Base) para Alerta</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                                <DollarSign size={18} />
                            </div>
                            <input
                                type="number"
                                name="montoAlertaCaja"
                                value={config.montoAlertaCaja || 0}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-black text-indigo-700 bg-white"
                                placeholder="Ej: 500000"
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-indigo-500/60 font-medium italic">* Se mostrará una alerta automática al Administrador cuando el efectivo total en caja (incluyendo la base del cierre anterior) supere este valor.</p>
                        
                        <div className="mt-6 pt-6 border-t border-indigo-100">
                            <label className="block text-xs font-black text-amber-500 uppercase mb-2 ml-1">Tolerancia de Variación de Precio (%)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                                    <TrendingDown size={18} />
                                </div>
                                <input
                                    type="number"
                                    name="toleranciaPrecio"
                                    value={config.toleranciaPrecio || 0}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm font-black text-amber-700 bg-white"
                                    placeholder="Ej: 10"
                                />
                            </div>
                            <p className="mt-2 text-[10px] text-amber-600/60 font-medium italic">* Genera alertas si el precio cobrado es menor al recomendado (según # de personas) restando esta tolerancia. Ej: Si es 10% y la hab. vale $80.000, alertará si cobran menos de $72.000.</p>
                        </div>
                    </div>

                    {/* SECCIÓN ADMINISTRADOR (FIRMA) */}
                    <div className="md:col-span-2 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-px flex-1 bg-slate-100"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad Visual (Branding)</span>
                            <div className="h-px flex-1 bg-slate-100"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Logo del Hotel */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <label className="block text-xs font-black text-slate-400 uppercase mb-4 ml-1">Logo del Hotel</label>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner relative group">
                                        <img src={config.logoUrl || "/logo.jpg"} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                    </div>
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append('image', file);
                                            try {
                                                Swal.fire({ title: 'Subiendo logo...', didOpen: () => Swal.showLoading() });
                                                const res = await api.post('/productos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                setConfig(prev => ({ ...prev, logoUrl: res.data.imageUrl }));
                                                Swal.fire('Éxito', 'Logo subido correctamente', 'success');
                                            } catch (err) { Swal.fire('Error', 'No se pudo subir el logo', 'error'); }
                                        }}
                                    />
                                    <label htmlFor="logo-upload" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-all">
                                        Cambiar Logo
                                    </label>
                                </div>
                            </div>

                            {/* Fondo de Login */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <label className="block text-xs font-black text-slate-400 uppercase mb-4 ml-1">Fondo de Pantalla (Login)</label>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner relative group">
                                        <img src={config.backgroundUrl || "/hotel_noche.jpg"} alt="Background Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <input
                                        type="file"
                                        id="bg-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append('image', file);
                                            try {
                                                Swal.fire({ title: 'Subiendo fondo...', didOpen: () => Swal.showLoading() });
                                                const res = await api.post('/productos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                setConfig(prev => ({ ...prev, backgroundUrl: res.data.imageUrl }));
                                                Swal.fire('Éxito', 'Fondo subido correctamente', 'success');
                                            } catch (err) { Swal.fire('Error', 'No se pudo subir el fondo', 'error'); }
                                        }}
                                    />
                                    <label htmlFor="bg-upload" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-all">
                                        Cambiar Fondo
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 mt-8">
                            <div className="h-px flex-1 bg-slate-100"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Datos del Firmante (Administrador)</span>
                            <div className="h-px flex-1 bg-slate-100"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Nombre del Administrador</label>
                                <input
                                    type="text"
                                    name="adminNombre"
                                    value={config.adminNombre}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
                                />
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Celular del Administrador</label>
                                <input
                                    type="text"
                                    name="adminCelular"
                                    value={config.adminCelular}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
                                />
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Cédula / Documento</label>
                                <input
                                    type="text"
                                    name="adminDocumento"
                                    value={config.adminDocumento}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
                                />
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Correo Administrativo</label>
                                <input
                                    type="text"
                                    name="adminCorreo"
                                    value={config.adminCorreo}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
                                />
                            </div>

                            {/* Firma Digital */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase mb-4 ml-1">Imagen de la Firma Digital</label>
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-48 h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden shadow-inner">
                                        {config.firmaUrl ? (
                                            <img src={config.firmaUrl} alt="Firma" className="max-w-full max-h-full object-contain p-2" />
                                        ) : (
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Sin Firma</span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <input
                                            type="file"
                                            id="firma-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                
                                                const formData = new FormData();
                                                formData.append('firma', file);
                                                
                                                try {
                                                    Swal.fire({ title: 'Subiendo firma...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                                                    const res = await api.post('/hotel-config/upload-firma', formData, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    });
                                                    setConfig(prev => ({ ...prev, firmaUrl: res.data.firmaUrl }));
                                                    Swal.fire('Éxito', 'Firma actualizada correctamente', 'success');
                                                } catch (err) {
                                                    Swal.fire('Error', 'No se pudo subir la firma', 'error');
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="firma-upload"
                                            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                        >
                                            <FileText size={16} />
                                            Subir Foto de Firma
                                        </label>
                                        <p className="text-[10px] text-slate-400 font-medium">Recomendado: Fondo blanco o transparente, formato PNG o JPG.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Checklist de Auditoría */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <FileText className="text-blue-600" size={24} />
                                Checklist de Auditoría
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">Defina los ítems que se evaluarán en cada inspección de limpieza periódica.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {config.checklistAuditoria?.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                            const newList = [...config.checklistAuditoria];
                                            newList[index] = e.target.value;
                                            setConfig(prev => ({ ...prev, checklistAuditoria: newList }));
                                        }}
                                        className="block w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newList = config.checklistAuditoria.filter((_, i) => i !== index);
                                        setConfig(prev => ({ ...prev, checklistAuditoria: newList }));
                                    }}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                        
                        <button
                            type="button"
                            onClick={() => {
                                setConfig(prev => ({ 
                                    ...prev, 
                                    checklistAuditoria: [...(prev.checklistAuditoria || []), ''] 
                                }));
                            }}
                            className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-black uppercase hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                        >
                            + Agregar ítem al checklist
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:bg-blue-300"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HotelConfig;
