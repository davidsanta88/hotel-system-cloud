import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    TrendingUp, 
    Calendar, 
    Filter, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    Star,
    Award,
    Hotel,
    DollarSign,
    RefreshCw,
    Activity
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { formatCurrency } from '../utils/format';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const RentabilidadHabitaciones = () => {
    const [loading, setLoading] = useState(true);
    const [habitaciones, setHabitaciones] = useState([]);
    const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'consolidated'
    const [filtros, setFiltros] = useState({
        inicio: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        fin: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => {
        fetchData();
    }, [filtros, viewMode]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const endpoint = viewMode === 'individual'
                ? `/reportes/rentabilidad-habitaciones?inicio=${filtros.inicio}&fin=${filtros.fin}`
                : `/reportes/rentabilidad-habitaciones-consolidado?inicio=${filtros.inicio}&fin=${filtros.fin}`;
            
            const res = await api.get(endpoint);
            if (Array.isArray(res.data)) {
                setHabitaciones(res.data);
            } else {
                setHabitaciones([]);
            }
        } catch (error) {
            console.error('Error fetching room profitability:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        const dataToExport = habitaciones.map((h, idx) => ({
            'Ranking': idx + 1,
            'Hotel': h.hotel || 'Plaza',
            'Habitación': h.numero,
            'Tipo': h.tipo || '',
            'Ingresos Hospedaje': h.ingresosHospedaje || 0,
            'Ingresos Ventas': h.ingresosVentas || 0,
            'Total Generado': h.total,
            'Promedio/Día': Math.round(h.promedioDia || 0),
            'N° Registros': h.numReservas || 0,
            'Promedio x Uso': h.numReservas > 0 ? Math.round(h.total / h.numReservas) : 0
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rentabilidad");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `Rentabilidad_Habitaciones_${filtros.inicio}_a_${filtros.fin}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <Award size={24} />
                        </div>
                        Rentabilidad por Habitación
                    </h1>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider italic">Ranking de las habitaciones más productivas</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                        <button 
                            onClick={() => setViewMode('individual')}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'individual' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            ESTE HOTEL
                        </button>
                        <button 
                            onClick={() => setViewMode('consolidated')}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'consolidated' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            CONSOLIDADO
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <Calendar size={16} className="text-gray-400" />
                        <input 
                            type="date" 
                            className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-32"
                            value={filtros.inicio}
                            onChange={e => setFiltros({...filtros, inicio: e.target.value})}
                        />
                        <span className="text-gray-300">-</span>
                        <input 
                            type="date" 
                            className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-32"
                            value={filtros.fin}
                            onChange={e => setFiltros({...filtros, fin: e.target.value})}
                        />
                    </div>

                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm"
                    >
                        <Download size={18} />
                        Excel
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top 3 Cards */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {habitaciones.slice(0, 3).map((h, idx) => (
                        <div key={idx} className={`relative overflow-hidden p-6 rounded-3xl border shadow-xl transition-all hover:-translate-y-1 ${
                            idx === 0 ? 'bg-indigo-600 text-white border-indigo-400' : 
                            idx === 1 ? 'bg-white text-slate-900 border-gray-100' : 
                            'bg-white text-slate-900 border-gray-100'
                        }`}>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-xl ${idx === 0 ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <Hotel size={24} />
                                    </div>
                                    <span className={`text-4xl font-black opacity-20`}># {idx + 1}</span>
                                </div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${idx === 0 ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    Habitación {h.numero} {h.hotel ? `(${h.hotel})` : ''}
                                </p>
                                <h3 className="text-3xl font-black mt-1 mb-3">{formatCurrency(h.total)}</h3>
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp size={16} className={idx === 0 ? 'text-emerald-300' : 'text-emerald-500'} />
                                    <span className="text-xs font-bold italic">{h.numReservas || 0} registros en el periodo</span>
                                </div>
                                {h.numReservas > 0 && (
                                    <div className={`text-[10px] font-black uppercase tracking-wider mt-2 ${idx === 0 ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        Prom. x uso: <span className={`font-black ${idx === 0 ? 'text-white' : 'text-indigo-600'}`}>{formatCurrency(Math.round(h.total / h.numReservas))}</span>
                                    </div>
                                )}
                            </div>
                            {/* Decorative background shape */}
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-5 rounded-full"></div>
                        </div>
                    ))}
                </div>

                {/* List Table */}
                <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-gray-100">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-5 text-center">Rango</th>
                                    <th className="px-6 py-5">Habitación</th>
                                    {viewMode === 'consolidated' && <th className="px-6 py-5">Hotel</th>}
                                    <th className="px-6 py-5">Tipo</th>
                                    <th className="px-6 py-5 text-right">Ing. Hospedaje</th>
                                    <th className="px-6 py-5 text-right">Ing. Tienda</th>
                                    <th className="px-6 py-5 text-right">Total Generado</th>
                                    <th className="px-6 py-5 text-right">Promedio Diario</th>
                                    <th className="px-6 py-5 text-right">Prom. x Uso</th>
                                    <th className="px-6 py-5 text-center">N° Usos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={viewMode === 'consolidated' ? 8 : 7} className="px-6 py-4">
                                                <div className="h-4 bg-gray-100 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : habitaciones.map((h, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${
                                                idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-black text-slate-800 text-lg">Hab {h.numero}</span>
                                        </td>
                                        {viewMode === 'consolidated' && (
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${h.hotel === 'Plaza' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {h.hotel}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-500 uppercase">{h.tipo || 'Standard'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-bold text-slate-600">{formatCurrency(h.ingresosHospedaje || 0)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-bold text-slate-600">{formatCurrency(h.ingresosVentas || 0)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-indigo-600 group-hover:scale-110 transition-transform inline-block">
                                                {formatCurrency(h.total)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-amber-600">
                                                {formatCurrency(Math.round(h.promedioDia || 0))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-black text-emerald-600">
                                                {h.numReservas > 0 ? formatCurrency(Math.round(h.total / h.numReservas)) : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Activity size={14} className="text-emerald-500" />
                                                <span className="text-xs font-black text-gray-700">{h.numReservas || 0}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentabilidadHabitaciones;
