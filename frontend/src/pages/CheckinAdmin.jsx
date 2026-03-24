import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Users, 
    CheckCircle2, 
    XCircle, 
    Smartphone, 
    Mail, 
    MapPin, 
    Calendar, 
    Loader2,
    RefreshCw,
    QrCode
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CheckinAdmin = () => {
    const [checkins, setCheckins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCheckins();
    }, []);

    const fetchCheckins = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/checkin-digital');
            setCheckins(data);
        } catch (err) {
            console.error('Error fetching checkins:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatus = async (id, status) => {
        try {
            await api.put(`/checkin-digital/${id}`, { estado: status });
            fetchCheckins();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <QrCode className="text-primary-600" size={32} />
                        Registros Digitales (QR)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Solicitudes de ingreso enviadas por huéspedes desde su móvil</p>
                </div>
                
                <button 
                    onClick={fetchCheckins}
                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw size={20} className="text-gray-600" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {checkins.map(item => (
                    <div key={item.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                        <div className="p-8 space-y-6 flex-1">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{item.nombre}</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">C.C. {item.documento}</p>
                                </div>
                                <div className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Pendiente
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><Smartphone size={16} /></div>
                                    {item.celular}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><MapPin size={16} /></div>
                                    Procede de: <span className="text-gray-900 font-bold ml-1">{item.procedencia}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><Calendar size={16} /></div>
                                    Llegada: <span className="text-gray-900 font-bold ml-1">{format(new Date(item.fecha_llegada), "dd MMM, yyyy", { locale: es })}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hab. Solicitada</span>
                                <span className="text-xl font-black text-slate-900">{item.habitacion_numero}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleStatus(item.id, 'PROCESADO')}
                                className="bg-white border border-gray-200 text-gray-400 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:text-red-500 hover:bg-white transition-all flex items-center justify-center gap-2"
                            >
                                <XCircle size={16} />
                                Descartar
                            </button>
                            <button 
                                onClick={() => handleStatus(item.id, 'PROCESADO')}
                                className="bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} />
                                Procesar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {checkins.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-100 max-w-2xl mx-auto w-full">
                    <QrCode size={64} className="mx-auto text-gray-100 mb-6" />
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Sin registros pendientes</h3>
                    <p className="text-gray-400 text-sm font-medium mt-1">Los registros enviados vía QR aparecerán aquí.</p>
                </div>
            )}
        </div>
    );
};

export default CheckinAdmin;
