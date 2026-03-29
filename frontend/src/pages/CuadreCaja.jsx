import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Calendar, 
    Filter, 
    Download, 
    ChevronDown, 
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    CreditCard, 
    Banknote,
    User,
    Clock,
    Tag,
    Receipt
} from 'lucide-react';
import Swal from 'sweetalert2';
import { formatCurrency } from '../utils/format';

const CuadreCaja = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        transacciones: [],
        resumen: {
            total_nequi: 0,
            total_bancolombia: 0,
            total_efectivo: 0,
            total_otros: 0,
            ingresos_totales: 0,
            egresos_totales: 0,
            balance_final: 0
        }
    });

    const [filtros, setFiltros] = useState({
        inicio: new Date().toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchCuadre();
    }, []);

    const fetchCuadre = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(filtros);
            const res = await api.get(`/reportes/cuadre-caja?${params.toString()}`);
            setData(res.data);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el cuadre de caja', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchCuadre();
    };

    const getTypeBadge = (tipo) => {
        const styles = {
            'HOSPEDAJE': 'bg-blue-100 text-blue-700 border-blue-200',
            'VENTA': 'bg-purple-100 text-purple-700 border-purple-200',
            'RESERVA': 'bg-amber-100 text-amber-700 border-amber-200',
            'GASTO': 'bg-red-100 text-red-700 border-red-200',
            'INGRESO MANUAL': 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
        return (
            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${styles[tipo] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {tipo}
            </span>
        );
    };

    const getMedioBadge = (medio) => {
        const normalized = medio.toUpperCase();
        if (normalized === 'NEQUI') return <span className="flex items-center gap-1 text-[#7030a0] font-bold text-xs"><Wallet size={14} /> NEQUI</span>;
        if (normalized.includes('BANCOLOMBIA')) return <span className="flex items-center gap-1 text-[#004481] font-bold text-xs"><CreditCard size={14} /> BANCOLOMBIA</span>;
        if (normalized === 'EFECTIVO') return <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><Banknote size={14} /> EFECTIVO</span>;
        return <span className="text-gray-500 font-bold text-xs uppercase">{medio}</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Cuadre de Caja Consolidado</h1>
                    <p className="text-gray-500 text-sm font-medium">Control total de ingresos y egresos por medio de pago</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn-secondary flex items-center gap-2 text-sm font-bold opacity-50 cursor-not-allowed">
                        <Download size={18} /> Exportar PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Fecha Inicio</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="date" 
                                className="input-field pl-10 py-2 h-10 w-full" 
                                value={filtros.inicio}
                                onChange={e => setFiltros({...filtros, inicio: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Fecha Fin</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="date" 
                                className="input-field pl-10 py-2 h-10 w-full" 
                                value={filtros.fin}
                                onChange={e => setFiltros({...filtros, fin: e.target.value})}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary flex items-center gap-2 h-10 px-6 font-bold shadow-lg shadow-primary-500/20 active:translate-y-0.5 transition-all">
                        <Filter size={18} /> Generar Reporte
                    </button>
                </form>
            </div>

            {/* Resume Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ingresos Totales</p>
                        <p className="text-xl font-black text-emerald-600">${formatCurrency(data.resumen.ingresos_totales)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Egresos Totales</p>
                        <p className="text-xl font-black text-red-600">${formatCurrency(data.resumen.egresos_totales)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Balance en Caja (EF)</p>
                        <p className="text-xl font-black text-blue-600">${formatCurrency(data.resumen.total_efectivo)}</p>
                    </div>
                </div>
                <div className={`p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 ${data.resumen.balance_final >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    <div className="p-3 bg-white/20 text-white rounded-xl">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">Balance Final Consolidado</p>
                        <p className="text-xl font-black">${formatCurrency(data.resumen.balance_final)}</p>
                    </div>
                </div>
            </div>

            {/* Specialized Wallets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#7030a0] flex items-center justify-center text-white shadow-lg shadow-purple-200">
                            <Wallet size={20} />
                        </div>
                        <span className="text-sm font-black text-gray-700">NEQUI</span>
                    </div>
                    <p className="text-2xl font-black text-[#7030a0]">${formatCurrency(data.resumen.total_nequi)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#004481] flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-sm font-black text-gray-700 uppercase">Transferencia Bancolombia</span>
                    </div>
                    <p className="text-2xl font-black text-[#004481]">${formatCurrency(data.resumen.total_bancolombia)}</p>
                </div>
            </div>

            {/* Transaction List */}
            <div className="card shadow-xl border-none overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={16} /> Historial de Movimientos Detallado
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-gray-400">
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Fecha/Hora</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Tipo</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest w-1/3">Descripción</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Usuario</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Medio Pago</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="p-12 text-center text-gray-400 font-bold animate-pulse">Analizando flujos de caja...</td></tr>
                            ) : data.transacciones.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-gray-500 font-medium italic">
                                        No se registraron movimientos en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                data.transacciones.map((t, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="text-xs font-bold text-gray-900 border-l-2 border-primary-500 pl-2">
                                                {new Date(t.fecha).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold pl-2">
                                                {new Date(t.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            {getTypeBadge(t.tipo)}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-bold text-gray-800 line-clamp-1">{t.descripcion}</div>
                                            <div className="text-[10px] text-gray-400 font-medium">Ref ID: {t.id_ref?.slice(-6).toUpperCase()}</div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                <User size={12} className="text-gray-300" /> {t.usuario}
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            {getMedioBadge(t.medioPago)}
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <div className={`text-sm font-black ${t.monto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {t.monto >= 0 ? '+' : '-'}${formatCurrency(Math.abs(t.monto))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CuadreCaja;
