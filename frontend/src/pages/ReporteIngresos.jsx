import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
    TrendingUp, 
    Calendar, 
    Filter, 
    Download, 
    Search,
    User,
    Tag,
    DollarSign,
    Clock,
    ChevronLeft,
    ChevronRight,
    FileText,
    TrendingDown,
    Activity,
    Printer,
    FileDown,
    RefreshCw,
    Info,
    Eye
} from 'lucide-react';
import { format, startOfMonth, subDays } from 'date-fns';
import { formatCurrency } from '../utils/format';
import DetallesRegistroModal from '../components/modals/DetallesRegistroModal';
import DetalleMovimientoModal from '../components/modals/DetalleMovimientoModal';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReporteIngresos = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePreset, setActivePreset] = useState('HOY');
    const [filtros, setFiltros] = useState({
        inicio: format(new Date(), 'yyyy-MM-dd'),
        fin: format(new Date(), 'yyyy-MM-dd')
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [columnFilters, setColumnFilters] = useState({
        fecha: '',
        tipo: '',
        descripcion: '',
        detalle: '',
        usuario: '',
        medio: '',
        valor: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Detail Modal States
    const [selectedTransaccion, setSelectedTransaccion] = useState(null);
    const [showDetalleModal, setShowDetalleModal] = useState(false);
    const [selectedRegistroId, setSelectedRegistroId] = useState(null);
    const [showRegistroModal, setShowRegistroModal] = useState(false);

    useEffect(() => {
        fetchMovimientos();
    }, []);

    const fetchMovimientos = async (customFilters = null) => {
        try {
            setLoading(true);
            const f = customFilters || filtros;
            const res = await api.get(`/reportes/detalle-ingresos?inicio=${f.inicio}&fin=${f.fin}`);
            setMovimientos(res.data);
            setCurrentPage(1);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los movimientos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePresetChange = (preset) => {
        setActivePreset(preset);
        let inicio = new Date();
        let fin = new Date();

        switch (preset) {
            case 'HOY':
                inicio = new Date();
                break;
            case '7 DÍAS':
                inicio = subDays(new Date(), 7);
                break;
            case '30 DÍAS':
                inicio = subDays(new Date(), 30);
                break;
            case 'ESTE MES':
                inicio = startOfMonth(new Date());
                break;
            case '90 DÍAS':
                inicio = subDays(new Date(), 90);
                break;
            default:
                break;
        }

        const newFiltros = {
            inicio: format(inicio, 'yyyy-MM-dd'),
            fin: format(fin, 'yyyy-MM-dd')
        };
        setFiltros(newFiltros);
        fetchMovimientos(newFiltros);
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setActivePreset('CUSTOM');
        fetchMovimientos();
    };

    const filteredMovimientos = useMemo(() => {
        return movimientos.filter(i => {
            const searchLower = searchTerm.toLowerCase();
            const matchesGlobal = (
                i.descripcion.toLowerCase().includes(searchLower) ||
                (i.detalle || '').toLowerCase().includes(searchLower) ||
                i.tipo.toLowerCase().includes(searchLower) ||
                i.usuario.toLowerCase().includes(searchLower) ||
                i.medioPago.toLowerCase().includes(searchLower)
            );

            const matchesColumn = (
                format(new Date(i.fecha), 'dd/MM/yyyy').includes(columnFilters.fecha) &&
                i.tipo.toLowerCase().includes(columnFilters.tipo.toLowerCase()) &&
                i.descripcion.toLowerCase().includes(columnFilters.descripcion.toLowerCase()) &&
                (i.detalle || '').toLowerCase().includes(columnFilters.detalle.toLowerCase()) &&
                i.usuario.toLowerCase().includes(columnFilters.usuario.toLowerCase()) &&
                i.medioPago.toLowerCase().includes(columnFilters.medio.toLowerCase()) &&
                (columnFilters.valor === '' || i.monto.toString().includes(columnFilters.valor))
            );

            return matchesGlobal && matchesColumn;
        });
    }, [movimientos, searchTerm, columnFilters]);

    const paginatedMovimientos = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMovimientos.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMovimientos, currentPage, itemsPerPage]);

    const stats = useMemo(() => {
        const ingresos = filteredMovimientos.filter(m => m.monto > 0).reduce((sum, m) => sum + m.monto, 0);
        const egresos = Math.abs(filteredMovimientos.filter(m => m.monto < 0).reduce((sum, m) => sum + m.monto, 0));
        const balance = ingresos - egresos;
        return { ingresos, egresos, balance };
    }, [filteredMovimientos]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleExportExcel = () => {
        const dataToExport = filteredMovimientos.map(i => ({
            'Fecha y Hora': format(new Date(i.fecha), 'dd/MM/yyyy HH:mm'),
            'Tipo': i.tipo,
            'Descripción': i.descripcion,
            'Detalle': i.detalle || '-',
            'Usuario': i.usuario,
            'Medio de Pago': i.medioPago,
            'Valor': i.monto
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `Reporte_Caja_${filtros.inicio}_a_${filtros.fin}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        
        doc.setFontSize(18);
        doc.text('Reporte Detallado de Caja', 14, 20);
        doc.setFontSize(10);
        doc.text(`Periodo: ${filtros.inicio} al ${filtros.fin}`, 14, 28);
        
        doc.setFontSize(12);
        doc.text(`Total Ingresos: ${formatCurrency(stats.ingresos)} | Total Egresos: ${formatCurrency(stats.egresos)} | Balance: ${formatCurrency(stats.balance)}`, 14, 40);

        const tableData = filteredMovimientos.map(i => [
            format(new Date(i.fecha), 'dd/MM/yyyy HH:mm'),
            i.tipo,
            i.descripcion,
            i.detalle || '-',
            i.usuario,
            i.medioPago,
            formatCurrency(i.monto)
        ]);

        doc.autoTable({
            startY: 50,
            head: [['Fecha', 'Tipo', 'Descripción', 'Detalle', 'Usuario', 'Medio', 'Valor']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 7 },
            columnStyles: {
                6: { halign: 'right' }
            }
        });

        doc.save(`Reporte_Caja_${filtros.inicio}_a_${filtros.fin}.pdf`);
    };

    const totalPages = Math.ceil(filteredMovimientos.length / itemsPerPage);

    const toggleColumnFilter = (column, value) => {
        setColumnFilters(prev => ({ ...prev, [column]: value }));
        setCurrentPage(1);
    };

    const handleVerDetalle = (t) => {
        if (t.tipo === 'HOSPEDAJE') {
            setSelectedRegistroId(t.id_ref);
            setShowRegistroModal(true);
        } else {
            setSelectedTransaccion(t);
            setShowDetalleModal(true);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                        Reporte Detallado de Caja
                    </h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Flujo de Efectivo</p>
                        <button onClick={() => fetchMovimientos()} className="text-primary-600 hover:rotate-180 transition-transform duration-500">
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={handleExportExcel}
                        className="btn-secondary flex items-center gap-2 text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                    >
                        <Download size={18} /> Excel
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="btn-secondary flex items-center gap-2 text-sm font-bold bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"
                    >
                        <Printer size={18} /> PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingresos Totales</p>
                        <p className="text-xl font-black text-emerald-700">{formatCurrency(stats.ingresos)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group border-rose-100">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-rose-500">Egresos Totales</p>
                        <p className="text-xl font-black text-rose-700">{formatCurrency(stats.egresos)}</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white flex items-center gap-4 group">
                    <div className="p-4 bg-white/10 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Balance Neto</p>
                        <p className="text-xl font-black text-white">{formatCurrency(stats.balance)}</p>
                    </div>
                </div>
            </div>

            {/* Presets and Date Filters */}
            <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="bg-slate-100/50 p-1 rounded-xl flex flex-wrap gap-1 border border-slate-200">
                    {['HOY', '7 DÍAS', '30 DÍAS', 'ESTE MES', '90 DÍAS'].map(preset => (
                        <button
                            key={preset}
                            onClick={() => handlePresetChange(preset)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                activePreset === preset 
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-105' 
                                : 'text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            {preset}
                        </button>
                    ))}
                </div>

                <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2 text-slate-400" size={14} />
                            <input 
                                type="date" 
                                className="input-field pl-9 py-1 text-xs font-bold w-40" 
                                value={filtros.inicio}
                                onChange={e => {
                                    setFiltros({...filtros, inicio: e.target.value});
                                    setActivePreset('CUSTOM');
                                }}
                            />
                        </div>
                        <span className="text-slate-400 font-bold">→</span>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2 text-slate-400" size={14} />
                            <input 
                                type="date" 
                                className="input-field pl-9 py-1 text-xs font-bold w-40" 
                                value={filtros.fin}
                                onChange={e => {
                                    setFiltros({...filtros, fin: e.target.value});
                                    setActivePreset('CUSTOM');
                                }}
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleFilterSubmit}
                        className="btn-primary flex items-center gap-2 px-6 py-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-500/20"
                    >
                        <Filter size={14} /> Filtrar
                    </button>
                </div>
            </div>

            {/* Search and Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Búsqueda rápida..."
                            className="input-field pl-10 py-2 w-full text-sm font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Página {currentPage} de {totalPages || 1}</span>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-100">
                                <th className="px-4 py-4 min-w-[120px]">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Fecha</span>
                                    <input type="text" className="w-full text-[9px] p-1 border border-slate-200 rounded font-bold" placeholder="..." value={columnFilters.fecha} onChange={e => toggleColumnFilter('fecha', e.target.value)} />
                                </th>
                                <th className="px-4 py-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tipo</span>
                                    <input type="text" className="w-full text-[9px] p-1 border border-slate-200 rounded font-bold" placeholder="..." value={columnFilters.tipo} onChange={e => toggleColumnFilter('tipo', e.target.value)} />
                                </th>
                                <th className="px-4 py-4 min-w-[200px]">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Descripción</span>
                                    <input type="text" className="w-full text-[9px] p-1 border border-slate-200 rounded font-bold" placeholder="..." value={columnFilters.descripcion} onChange={e => toggleColumnFilter('descripcion', e.target.value)} />
                                </th>
                                <th className="px-4 py-4 min-w-[200px]">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Detalle</span>
                                    <input type="text" className="w-full text-[9px] p-1 border border-slate-200 rounded font-bold" placeholder="..." value={columnFilters.detalle} onChange={e => toggleColumnFilter('detalle', e.target.value)} />
                                </th>
                                <th className="px-4 py-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Usuario</span>
                                    <input type="text" className="w-full text-[9px] p-1 border border-slate-200 rounded font-bold" placeholder="..." value={columnFilters.usuario} onChange={e => toggleColumnFilter('usuario', e.target.value)} />
                                </th>
                                <th className="px-4 py-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Medio</span>
                                    <input type="text" className="w-full text-[9px] p-1 border border-slate-200 rounded font-bold" placeholder="..." value={columnFilters.medio} onChange={e => toggleColumnFilter('medio', e.target.value)} />
                                </th>
                                <th className="px-4 py-4 text-right">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Valor</span>
                                    <input type="text" className="w-full text-[9px] p-1 border border-slate-200 rounded text-right font-bold" placeholder="..." value={columnFilters.valor} onChange={e => toggleColumnFilter('valor', e.target.value)} />
                                </th>
                                <th className="px-4 py-4 text-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ver</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedMovimientos.length > 0 ? (
                                paginatedMovimientos.map((mov, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700">{format(new Date(mov.fecha), 'dd/MM/yyyy')}</span>
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                    <Clock size={10} /> {format(new Date(mov.fecha), 'HH:mm')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                mov.tipo === 'GASTO' ? 'bg-rose-50 text-rose-600' :
                                                mov.tipo === 'HOSPEDAJE' ? 'bg-blue-50 text-blue-600' :
                                                mov.tipo === 'VENTA' ? 'bg-purple-50 text-purple-600' :
                                                'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {mov.tipo}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm font-medium text-gray-600 line-clamp-1">{mov.descripcion}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-[10px] font-medium text-slate-400 italic line-clamp-1">{mov.detalle || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User size={10} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600">{mov.usuario}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{mov.medioPago}</span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right">
                                            <span className={`text-sm font-black ${mov.monto > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {mov.monto > 0 ? '+' : ''}{formatCurrency(mov.monto)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button 
                                                onClick={() => handleVerDetalle(mov)}
                                                className="p-2 text-primary-500 hover:bg-primary-50 rounded-xl transition-all active:scale-90"
                                                title="Ver Detalle Completo"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-slate-300">
                                        <Search size={48} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-lg font-black uppercase tracking-widest">No se encontraron movimientos</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals para detalle */}
            {showRegistroModal && (
                <DetallesRegistroModal 
                    registroId={selectedRegistroId}
                    isOpen={showRegistroModal}
                    onClose={() => setShowRegistroModal(false)}
                />
            )}

            {showDetalleModal && (
                <DetalleMovimientoModal 
                    transaccion={selectedTransaccion}
                    isOpen={showDetalleModal}
                    onClose={() => setShowDetalleModal(false)}
                />
            )}
        </div>
    );
};

export default ReporteIngresos;
