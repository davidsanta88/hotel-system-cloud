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
    ArrowLeft
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { format, startOfMonth, addDays } from 'date-fns';
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
        
        // Unir por label (fecha DD/MM)
        const map = new Map();
        
        plazaHistory.forEach(item => {
            map.set(item.label, {
                label: item.label,
                plaza: { 
                    ingresos: item.ingresos, 
                    egresos: item.egresos, 
                    neto: item.margen,
                    pct: item.ingresos > 0 ? (item.margen / item.ingresos) * 100 : 0
                },
                colonial: { ingresos: 0, egresos: 0, neto: 0, pct: 0 },
                total: { 
                    ingresos: item.ingresos, 
                    egresos: item.egresos, 
                    neto: item.margen,
                    pct: item.ingresos > 0 ? (item.margen / item.ingresos) * 100 : 0
                }
            });
        });

        colonialHistory.forEach(item => {
            const existing = map.get(item.label) || {
                label: item.label,
                plaza: { ingresos: 0, egresos: 0, neto: 0, pct: 0 },
                colonial: { ingresos: 0, egresos: 0, neto: 0, pct: 0 },
                total: { ingresos: 0, egresos: 0, neto: 0, pct: 0 }
            };

            existing.colonial = {
                ingresos: item.ingresos,
                egresos: item.egresos,
                neto: item.margen,
                pct: item.ingresos > 0 ? (item.margen / item.ingresos) * 100 : 0
            };

            existing.total.ingresos += item.ingresos;
            existing.total.egresos += item.egresos;
            existing.total.neto += item.margen;
            existing.total.pct = existing.total.ingresos > 0 ? (existing.total.neto / existing.total.ingresos) * 100 : 0;

            map.set(item.label, existing);
        });

        return Array.from(map.values());
    }, [data]);

    const totals = useMemo(() => {
        return mergedData.reduce((acc, curr) => {
            acc.plaza.ingresos += curr.plaza.ingresos;
            acc.plaza.egresos += curr.plaza.egresos;
            acc.plaza.neto += curr.plaza.neto;
            
            acc.colonial.ingresos += curr.colonial.ingresos;
            acc.colonial.egresos += curr.colonial.egresos;
            acc.colonial.neto += curr.colonial.neto;
            
            acc.total.ingresos += curr.total.ingresos;
            acc.total.egresos += curr.total.egresos;
            acc.total.neto += curr.total.neto;
            
            return acc;
        }, {
            plaza: { ingresos: 0, egresos: 0, neto: 0 },
            colonial: { ingresos: 0, egresos: 0, neto: 0 },
            total: { ingresos: 0, egresos: 0, neto: 0 }
        });
    }, [mergedData]);

    const totalPcts = {
        plaza: totals.plaza.ingresos > 0 ? (totals.plaza.neto / totals.plaza.ingresos) * 100 : 0,
        colonial: totals.colonial.ingresos > 0 ? (totals.colonial.neto / totals.colonial.ingresos) * 100 : 0,
        total: totals.total.ingresos > 0 ? (totals.total.neto / totals.total.ingresos) * 100 : 0
    };

    const handleExportExcel = () => {
        const reportData = mergedData.map(d => ({
            'Fecha': d.label,
            'Plaza Ingresos': d.plaza.ingresos,
            'Plaza Egresos': d.plaza.egresos,
            'Plaza Neto': d.plaza.neto,
            'Plaza %': d.plaza.pct.toFixed(1) + '%',
            'Colonial Ingresos': d.colonial.ingresos,
            'Colonial Egresos': d.colonial.egresos,
            'Colonial Neto': d.colonial.neto,
            'Colonial %': d.colonial.pct.toFixed(1) + '%',
            'Consolidado Ingresos': d.total.ingresos,
            'Consolidado Egresos': d.total.egresos,
            'Consolidado Neto': d.total.neto,
            'Consolidado %': d.total.pct.toFixed(1) + '%'
        }));

        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Caja Diaria Consolidada");
        XLSX.writeFile(wb, `Caja_Consolidada_${filtros.inicio}_al_${filtros.fin}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(18);
        doc.text("Reporte de Caja Diaria Consolidada", 14, 20);
        doc.setFontSize(10);
        doc.text(`Periodo: ${filtros.inicio} al ${filtros.fin}`, 14, 28);

        const tableColumn = [
            "Día", 
            "Plaza Ing", "Plaza Egr", "Plaza Neto", "Plaza %",
            "Colonial Ing", "Colonial Egr", "Colonial Neto", "Colonial %",
            "Total Ing", "Total Egr", "Saldo", "Rent %"
        ];

        const tableRows = mergedData.map(d => [
            d.label,
            formatCurrency(d.plaza.ingresos), formatCurrency(d.plaza.egresos), formatCurrency(d.plaza.neto), d.plaza.pct.toFixed(1) + '%',
            formatCurrency(d.colonial.ingresos), formatCurrency(d.colonial.egresos), formatCurrency(d.colonial.neto), d.colonial.pct.toFixed(1) + '%',
            formatCurrency(d.total.ingresos), formatCurrency(d.total.egresos), formatCurrency(d.total.neto), d.total.pct.toFixed(1) + '%'
        ]);

        tableRows.push([
            'TOTALES',
            formatCurrency(totals.plaza.ingresos), formatCurrency(totals.plaza.egresos), formatCurrency(totals.plaza.neto), totalPcts.plaza.toFixed(1) + '%',
            formatCurrency(totals.colonial.ingresos), formatCurrency(totals.colonial.egresos), formatCurrency(totals.colonial.neto), totalPcts.colonial.toFixed(1) + '%',
            formatCurrency(totals.total.ingresos), formatCurrency(totals.total.egresos), formatCurrency(totals.total.neto), totalPcts.total.toFixed(1) + '%'
        ]);

        autoTable(doc, {
            startY: 35,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
            styles: { fontSize: 7 },
            didParseCell: function (data) {
                if (data.row.index === tableRows.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [241, 245, 249];
                }
            }
        });

        doc.save(`Caja_Consolidada_${filtros.inicio}_al_${filtros.fin}.pdf`);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
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
                            Caja Diaria Consolidada
                        </h1>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Análisis detallado de rendimiento y rentabilidad</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
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
                                        <th className="px-6 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 bg-blue-50/30">Plaza Ing</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 bg-blue-50/30">Plaza Egr</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 bg-blue-50/30">Plaza Neto</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 bg-blue-50/30 text-center">% Rent</th>
                                    </>
                                )}
                                {(viewMode === 'all' || viewMode === 'colonial') && (
                                    <>
                                        <th className="px-6 py-5 text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-slate-100 bg-orange-50/30">Colonial Ing</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-slate-100 bg-orange-50/30">Colonial Egr</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-slate-100 bg-orange-50/30">Colonial Neto</th>
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
                                <tr><td colSpan="13" className="px-6 py-20 text-center text-sm font-black text-slate-400 uppercase tracking-widest">Consolidando registros financieros...</td></tr>
                            ) : mergedData.length === 0 ? (
                                <tr><td colSpan="13" className="px-6 py-20 text-center text-slate-400 font-bold italic">No se encontraron movimientos.</td></tr>
                            ) : (
                                <>
                                    {mergedData.map((d, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-black text-slate-900 text-sm tracking-tighter">{d.label}</td>
                                            {(viewMode === 'all' || viewMode === 'plaza') && (
                                                <>
                                                    <td className="px-6 py-4 font-bold text-slate-500 text-sm">${formatCurrency(d.plaza.ingresos)}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-400 text-sm">${formatCurrency(d.plaza.egresos)}</td>
                                                    <td className={`px-6 py-4 font-black text-sm ${d.plaza.neto >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>${formatCurrency(d.plaza.neto)}</td>
                                                    <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${d.plaza.pct >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{d.plaza.pct.toFixed(1)}%</span></td>
                                                </>
                                            )}
                                            {(viewMode === 'all' || viewMode === 'colonial') && (
                                                <>
                                                    <td className="px-6 py-4 font-bold text-slate-500 text-sm">${formatCurrency(d.colonial.ingresos)}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-400 text-sm">${formatCurrency(d.colonial.egresos)}</td>
                                                    <td className={`px-6 py-4 font-black text-sm ${d.colonial.neto >= 0 ? 'text-orange-600' : 'text-rose-600'}`}>${formatCurrency(d.colonial.neto)}</td>
                                                    <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${d.colonial.pct >= 0 ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'}`}>{d.colonial.pct.toFixed(1)}%</span></td>
                                                </>
                                            )}
                                            {viewMode === 'all' && (
                                                <>
                                                    <td className="px-6 py-4 font-bold text-slate-900 text-sm bg-slate-50/30">${formatCurrency(d.total.ingresos)}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-500 text-sm bg-slate-50/30">${formatCurrency(d.total.egresos)}</td>
                                                    <td className={`px-6 py-4 font-black text-sm bg-slate-50/30 ${d.total.neto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${formatCurrency(d.total.neto)}</td>
                                                    <td className="px-6 py-4 text-center bg-slate-50/30"><span className={`text-xs font-black ${d.total.pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{d.total.pct.toFixed(1)}%</span></td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-900 text-white font-black text-sm">
                                        <td className="px-6 py-5">TOTALES</td>
                                        {(viewMode === 'all' || viewMode === 'plaza') && (
                                            <>
                                                <td className="px-6 py-5">${formatCurrency(totals.plaza.ingresos)}</td>
                                                <td className="px-6 py-5 text-slate-400">${formatCurrency(totals.plaza.egresos)}</td>
                                                <td className="px-6 py-5 text-blue-400">${formatCurrency(totals.plaza.neto)}</td>
                                                <td className="px-6 py-5 text-center text-xs">{totalPcts.plaza.toFixed(1)}%</td>
                                            </>
                                        )}
                                        {(viewMode === 'all' || viewMode === 'colonial') && (
                                            <>
                                                <td className="px-6 py-5">${formatCurrency(totals.colonial.ingresos)}</td>
                                                <td className="px-6 py-5 text-slate-400">${formatCurrency(totals.colonial.egresos)}</td>
                                                <td className="px-6 py-5 text-orange-400">${formatCurrency(totals.colonial.neto)}</td>
                                                <td className="px-6 py-5 text-center text-xs">{totalPcts.colonial.toFixed(1)}%</td>
                                            </>
                                        )}
                                        {viewMode === 'all' && (
                                            <>
                                                <td className="px-6 py-5 text-indigo-300">${formatCurrency(totals.total.ingresos)}</td>
                                                <td className="px-6 py-5 text-slate-400">${formatCurrency(totals.total.egresos)}</td>
                                                <td className="px-6 py-5 text-emerald-400">${formatCurrency(totals.total.neto)}</td>
                                                <td className="px-6 py-5 text-center bg-white/10">{totalPcts.total.toFixed(1)}%</td>
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
