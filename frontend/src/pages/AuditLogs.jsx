import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    ShieldCheck, 
    History, 
    User, 
    Activity, 
    Clock, 
    Info, 
    Loader2, 
    RefreshCw,
    Search,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLog, setExpandedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/auditoria/logs');
            setLogs(data);
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'POST': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PUT': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'PATCH': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredLogs = logs.filter(log => 
        log.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.modulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.accion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <ShieldCheck className="text-primary-600" size={32} />
                        Auditoría de Usuarios
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Registro de todas las acciones importantes realizadas en el sistema</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por usuario o módulo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-primary-500 outline-none transition-all w-full md:w-64"
                        />
                    </div>
                    <button 
                        onClick={fetchLogs}
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        title="Refrescar"
                    >
                        <RefreshCw size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha y Hora</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Módulo</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">IP</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLogs.map(log => (
                                <React.Fragment key={log.id}>
                                    <tr className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <Clock size={16} className="text-gray-400" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700">
                                                        {format(new Date(log.created_at), "dd MMM yyyy", { locale: es })}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {format(new Date(log.created_at), "HH:mm:ss")}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                                                    <User size={14} />
                                                </div>
                                                <span className="text-sm font-black text-gray-800 tracking-tight">{log.usuario_nombre || 'Sistema'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${getActionColor(log.accion)}`}>
                                                {log.accion}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Activity size={14} />
                                                <span className="text-sm font-bold capitalize">{log.modulo}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs font-medium text-gray-500 font-mono tracking-tighter bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                                                {log.ip_address}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                                                {expandedLog === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedLog === log.id && (
                                        <tr className="bg-gray-50/20">
                                            <td colSpan="6" className="px-6 py-6 animate-in slide-in-from-top-2 duration-300">
                                                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-50 pb-2">
                                                        <Info size={14} /> Datos Técnicos de la Operación
                                                    </div>
                                                    <pre className="text-[11px] font-mono text-gray-600 bg-gray-50 p-6 rounded-2xl overflow-x-auto border border-gray-100 custom-scrollbar leading-relaxed">
                                                        {JSON.stringify(JSON.parse(log.detalle || '{}'), null, 2)}
                                                    </pre>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredLogs.length === 0 && (
                    <div className="text-center py-20">
                        <History size={48} className="mx-auto text-gray-100 mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No se encontraron registros de auditoría</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
