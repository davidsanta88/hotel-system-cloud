import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Mail, MessageCircle, Save, Loader2, ShieldCheck, Settings2, BellRing } from 'lucide-react';

const ConfigNotificaciones = () => {
    const [config, setConfig] = useState({
        email_config: { user: '', pass: '', recipients: '' },
        whatsapp_config: { instance_id: '', token: '', to: '' }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data } = await api.get('/notificaciones/settings');
            setConfig(data);
        } catch (err) {
            console.error('Error al obtener configuración:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            await api.post('/notificaciones/settings', config);
            setMessage({ text: 'Configuración guardada correctamente', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            console.error('Error al guardar:', err);
            setMessage({ text: 'Error al guardar la configuración', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <BellRing className="text-primary-600" size={32} />
                        Configuración de Notificaciones
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configura cómo deseas recibir los avisos de nuevas reservas</p>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    <ShieldCheck size={20} />
                    <span className="font-bold text-sm">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* ─── Email ────────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-gray-50 group-hover:text-primary-50 transition-colors">
                        <Mail size={80} strokeWidth={3} />
                    </div>
                    
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Correo Electrónico</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gmail SMTP Service</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Cuenta Gmail del Hotel</label>
                                <input 
                                    type="email" 
                                    placeholder="hotel@gmail.com"
                                    value={config.email_config.user}
                                    onChange={e => setConfig({...config, email_config: {...config.email_config, user: e.target.value}})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:bg-white focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Contraseña de Aplicación</label>
                                <input 
                                    type="password" 
                                    placeholder="•••• •••• •••• ••••"
                                    value={config.email_config.pass}
                                    onChange={e => setConfig({...config, email_config: {...config.email_config, pass: e.target.value}})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:bg-white focus:border-primary-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 italic">* Usa una "App Password" generada en tu cuenta de Google.</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Correos que recibirán avisos</label>
                                <textarea 
                                    rows="2"
                                    placeholder="admin@hotel.com, recepcion@hotel.com"
                                    value={config.email_config.recipients}
                                    onChange={e => setConfig({...config, email_config: {...config.email_config, recipients: e.target.value}})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:bg-white focus:border-primary-500 outline-none transition-all resize-none"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 italic">Separa múltiples correos por comas.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── WhatsApp ────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-gray-50 group-hover:text-green-50 transition-colors">
                        <MessageCircle size={80} strokeWidth={3} />
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                                <MessageCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">WhatsApp Business</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">UltraMsg / generic api</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">ID de Instancia</label>
                                <input 
                                    type="text" 
                                    placeholder="instance12345"
                                    value={config.whatsapp_config.instance_id}
                                    onChange={e => setConfig({...config, whatsapp_config: {...config.whatsapp_config, instance_id: e.target.value}})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:bg-white focus:border-green-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Token de API</label>
                                <input 
                                    type="password" 
                                    placeholder="abcde12345..."
                                    value={config.whatsapp_config.token}
                                    onChange={e => setConfig({...config, whatsapp_config: {...config.whatsapp_config, token: e.target.value}})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:bg-white focus:border-green-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Celular de Recepción</label>
                                <input 
                                    type="tel" 
                                    placeholder="57321805xxxx"
                                    value={config.whatsapp_config.to}
                                    onChange={e => setConfig({...config, whatsapp_config: {...config.whatsapp_config, to: e.target.value}})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:bg-white focus:border-green-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 italic">* Incluye el código de país (ej: 57 para Colombia).</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 flex justify-center pt-4">
                    <button 
                        disabled={saving}
                        type="submit"
                        className="group flex items-center gap-3 bg-gray-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-primary-600 transition-all shadow-xl shadow-gray-200 hover:shadow-primary-200 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Guardar Configuración
                    </button>
                </div>
            </form>
            
            <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-8 flex items-start gap-4">
                <Settings2 className="text-gray-400 shrink-0" size={24} />
                <div className="space-y-1">
                    <h4 className="font-bold text-gray-800 text-sm italic">Nota de Seguridad</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Estas credenciales se utilizan exclusivamente para enviar alertas internas al equipo del hotel. 
                        Asegúrate de que la cuenta de Gmail tenga habilitada la opción de "Contraseñas de Aplicación" para que el sistema pueda autenticarse correctamente.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConfigNotificaciones;
