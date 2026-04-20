import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { Save, Building2, Phone, Mail, MapPin, FileText, Info, CreditCard, Globe, Quote, X, DollarSign } from 'lucide-react';

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
