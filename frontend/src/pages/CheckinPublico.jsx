import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
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
        tipoDocumento: 'CC',
        celular: '',
        correo: '',
        procedencia: '',
        municipioId: '',
        notas: '',
        fechaLlegada: new Date().toISOString().split('T')[0],
        habitacionNumero: ''
    });
    const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, ERROR
    const [message, setMessage] = useState('');
    const [municipios, setMunicipios] = useState([]);
    const [selectedMunicipio, setSelectedMunicipio] = useState(null);

    useEffect(() => {
        const fetchMunicipios = async () => {
            try {
                const res = await axios.get('/api/municipios/public');
                // Formatear para react-select
                const options = res.data.map(m => ({
                    value: m._id,
                    label: m.nombre // Ya viene como "DEPARTAMENTO - MUNICIPIO"
                }));
                setMunicipios(options);
            } catch (err) {
                console.error('Error fetching municipios:', err);
            }
        };
        fetchMunicipios();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const submitData = {
            ...formData,
            municipioId: selectedMunicipio ? selectedMunicipio.value : '',
            procedencia: selectedMunicipio ? selectedMunicipio.label : ''
        };

        if (!submitData.municipioId) {
            setStatus('ERROR');
            setMessage('Por favor selecciona tu ciudad de procedencia.');
            return;
        }

        setStatus('LOADING');
        try {
            await axios.post('/api/checkin-digital/public', submitData);
            setStatus('SUCCESS');
        } catch (err) {
            console.error('Error in public checkin:', err);
            setStatus('ERROR');
            setMessage('Hubo un error al enviar el registro. Por favor, intenta de nuevo.');
        }
    };

    // Estilos personalizados para react-select
    const customStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: '#f8fafc', // slate-50
            border: state.isFocused ? '1px solid #0f172a' : '1px solid #f1f5f9',
            borderRadius: '1rem',
            padding: '4px 8px 4px 40px',
            fontSize: '0.875rem',
            boxShadow: 'none',
            '&:hover': {
                border: '1px solid #0f172a'
            }
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#0f172a' : state.isFocused ? '#f1f5f9' : 'white',
            color: state.isSelected ? 'white' : '#475569',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            padding: '12px'
        }),
        placeholder: (base) => ({
            ...base,
            color: '#cbd5e1',
            fontWeight: '500'
        }),
        singleValue: (base) => ({
            ...base,
            color: '#0f172a',
            fontWeight: '700',
            textTransform: 'uppercase'
        }),
        menu: (base) => ({
            ...base,
            borderRadius: '1.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            border: '1px solid #f1f5f9'
        })
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
            <div className="absolute top-0 left-0 w-64 h-64 bg-slate-800/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

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
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Habitación asignada</label>
                            <div className="relative">
                                <Hotel size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="Ej: 201"
                                    value={formData.habitacionNumero}
                                    onChange={e => setFormData({...formData, habitacionNumero: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:bg-white focus:border-slate-900 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="group space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="JUAN PÉREZ"
                                    value={formData.nombre}
                                    onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:bg-white focus:border-slate-900 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="group space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Doc.</label>
                                <select 
                                    required
                                    value={formData.tipoDocumento}
                                    onChange={e => setFormData({...formData, tipoDocumento: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm outline-none focus:bg-white focus:border-slate-900 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    <option value="CC">CÉDULA</option>
                                    <option value="CE">EXTRANJERÍA</option>
                                    <option value="PASAPORTE">PASAPORTE</option>
                                    <option value="TI">T. IDENTIDAD</option>
                                    <option value="NIT">NIT</option>
                                </select>
                            </div>
                            <div className="group space-y-1 text-left">
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

                        <div className="group space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas / Observaciones Especiales</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={18} />
                                <textarea 
                                    rows="2"
                                    placeholder="Ej: Llegaré tarde, necesito cuna..."
                                    value={formData.notas}
                                    onChange={e => setFormData({...formData, notas: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:bg-white focus:border-slate-900 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="group space-y-1 pb-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad de Origen / Municipio</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10" size={18} />
                                <Select 
                                    placeholder="Busca tu ciudad..."
                                    options={municipios}
                                    value={selectedMunicipio}
                                    onChange={setSelectedMunicipio}
                                    styles={customStyles}
                                    noOptionsMessage={() => "No se encontró el municipio"}
                                    menuPlacement="auto"
                                    className="relative z-0"
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
