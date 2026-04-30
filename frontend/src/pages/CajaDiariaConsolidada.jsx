import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
    Calendar, 
    Filter, 
    Download, 
    FileText, 
    TrendingUp, 
    TrendingDown, 
    Activity,
    RefreshCw,
    Hotel,
    ArrowLeft,
    PieChart,
    BarChart3,
    Percent,
    ShoppingCart,
    CreditCard,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { formatCurrency } from '../utils/format';
import { format, startOfMonth, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

const CajaDiariaConsolidada = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ plaza: { history: [] }, colonial: { history: [] } });
    const [viewMode, setViewMode] = useState('all'); // 'all', 'plaza', 'colonial'
    const [detailedView, setDetailedView] = useState(false);

    const [filtros, setFiltros] = useState({
        inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        fin: format(addDays(new Date(), 1), 'yyyy-MM-dd')
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/stats/comparative?inicio=${filtros.inicio}&fin=${filtros.fin}`);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching comparative stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const mergedData = useMemo(() => {
        const plazaHistory = data.plaza?.history || [];
        const colonialHistory = data.colonial?.history || [];
        
        const map = new Map();
        
        plazaHistory.forEach(item => {
            map.set(item.label, {
                label: item.label,
                plaza: { 
                    ingresos: item.ingresos, 
                    hospedaje: item.hospedaje || 0,
                    tienda: item.tienda || 0,
                    otros: item.otros || 0,
                    egresos: item.egresos, 
                    neto: item.margen,
                    pct: item.ingresos > 0 ? (item.margen / item.ingresos) * 100 : 0,
                    ocupacion: item.ocupacion || 0,
                    sortKey: item.sortKey
                },
                colonial: { ingresos: 0, hospedaje: 0, tienda: 0, otros: 0, egresos: 0, neto: 0, pct: 0, ocupacion: 0 },
                total: { 
                    ingresos: item.ingresos, 
                    hospedaje: item.hospedaje || 0,
                    tienda: item.tienda || 0,
                    otros: item.otros || 0,
                    egresos: item.egresos, 
                    neto: item.margen,
                    pct: item.ingresos > 0 ? (item.margen / item.ingresos) * 100 : 0,
                    ocupacion: item.ocupacion || 0,
                    sortKey: item.sortKey
                }
            });
        });

        colonialHistory.forEach(item => {
            const existing = map.get(item.label) || {
                label: item.label,
                plaza: { ingresos: 0, hospedaje: 0, tienda: 0, otros: 0, egresos: 0, neto: 0, pct: 0, ocupacion: 0 },
                colonial: { ingresos: 0, hospedaje: 0, tienda: 0, otros: 0, egresos: 0, neto: 0, pct: 0, ocupacion: 0 },
                total: { ingresos: 0, hospedaje: 0, tienda: 0, otros: 0, egresos: 0, neto: 0, pct: 0, ocupacion: 0 }
            };

            existing.colonial = {
                ingresos: item.ingresos,
                hospedaje: item.hospedaje || 0,
                tienda: item.tienda || 0,
                otros: item.otros || 0,
                egresos: item.egresos,
                neto: item.margen,
                pct: item.ingresos > 0 ? (item.margen / item.ingresos) * 100 : 0,
                ocupacion: item.ocupacion || 0,
                sortKey: item.sortKey
            };

            existing.total.ingresos += item.ingresos;
            existing.total.hospedaje += (item.hospedaje || 0);
            existing.total.tienda += (item.tienda || 0);
            existing.total.otros += (item.otros || 0);
            existing.total.egresos += item.egresos;
            existing.total.neto += item.margen;
            existing.total.pct = existing.total.ingresos > 0 ? (existing.total.neto / existing.total.ingresos) * 100 : 0;
            
            // Promedio de ocupación si ambos hoteles están cargados
            const countHotels = (existing.plaza.ingresos > 0 || existing.plaza.ocupacion > 0 ? 1 : 0) + (existing.colonial.ingresos > 0 || existing.colonial.ocupacion > 0 ? 1 : 0);
            existing.total.ocupacion = (existing.plaza.ocupacion + existing.colonial.ocupacion) / (countHotels || 1);
            existing.total.sortKey = item.sortKey;

            map.set(item.label, existing);
        });

        return Array.from(map.values()).sort((a, b) => {
            const valA = a.plaza.sortKey || a.label;
            const valB = b.plaza.sortKey || b.label;
            
            // Si es string (fecha YYYY-MM-DD), comparar como string
            // Si es número (mes), comparar como número
            if (typeof valA === 'string') return valB.localeCompare(valA);
            return valB - valA;
        });
    }, [data]);

    const chartData = useMemo(() => {
        return [...mergedData].reverse();
    }, [mergedData]);

    const totals = useMemo(() => {
        const res = mergedData.reduce((acc, curr) => {
            acc.plaza.ingresos += curr.plaza.ingresos;
            acc.plaza.hospedaje += curr.plaza.hospedaje;
            acc.plaza.tienda += curr.plaza.tienda;
            acc.plaza.egresos += curr.plaza.egresos;
            acc.plaza.neto += curr.plaza.neto;
            acc.plaza.sumOcupacion += curr.plaza.ocupacion;
            
            acc.colonial.ingresos += curr.colonial.ingresos;
            acc.colonial.hospedaje += curr.colonial.hospedaje;
            acc.colonial.tienda += curr.colonial.tienda;
            acc.colonial.egresos += curr.colonial.egresos;
            acc.colonial.neto += curr.colonial.neto;
            acc.colonial.sumOcupacion += curr.colonial.ocupacion;
            
            acc.total.ingresos += curr.total.ingresos;
            acc.total.hospedaje += curr.total.hospedaje;
            acc.total.tienda += curr.total.tienda;
            acc.total.egresos += curr.total.egresos;
            acc.total.neto += curr.total.neto;
            acc.total.sumOcupacion += curr.total.ocupacion;
            
            return acc;
        }, {
            plaza: { ingresos: 0, hospedaje: 0, tienda: 0, egresos: 0, neto: 0, sumOcupacion: 0 },
            colonial: { ingresos: 0, hospedaje: 0, tienda: 0, egresos: 0, neto: 0, sumOcupacion: 0 },
            total: { ingresos: 0, hospedaje: 0, tienda: 0, egresos: 0, neto: 0, sumOcupacion: 0 }
        });

        const days = mergedData.length || 1;
        res.plaza.avgOcupacion = res.plaza.sumOcupacion / days;
        res.colonial.avgOcupacion = res.colonial.sumOcupacion / days;
        res.total.avgOcupacion = res.total.sumOcupacion / days;

        return res;
    }, [mergedData]);

    const totalPcts = {
        plaza: totals.plaza.ingresos > 0 ? (totals.plaza.neto / totals.plaza.ingresos) * 100 : 0,
        colonial: totals.colonial.ingresos > 0 ? (totals.colonial.neto / totals.colonial.ingresos) * 100 : 0,
        total: totals.total.ingresos > 0 ? (totals.total.neto / totals.total.ingresos) * 100 : 0
    };

    const handleExportExcel = () => {
        const reportData = mergedData.map(d => ({
            'Fecha': d.label,
            'Plaza Hospedaje': d.plaza.hospedaje,
            'Plaza Tienda': d.plaza.tienda,
            'Plaza Egresos': d.plaza.egresos,
            'Plaza Neto': d.plaza.neto,
            'Plaza Ocupación %': d.plaza.ocupacion.toFixed(1) + '%',
            'Colonial Hospedaje': d.colonial.hospedaje,
            'Colonial Tienda': d.colonial.tienda,
            'Colonial Egresos': d.colonial.egresos,
            'Colonial Neto': d.colonial.neto,
            'Colonial Ocupación %': d.colonial.ocupacion.toFixed(1) + '%',
            'Consolidado Ingresos': d.total.ingresos,
            'Consolidado Neto': d.total.neto,
            'Ocupación Promedio %': d.total.ocupacion.toFixed(1) + '%'
        }));

        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Detallado");
        XLSX.writeFile(wb, `Reporte_Detallado_${filtros.inicio}_al_${filtros.fin}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(16);
        doc.text("Reporte Consolidado Detallado", 14, 20);
        doc.setFontSize(10);
        doc.text(`Desde: ${filtros.inicio} Hasta: ${filtros.fin}`, 14, 28);

        const tableColumn = [
            "Día", "P. Hosp", "P. Tienda", "P. Neto", "P. Ocup%", "C. Hosp", "C. Tienda", "C. Neto", "C. Ocup%", "Total Neto", "Total %"
        ];

        const tableRows = mergedData.map(d => [
            d.label,
            formatCurrency(d.plaza.hospedaje), formatCurrency(d.plaza.tienda), formatCurrency(d.plaza.neto), d.plaza.ocupacion.toFixed(0) + '%',
            formatCurrency(d.colonial.hospedaje), formatCurrency(d.colonial.tienda), formatCurrency(d.colonial.neto), d.colonial.ocupacion.toFixed(0) + '%',
            formatCurrency(d.total.neto), d.total.pct.toFixed(1) + '%'
        ]);

        autoTable(doc, {
            startY: 35,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
            styles: { fontSize: 7 }
        });

        doc.save(`Reporte_Detallado_${filtros.inicio}.pdf`);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors border border-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                <Activity size={24} />
                            </div>
                            Caja Consolidada {detailedView ? 'Detallada' : 'Diaria'}
                        </h1>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">
                            {detailedView ? 'Análisis profundo de hospedaje, tienda y ocupación' : 'Resumen diario de ingresos y egresos'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => setDetailedView(!detailedView)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${detailedView ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        {detailedView ? <BarChart3 size={16} /> : <Activity size={16} />}
                        {detailedView ? 'VER VISTA SIMPLE' : 'VER RECOMENDACIONES (6 PTOS)'}
                    </button>

                    <div className="bg-slate-100 p-1.5 rounded-[1.2rem] flex gap-1">
                        <button onClick={() => setViewMode('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${viewMode === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>TODOS</button>
                        <button onClick={() => setViewMode('plaza')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${viewMode === 'plaza' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>PLAZA</button>
                        <button onClick={() => setViewMode('colonial')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${viewMode === 'colonial' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>COLONIAL</button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"><Download size={20} /></button>
                        <button onClick={handleExportPDF} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all border border-rose-100"><FileText size={20} /></button>
                        <button onClick={fetchData} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                    </div>
                </div>
            </div>

            {/* Top Cards (Visible only in Detailed View) */}
            {detailedView && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <Hotel size={24} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospedaje</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900">${formatCurrency(viewMode === 'all' ? totals.total.hospedaje : viewMode === 'plaza' ? totals.plaza.hospedaje : totals.colonial.hospedaje)}</h4>
                        <p className="text-xs text-slate-400 font-bold mt-1">Ingreso bruto por habitaciones</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                                <ShoppingCart size={24} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tienda / Bar</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900">${formatCurrency(viewMode === 'all' ? totals.total.tienda : viewMode === 'plaza' ? totals.plaza.tienda : totals.colonial.tienda)}</h4>
                        <p className="text-xs text-slate-400 font-bold mt-1">Ventas de productos y consumos</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <Percent size={24} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupación Prom.</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900">{(viewMode === 'all' ? totals.total.avgOcupacion : viewMode === 'plaza' ? totals.plaza.avgOcupacion : totals.colonial.avgOcupacion).toFixed(1)}%</h4>
                        <p className="text-xs text-slate-400 font-bold mt-1">Promedio de camas ocupadas</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <CreditCard size={24} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rentabilidad</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900">{(viewMode === 'all' ? totalPcts.total : viewMode === 'plaza' ? totalPcts.plaza : totalPcts.colonial).toFixed(1)}%</h4>
                        <p className="text-xs text-slate-400 font-bold mt-1">Margen neto sobre ingresos</p>
                    </div>
                </div>
            )}

            {/* Charts (Visible only in Detailed View) */}
            {detailedView && !loading && mergedData.length > 0 && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BarChart3 size={18} className="text-indigo-600" />
                        Tendencia de Ingresos y Ocupación
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorOcup" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} unit="%" />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                                    formatter={(val, name) => [name === 'Ingresos' ? formatCurrency(val) : val.toFixed(1) + '%', name]}
                                />
                                <Area yAxisId="left" type="monotone" dataKey={viewMode === 'all' ? 'total.ingresos' : viewMode === 'plaza' ? 'plaza.ingresos' : 'colonial.ingresos'} name="Ingresos" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIng)" />
                                <Area yAxisId="right" type="monotone" dataKey={viewMode === 'all' ? 'total.ocupacion' : viewMode === 'plaza' ? 'plaza.ocupacion' : 'colonial.ocupacion'} name="Ocupación" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOcup)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="flex flex-wrap items-end gap-6">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Fecha Inicio</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input type="date" className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all" value={filtros.inicio} onChange={e => setFiltros({...filtros, inicio: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Fecha Fin</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input type="date" className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all" value={filtros.fin} onChange={e => setFiltros({...filtros, fin: e.target.value})} />
                        </div>
                    </div>
                    <button type="submit" className="px-8 h-[52px] bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-200">
                        <Filter size={18} /> Filtrar Reporte
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Día / Mes</th>
                                
                                {(viewMode === 'all' || viewMode === 'plaza') && (
                                    <>
                                        <th className="px-6 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 bg-blue-50/30 text-center">Plaza</th>
                                        {detailedView && (
                                            <>
                                                <th className="px-4 py-5 text-[9px] font-black text-blue-400 uppercase border-b border-slate-100 bg-blue-50/10">Hosp.</th>
                                                <th className="px-4 py-5 text-[9px] font-black text-blue-400 uppercase border-b border-slate-100 bg-blue-50/10">Tienda</th>
                                                <th className="px-4 py-5 text-[9px] font-black text-blue-400 uppercase border-b border-slate-100 bg-blue-50/10">Ocup.</th>
                                            </>
                                        )}
                                        {!detailedView && (
                                            <>
                                                <th className="px-6 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 bg-blue-50/30">Ingresos</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 bg-blue-50/30">Egresos</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 bg-blue-50/30">Neto</th>
                                            </>
                                        )}
                                        <th className="px-6 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 bg-blue-50/30 text-center">% Rent</th>
                                    </>
                                )}

                                {(viewMode === 'all' || viewMode === 'colonial') && (
                                    <>
                                        <th className="px-6 py-5 text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-slate-100 bg-orange-50/30 text-center">Colonial</th>
                                        {detailedView && (
                                            <>
                                                <th className="px-4 py-5 text-[9px] font-black text-orange-400 uppercase border-b border-slate-100 bg-orange-50/10">Hosp.</th>
                                                <th className="px-4 py-5 text-[9px] font-black text-orange-400 uppercase border-b border-slate-100 bg-orange-50/10">Tienda</th>
                                                <th className="px-4 py-5 text-[9px] font-black text-orange-400 uppercase border-b border-slate-100 bg-orange-50/10">Ocup.</th>
                                            </>
                                        )}
                                        {!detailedView && (
                                            <>
                                                <th className="px-6 py-5 text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-slate-100 bg-orange-50/30">Ingresos</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-slate-100 bg-orange-50/30">Egresos</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-slate-100 bg-orange-50/30">Neto</th>
                                            </>
                                        )}
                                        <th className="px-6 py-5 text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-slate-100 bg-orange-50/30 text-center">% Rent</th>
                                    </>
                                )}

                                {viewMode === 'all' && (
                                    <>
                                        <th className="px-6 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100 bg-indigo-50/30">Total Ing</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100 bg-indigo-50/30">Total Egr</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100 bg-indigo-50/30">Saldo Final</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100 bg-indigo-50/30 text-center">Rent %</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="20" className="px-6 py-20 text-center text-sm font-black text-slate-400 uppercase tracking-widest">Consolidando registros financieros...</td></tr>
                            ) : mergedData.length === 0 ? (
                                <tr><td colSpan="20" className="px-6 py-20 text-center text-slate-400 font-bold italic">No se encontraron movimientos.</td></tr>
                            ) : (
                                <>
                                    {mergedData.map((d, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-black text-slate-900 text-sm tracking-tighter">{d.label}</td>
                                            
                                            {(viewMode === 'all' || viewMode === 'plaza') && (
                                                <>
                                                    <td className="px-6 py-4 font-bold text-slate-500 text-sm border-l border-blue-50/50">${formatCurrency(d.plaza.ingresos)}</td>
                                                    {detailedView && (
                                                        <>
                                                            <td className="px-4 py-4 text-[11px] text-slate-400 font-bold">${formatCurrency(d.plaza.hospedaje)}</td>
                                                            <td className="px-4 py-4 text-[11px] text-slate-400 font-bold">${formatCurrency(d.plaza.tienda)}</td>
                                                            <td className="px-4 py-4 text-center"><span className="text-[10px] font-black text-blue-400">{d.plaza.ocupacion.toFixed(0)}%</span></td>
                                                        </>
                                                    )}
                                                    {!detailedView && (
                                                        <>
                                                            <td className="px-6 py-4 font-bold text-slate-400 text-sm">${formatCurrency(d.plaza.egresos)}</td>
                                                            <td className={`px-6 py-4 font-black text-sm ${d.plaza.neto >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>${formatCurrency(d.plaza.neto)}</td>
                                                        </>
                                                    )}
                                                    <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${d.plaza.pct >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{d.plaza.pct.toFixed(0)}%</span></td>
                                                </>
                                            )}

                                            {(viewMode === 'all' || viewMode === 'colonial') && (
                                                <>
                                                    <td className="px-6 py-4 font-bold text-slate-500 text-sm border-l border-orange-50/50">${formatCurrency(d.colonial.ingresos)}</td>
                                                    {detailedView && (
                                                        <>
                                                            <td className="px-4 py-4 text-[11px] text-slate-400 font-bold">${formatCurrency(d.colonial.hospedaje)}</td>
                                                            <td className="px-4 py-4 text-[11px] text-slate-400 font-bold">${formatCurrency(d.colonial.tienda)}</td>
                                                            <td className="px-4 py-4 text-center"><span className="text-[10px] font-black text-orange-400">{d.colonial.ocupacion.toFixed(0)}%</span></td>
                                                        </>
                                                    )}
                                                    {!detailedView && (
                                                        <>
                                                            <td className="px-6 py-4 font-bold text-slate-400 text-sm">${formatCurrency(d.colonial.egresos)}</td>
                                                            <td className={`px-6 py-4 font-black text-sm ${d.colonial.neto >= 0 ? 'text-orange-600' : 'text-rose-600'}`}>${formatCurrency(d.colonial.neto)}</td>
                                                        </>
                                                    )}
                                                    <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${d.colonial.pct >= 0 ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'}`}>{d.colonial.pct.toFixed(0)}%</span></td>
                                                </>
                                            )}

                                            {viewMode === 'all' && (
                                                <>
                                                    <td className="px-6 py-4 font-bold text-slate-900 text-sm bg-slate-50/30">${formatCurrency(d.total.ingresos)}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-500 text-sm bg-slate-50/30">${formatCurrency(d.total.egresos)}</td>
                                                    <td className={`px-6 py-4 font-black text-sm bg-slate-50/30 ${d.total.neto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${formatCurrency(d.total.neto)}</td>
                                                    <td className="px-6 py-4 text-center bg-slate-50/30"><span className={`text-xs font-black ${d.total.pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{d.total.pct.toFixed(0)}%</span></td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-900 text-white font-black text-sm">
                                        <td className="px-6 py-5">TOTALES</td>
                                        {(viewMode === 'all' || viewMode === 'plaza') && (
                                            <>
                                                <td className="px-6 py-5">${formatCurrency(totals.plaza.ingresos)}</td>
                                                {detailedView && (
                                                    <>
                                                        <td className="px-4 py-5 text-[10px] text-blue-300">${formatCurrency(totals.plaza.hospedaje)}</td>
                                                        <td className="px-4 py-5 text-[10px] text-blue-300">${formatCurrency(totals.plaza.tienda)}</td>
                                                        <td className="px-4 py-5 text-center text-[10px] text-blue-300">{totals.plaza.avgOcupacion.toFixed(0)}%</td>
                                                    </>
                                                )}
                                                {!detailedView && (
                                                    <>
                                                        <td className="px-6 py-5 text-slate-400">${formatCurrency(totals.plaza.egresos)}</td>
                                                        <td className="px-6 py-5 text-blue-400">${formatCurrency(totals.plaza.neto)}</td>
                                                    </>
                                                )}
                                                <td className="px-6 py-5 text-center text-xs">{totalPcts.plaza.toFixed(0)}%</td>
                                            </>
                                        )}
                                        {(viewMode === 'all' || viewMode === 'colonial') && (
                                            <>
                                                <td className="px-6 py-5">${formatCurrency(totals.colonial.ingresos)}</td>
                                                {detailedView && (
                                                    <>
                                                        <td className="px-4 py-5 text-[10px] text-orange-300">${formatCurrency(totals.colonial.hospedaje)}</td>
                                                        <td className="px-4 py-5 text-[10px] text-orange-300">${formatCurrency(totals.colonial.tienda)}</td>
                                                        <td className="px-4 py-5 text-center text-[10px] text-orange-300">{totals.colonial.avgOcupacion.toFixed(0)}%</td>
                                                    </>
                                                )}
                                                {!detailedView && (
                                                    <>
                                                        <td className="px-6 py-5 text-slate-400">${formatCurrency(totals.colonial.egresos)}</td>
                                                        <td className="px-6 py-5 text-orange-400">${formatCurrency(totals.colonial.neto)}</td>
                                                    </>
                                                )}
                                                <td className="px-6 py-5 text-center text-xs">{totalPcts.colonial.toFixed(0)}%</td>
                                            </>
                                        )}
                                        {viewMode === 'all' && (
                                            <>
                                                <td className="px-6 py-5 text-indigo-300">${formatCurrency(totals.total.ingresos)}</td>
                                                <td className="px-6 py-5 text-slate-400">${formatCurrency(totals.total.egresos)}</td>
                                                <td className="px-6 py-5 text-emerald-400">${formatCurrency(totals.total.neto)}</td>
                                                <td className="px-6 py-5 text-center bg-white/10">{totalPcts.total.toFixed(0)}%</td>
                                            </>
                                        )}
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CajaDiariaConsolidada;
