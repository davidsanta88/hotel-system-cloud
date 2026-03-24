import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Phone, Mail, User, Calendar, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Solicitudes = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSolicitudes = async () => {
        try {
            const { data } = await api.get('/solicitudes');
            setSolicitudes(data);
        } catch (err) {
            console.error('Error fetching solicitudes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSolicitudes();
    }, []);

    const cambiarEstado = async (id, nuevoEstado) => {
        try {
            await api.put(`/solicitudes/${id}`, { estado: nuevoEstado });
            fetchSolicitudes();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Cargando solicitudes...</div>;

    return (
        <div className="space-y-6 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Solicitudes de Reserva</h1>
                    <p className="text-sm text-gray-500 mt-1">Clientes que solicitaron ser contactados desde la Landing Page</p>
                </div>
                <div className="bg-primary-50 px-4 py-2 rounded-xl border border-primary-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-600 rounded-full animate-ping" />
                    <span className="text-xs font-black text-primary-700 uppercase tracking-widest">
                        {solicitudes.filter(s => s.estado === 'PENDIENTE').length} Pendientes
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {solicitudes.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
                        <p className="text-gray-300 font-medium">No hay solicitudes registradas aún.</p>
                    </div>
                ) : (
                    solicitudes.map((s) => (
                        <div key={s.id} className={`bg-white rounded-2xl p-6 shadow-sm border-l-8 transition-all hover:shadow-md ${s.estado === 'PENDIENTE' ? 'border-accent-400' : 'border-gray-200'}`}>
                            <div className="flex flex-col lg:flex-row justify-between gap-6">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</p>
                                            <p className="font-bold text-gray-800">{s.nombre || 'Sin nombre'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                                            <Phone size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-800">{s.celular}</p>
                                                <a 
                                                    href={`https://wa.me/${s.celular.replace(/\D/g, '')}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-sm"
                                                    title="Escribir por WhatsApp"
                                                >
                                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                    </svg>
                                                </a>
                                            </div>
                                            <p className="text-xs text-gray-500">{s.correo || 'Sin correo'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-hotel-green/10 text-hotel-green flex items-center justify-center shrink-0">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan de Estadía</p>
                                            <p className="font-bold text-gray-800">{s.fecha_llegada ? format(new Date(s.fecha_llegada), 'dd/MM/yyyy') : 'Pendiente'}</p>
                                            <p className="text-xs text-gray-500">{s.num_huespedes} Huéspedes</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Solicitud enviada</p>
                                            <p className="font-medium text-gray-800 text-sm">{format(new Date(s.created_at), 'dd MMM, hh:mm a')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {s.estado === 'PENDIENTE' ? (
                                        <button 
                                            onClick={() => cambiarEstado(s.id, 'CONTACTADO')}
                                            className="whitespace-nowrap px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-900/20"
                                        >
                                            Marcar como Contactado
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-hotel-green bg-hotel-green/10 px-4 py-2 rounded-xl border border-hotel-green/20">
                                            <CheckCircle size={18} />
                                            <span className="font-black text-xs uppercase tracking-widest">Contactado</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {s.notas && (
                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Observación</p>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl italic">"{s.notas}"</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Solicitudes;
