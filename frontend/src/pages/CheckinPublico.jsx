import React, { useState } from 'react';
import axios from 'axios';
import { 
    User, 
    Smartphone, 
    Mail, 
    MapPin, 
    Calendar, 
    Hotel, 
    Send, 
    CheckCircle2, 
    Loader2,
    Fingerprint
} from 'lucide-react';

const CheckinPublico = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        documento: '',
        celular: '',
        correo: '',
        procedencia: '',
        fecha_llegada: new Date().toISOString().split('T')[0],
        habitacion_numero: ''
    });
    const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, ERROR
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('LOADING');
        try {
            // Usamos axios directo porque esta ruta es pública y no requiere el interceptor de auth
            await axios.post('http://localhost:5000/api/checkin-digital/public', formData);
            setStatus('SUCCESS');
        } catch (err) {
            console.error('Error in public checkin:', err);
            setStatus('ERROR');
            setMessage('Hubo un error al enviar el registro. Por favor, intenta de nuevo.');
        }
    };

    if (status === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
                <div className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200 text-center max-w-sm w-full space-y-6">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-green-100 animate-bounce">
                        <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Bienvenido!</h2>
                        <p className="text-slate-500 font-medium">Tu registro ha sido enviado con éxito a la recepción. ¡Disfruta tu estadía!</p>
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-100 hover:bg-slate-800 transition-colors"
                    >
                        Hacer otro registro
                    </button>
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Hotel Balcón Plaza</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

            <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden relative z-10 animate-in slide-in-from-bottom-8 duration-700">
                <div className="bg-slate-900 p-8 text-center space-y-2">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 border border-white/10">
                        <Hotel size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Registro Digital</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Bienvenido al Hotel Balcón Plaza</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="group space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="Juan Pérez"
                                    value={formData.nombre}
                                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:bg-white focus:border-slate-900 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="group space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento</label>
                                <div className="relative">
                                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={18} />
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="12345..."
                                        value={formData.documento}
                                        onChange={e => setFormData({...formData, documento: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:bg-white focus:border-slate-900 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="group space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Celular</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={18} />
                                    <input 
                                        required
                                        type="tel" 
                                        placeholder="321..."
                                        value={formData.celular}
                                        onChange={e => setFormData({...formData, celular: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:bg-white focus:border-slate-900 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="group space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad de Procedencia</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="Bogotá, Manizales..."
                                    value={formData.procedencia}
                                    onChange={e => setFormData({...formData, procedencia: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:bg-white focus:border-slate-900 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="group space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Habitación asignada</label>
                            <div className="relative">
                                <Hotel className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="Ej: 201"
                                    value={formData.habitacion_numero}
                                    onChange={e => setFormData({...formData, habitacion_numero: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:bg-white focus:border-slate-900 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {status === 'ERROR' && (
                            <p className="text-red-500 text-xs font-bold text-center py-2 bg-red-50 rounded-xl border border-red-100 animate-in shake">
                                {message}
                            </p>
                        )}

                        <button 
                            disabled={status === 'LOADING'}
                            type="submit"
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all mt-4 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {status === 'LOADING' ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            Completar Registro
                        </button>
                    </form>
                </div>
            </div>
            
            <p className="mt-8 text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                Procesado de forma segura
            </p>
        </div>
    );
};

export default CheckinPublico;
