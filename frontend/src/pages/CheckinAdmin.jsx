import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import Swal from 'sweetalert2';
import { Trash2 } from 'lucide-react';

const CheckinAdmin = () => {
    const navigate = useNavigate();
    const [checkins, setCheckins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showQrModal, setShowQrModal] = useState(false);

    const publicUrl = `https://hotelbalconplaza.com/checkin`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;

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
            if (status === 'PROCESADO') {
                await Swal.fire({
                    icon: 'success',
                    title: '¡Procesado!',
                    text: 'El registro se ha procesado con éxito. Ya puedes encontrarlo en la pantalla de Clientes.',
                    timer: 3000,
                    showConfirmButton: false
                });
                navigate('/clientes');
            } else {
                fetchCheckins();
            }
        } catch (err) {
            console.error('Error updating status:', err);
            Swal.fire('Error', 'No se pudo procesar el registro', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar registro?',
            text: 'Esta acción no se puede deshacer y el registro desaparecerá del todo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/checkin-digital/${id}`);
            setCheckins(prev => prev.filter(c => c._id !== id && c.id !== id));
            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El registro ha sido eliminado correctamente.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Error deleting checkin:', err);
            Swal.fire('Error', 'No se pudo eliminar el registro', 'error');
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
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowQrModal(true)}
                        className="btn-primary py-2.5 px-6 flex items-center gap-2 shadow-lg hover:-translate-y-1 transition-all"
                    >
                        <QrCode size={20} />
                        Ver Código QR
                    </button>
                    <button 
                        onClick={fetchCheckins}
                        className="p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                        title="Refrescar Lista"
                    >
                        <RefreshCw size={20} className="text-gray-400" />
                    </button>
                </div>
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
                                <div className="flex flex-col items-end gap-2">
                                    {item.estado === 'PENDIENTE' ? (
                                        <div className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Pendiente
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Procesado
                                        </div>
                                    )}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item._id);
                                        }}
                                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                        title="Eliminar registro"
                                    >
                                        <Trash2 size={16} />
                                    </button>
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
                                    Llegada: <span className="text-gray-900 font-bold ml-1">
                                        {item.fechaLlegada ? format(new Date(item.fechaLlegada), "dd MMM, yyyy", { locale: es }) : 'Fecha no disp.'}
                                    </span>
                                </div>
                            </div>

                            { (item.notas || item.observaciones) && (
                                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Nota del Huésped:</span>
                                    <p className="text-xs text-amber-900 font-medium italic">"{item.notas || item.observaciones}"</p>
                                </div>
                            )}

                            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hab. Solicitada</span>
                                <span className="text-xl font-black text-slate-900">{item.habitacionNumero || 'S/N'}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleDelete(item._id || item.id)}
                                className="bg-white border border-gray-200 text-gray-400 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
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

            {/* Modal de Código QR */}
            {showQrModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900">Código QR para Huéspedes</h3>
                                <p className="text-sm text-gray-500 px-4">Muestra este código al huésped para que llene su ficha de ingreso digitalmente</p>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 inline-block mx-auto relative group">
                                <img 
                                    src={qrUrl} 
                                    alt="QR Checkin" 
                                    className="w-64 h-64 object-contain"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/40">
                                   <Smartphone size={32} className="text-primary-600 animate-bounce" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-4">
                                <div className="space-y-2 text-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xs font-black">1</div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Escanea</p>
                                </div>
                                <div className="space-y-2 text-center">
                                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto text-xs font-black">2</div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Registra</p>
                                </div>
                                <div className="space-y-2 text-center">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xs font-black">3</div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Procesa</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                            <button 
                                onClick={() => setShowQrModal(false)}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckinAdmin;
