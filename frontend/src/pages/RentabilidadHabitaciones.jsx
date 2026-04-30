import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
    TrendingUp, 
    Calendar, 
    Download, 
    Award,
    Hotel,
    RefreshCw,
    Activity,
    BarChart3,
    PieChart as PieChartIcon,
    Layers,
    Percent
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { formatCurrency } from '../utils/format';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';

const RentabilidadHabitaciones = () => {
    const [loading, setLoading] = useState(true);
    const [habitaciones, setHabitaciones] = useState([]);
    const [searchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState(searchParams.get('mode') === 'consolidated' ? 'consolidated' : 'individual');
    const [filtros, setFiltros] = useState({
        inicio: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        fin: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'consolidated') {
            setViewMode('consolidated');
        } else if (mode === 'individual') {
            setViewMode('individual');
        }
    }, [searchParams]);

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

    // Resumen por tipo de habitación
    const summaryByType = useMemo(() => {
        const types = {};
        habitaciones.forEach(h => {
            const type = h.tipo || 'Standard';
            if (!types[type]) {
                types[type] = { count: 0, total: 0, occupancy: 0, uses: 0 };
            }
            types[type].count += 1;
            types[type].total += h.total;
            types[type].occupancy += h.porcentajeOcupacion || 0;
            types[type].uses += h.numReservas || 0;
        });

        return Object.entries(types).map(([name, data]) => ({
            name,
            total: data.total,
            avgOccupancy: Math.round(data.occupancy / data.count),
            avgProfit: Math.round(data.total / data.count)
        })).sort((a, b) => b.total - a.total);
    }, [habitaciones]);

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
            'Ocupación %': h.porcentajeOcupacion || 0,
            'N° Registros': h.numReservas || 0
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
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <Award size={24} />
                        </div>
                        Rentabilidad Estratégica
                    </h1>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider italic">Análisis de activos y rendimiento</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
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
                            className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-28"
                            value={filtros.inicio}
                            onChange={e => setFiltros({...filtros, inicio: e.target.value})}
                        />
                        <span className="text-gray-300">-</span>
                        <input 
                            type="date" 
                            className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-28"
                            value={filtros.fin}
                            onChange={e => setFiltros({...filtros, fin: e.target.value})}
                        />
                    </div>

                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg text-xs"
                    >
                        <Download size={16} />
                        EXCEL
                    </button>
                    
                    <button onClick={fetchData} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Top Stats Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                                    <div className="flex flex-col items-end">
                                        <span className="text-3xl font-black opacity-20"># {idx + 1}</span>
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${idx === 0 ? 'bg-white/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <Percent size={10} />
                                            {h.porcentajeOcupacion || 0}% Ocupación
                                        </div>
                                    </div>
                                </div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${idx === 0 ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    Habitación {h.numero} {h.hotel ? `(${h.hotel})` : ''}
                                </p>
                                <h3 className="text-3xl font-black mt-1 mb-3 tracking-tighter">{formatCurrency(h.total)}</h3>
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp size={16} className={idx === 0 ? 'text-emerald-300' : 'text-emerald-500'} />
                                    <span className="text-xs font-bold italic">{h.numReservas || 0} registros registrados</span>
                                </div>
                            </div>
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-5 rounded-full"></div>
                        </div>
                    ))}
                </div>

                {/* Summary By Type Card */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <Layers size={20} className="text-amber-400" />
                        <h4 className="text-sm font-black uppercase tracking-wider">Por Tipo</h4>
                    </div>
                    <div className="space-y-4 flex-1">
                        {summaryByType.slice(0, 4).map((type, i) => (
                            <div key={i} className="flex flex-col">
                                <div className="flex justify-between text-[11px] font-black uppercase mb-1">
                                    <span>{type.name}</span>
                                    <span className="text-amber-400">{type.avgOccupancy}% Ocup.</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${type.avgOccupancy}%` }}></div>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
                                    <span>{formatCurrency(type.total)} total</span>
                                    <span className="italic">Avg: {formatCurrency(type.avgProfit)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Visual Chart & Detailed List */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Comparison Chart */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 size={20} className="text-indigo-600" />
                        <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">Top 10 Rendimiento</h4>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={habitaciones.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="numero" 
                                    type="category" 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                                    width={40}
                                />
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                    {habitaciones.slice(0, 10).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table List */}
                <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-gray-100">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-5 text-center">Rango</th>
                                    <th className="px-6 py-5">Habitación</th>
                                    <th className="px-6 py-5">Tipo / Mix</th>
                                    <th className="px-6 py-5 text-right">Ocupación %</th>
                                    <th className="px-6 py-5 text-right">Total Generado</th>
                                    <th className="px-6 py-5 text-right">Prom. Diario</th>
                                    <th className="px-6 py-5 text-center">Registros</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    Array(6).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                        </tr>
                                    ))
                                ) : habitaciones.map((h, idx) => {
                                    const rentPct = Math.round(((h.ingresosHospedaje || 0) / h.total) * 100) || 0;
                                    const shopPct = 100 - rentPct;
                                    
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${
                                                    idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 text-lg">Hab {h.numero}</span>
                                                    {viewMode === 'consolidated' && (
                                                        <span className={`text-[8px] font-black uppercase ${h.hotel === 'Plaza' ? 'text-indigo-500' : 'text-orange-500'}`}>
                                                            {h.hotel}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1 w-32">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase">{h.tipo || 'Doble'}</span>
                                                    <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
                                                        <div className="bg-indigo-500 h-full" style={{ width: `${rentPct}%` }} title="Hospedaje"></div>
                                                        <div className="bg-amber-400 h-full" style={{ width: `${shopPct}%` }} title="Tienda"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-sm font-black ${h.porcentajeOcupacion > 70 ? 'text-emerald-600' : h.porcentajeOcupacion > 40 ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                        {h.porcentajeOcupacion}%
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{h.nochesOcupadas || 0} noches</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-base font-black text-indigo-600 tracking-tighter">
                                                        {formatCurrency(h.total)}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-emerald-600">Avg. Uso: {formatCurrency(Math.round(h.total / (h.numReservas || 1)))}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-sm font-black text-amber-600">
                                                    {formatCurrency(Math.round(h.promedioDia || 0))}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-1.5 bg-slate-100 py-1 px-3 rounded-full mx-auto w-fit">
                                                    <Activity size={12} className="text-indigo-500" />
                                                    <span className="text-xs font-black text-gray-700">{h.numReservas || 0}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentabilidadHabitaciones;
