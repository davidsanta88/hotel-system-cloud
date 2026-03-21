import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const NotificationOverlay = () => {
    const { user } = useContext(AuthContext);
    const [alerts, setAlerts] = useState([]);
    const [currentAlert, setCurrentAlert] = useState(null);

    useEffect(() => {
        if (user) {
            checkAlerts();
        }
    }, [user]);

    const checkAlerts = async () => {
        try {
            const { data } = await api.get('/notas/mis-alertas');
            if (data && data.length > 0) {
                setAlerts(data);
                setCurrentAlert(data[0]);
            }
        } catch (error) {
            console.error('Error checking alerts:', error);
        }
    };

    const handleMarkAsRead = async () => {
        if (!currentAlert) return;
        try {
            await api.patch(`/notas/${currentAlert.id}/leida`);
            
            // Move to next alert or close
            const remaining = alerts.filter(a => a.id !== currentAlert.id);
            setAlerts(remaining);
            if (remaining.length > 0) {
                setCurrentAlert(remaining[0]);
            } else {
                setCurrentAlert(null);
            }
        } catch (error) {
            console.error('Error marking alert as read:', error);
        }
    };

    const handleClose = () => {
        setCurrentAlert(null);
    };

    if (!currentAlert) return null;

    const getPriorityStyles = (p) => {
        switch(p) {
            case 'Urgente': return 'bg-red-50 border-red-200 text-red-800 ring-red-500/20';
            case 'Alta': return 'bg-orange-50 border-orange-200 text-orange-800 ring-orange-500/20';
            default: return 'bg-blue-50 border-blue-200 text-blue-800 ring-blue-500/20';
        }
    };

    const getIcon = (p) => {
        switch(p) {
            case 'Urgente': return <AlertCircle className="text-red-500" size={32} />;
            case 'Alta': return <Bell className="text-orange-500" size={32} />;
            default: return <Info className="text-blue-500" size={32} />;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-2 p-8 animate-scale-in transition-all ${getPriorityStyles(currentAlert.prioridad)}`}>
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full text-gray-400 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                        {getIcon(currentAlert.prioridad)}
                    </div>
                    
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1 block">
                            Notificación {currentAlert.prioridad}
                        </span>
                        <h2 className="text-2xl font-black">{currentAlert.titulo}</h2>
                    </div>

                    <p className="text-sm font-medium leading-relaxed opacity-80 py-2">
                        {currentAlert.descripcion}
                    </p>

                    <div className="w-full pt-6 flex flex-col gap-3">
                        <button 
                            onClick={handleMarkAsRead}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                            <CheckCircle size={18} />
                            Entendido / Marcar como leído
                        </button>
                        
                        {alerts.length > 1 && (
                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                                Tienes {alerts.length - 1} alerta(s) más pendiente(s)
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationOverlay;
