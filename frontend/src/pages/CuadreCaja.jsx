import React, { useState, useEffect, useMemo } from 'react';
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
    Receipt,
    Lock,
    FileText,
    Edit,
    Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { formatCurrency } from '../utils/format';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from '../components/common/Pagination';
import DetallesRegistroModal from '../components/modals/DetallesRegistroModal';
import DetalleMovimientoModal from '../components/modals/DetalleMovimientoModal';
import { Eye, Search, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from 'lucide-react';

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

    const [cierres, setCierres] = useState([]);
    const [showCierreModal, setShowCierreModal] = useState(false);
    const [cierreNota, setCierreNota] = useState('');
    const [saldoReal, setSaldoReal] = useState('');
    const [editingId, setEditingId] = useState(null);

    // Detail Modal States
    const [selectedTransaccion, setSelectedTransaccion] = useState(null);
    const [showDetalleModal, setShowDetalleModal] = useState(false);
    const [selectedRegistroId, setSelectedRegistroId] = useState(null);
    const [showRegistroModal, setShowRegistroModal] = useState(false);

    const [columnFilters, setColumnFilters] = useState({
        fecha: '',
        tipo: '',
        descripcion: '',
        usuario: '',
        medioPago: '',
        monto: ''
    });
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [currentPageCierres, setCurrentPageCierres] = useState(1);
    const [itemsPerPageCierres, setItemsPerPageCierres] = useState(5);

    const [filtros, setFiltros] = useState({
        inicio: (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}-01`;
        })(),
        fin: (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })()
    });

    useEffect(() => {
        const init = async () => {
            const dataCierres = await fetchCierres();
            if (dataCierres && dataCierres.length > 0) {
                const ultimo = dataCierres[0];
                const initialFiltros = {
                    inicio: ultimo.fecha,
                    fin: new Date().toLocaleDateString('en-CA')
                };
                setFiltros(initialFiltros);
                fetchCuadre(initialFiltros);
            } else {
                fetchCuadre();
            }
        };
        init();
    }, []);

    const fetchCierres = async () => {
        try {
            const res = await api.get('/cierres-caja');
            setCierres(res.data);
            return res.data;
        } catch (error) {
            console.error('Error fetching cierres', error);
            return [];
        }
    };

    const fetchCuadre = async (customFiltros = null) => {
        try {
            setLoading(true);
            const params = new URLSearchParams(customFiltros || filtros);
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

    const handleCierreSubmit = async (e) => {
        e.preventDefault();
        try {
            const rawSaldoReal = unformatNumber(saldoReal);
            const expectedCashTotal = (data.resumen.total_efectivo || 0) + montoUltimoCierre;
            const payload = {
                ingresos: data.resumen.ingresos_totales,
                egresos: data.resumen.egresos_totales,
                saldo_calculado: data.resumen.balance_final + montoUltimoCierre,
                saldo_real: rawSaldoReal ? parseFloat(rawSaldoReal) : (editingId ? undefined : expectedCashTotal),
                nota: cierreNota,
                medios_pago: {
                    nequi: data.resumen.total_nequi,
                    bancolombia: data.resumen.total_bancolombia,
                    efectivo: rawSaldoReal ? parseFloat(rawSaldoReal) : expectedCashTotal,
                    otros: data.resumen.total_otros
                }
            };

            if (editingId) {
                await api.put(`/cierres-caja/${editingId}`, payload);
                Swal.fire('Éxito', 'Cierre de caja actualizado correctamente', 'success');
            } else {
                await api.post('/cierres-caja', payload);
                Swal.fire('Éxito', 'Cierre de caja registrado correctamente', 'success');
            }

            setShowCierreModal(false);
            resetCierreForm();
            fetchCierres();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo procesar el cierre', 'error');
        }
    };

    const handleDeleteCierre = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción eliminará el registro del cierre permanentemente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/cierres-caja/${id}`);
                Swal.fire('Eliminado', 'Cierre eliminado correctamente', 'success');
                fetchCierres();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el cierre', 'error');
            }
        }
    };

    const handleEditCierreStart = (cierre) => {
        setEditingId(cierre._id);
        setCierreNota(cierre.nota);
        setSaldoReal(formatNumber(cierre.saldo_real || cierre.saldo_calculado));
        setShowCierreModal(true);
    };

    const resetCierreForm = () => {
        setEditingId(null);
        setCierreNota('');
        setSaldoReal('');
    };

    const formatNumber = (num) => {
        if (!num && num !== 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const unformatNumber = (str) => {
        if (!str) return '';
        return str.toString().replace(/\./g, '');
    };

    const handleSaldoRealChange = (e) => {
        const value = unformatNumber(e.target.value);
        if (value === '' || /^\d+$/.test(value)) {
            setSaldoReal(formatNumber(value));
        }
    };

    const handleFilterLastClosure = () => {
        if (cierres && cierres.length > 0) {
            const ultimo = cierres[0];
            const updatedFiltros = {
                inicio: ultimo.fecha,
                fin: new Date().toLocaleDateString('en-CA')
            };
            setFiltros(updatedFiltros);
            fetchCuadre(updatedFiltros);
        } else {
            Swal.fire('Información', 'No se encontraron cierres previos para filtrar.', 'info');
        }
    };

    const handleExportExcel = () => {
        const reportData = data.transacciones.map(t => ({
            'Fecha': new Date(t.fecha).toLocaleDateString(),
            'Hora': new Date(t.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            'Tipo': t.tipo,
            'Descripción': t.descripcion,
            'Usuario': t.usuario,
            'Medio Pago': t.medioPago,
            'Monto': t.monto
        }));

        // Summary totals at the end
        reportData.push({}); // Empty row
        reportData.push({ 'Fecha': '--- RESUMEN DE TOTALES ---' });
        reportData.push({ 'Fecha': 'Ingresos Totales', 'Monto': data.resumen.ingresos_totales });
        reportData.push({ 'Fecha': 'Egresos Totales', 'Monto': data.resumen.egresos_totales });
        reportData.push({ 'Fecha': 'NEQUI', 'Monto': data.resumen.total_nequi });
        reportData.push({ 'Fecha': 'Trans. Bancolombia', 'Monto': data.resumen.total_bancolombia });
        reportData.push({ 'Fecha': 'EFECTIVO', 'Monto': data.resumen.total_efectivo });
        reportData.push({ 'Fecha': 'BALANCE FINAL', 'Monto': data.resumen.balance_final });

        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cuadre de Caja");
        XLSX.writeFile(wb, `Cuadre_Caja_${filtros.inicio}_al_${filtros.fin}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text("HOTEL BALCÓN PLAZA", 14, 22);
        
        doc.setFontSize(14);
        doc.text("Reporte de Cuadre de Caja Consolidado", 14, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Periodo: ${filtros.inicio} al ${filtros.fin}`, 14, 38);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 43);

        // Summary Stats (Custom cards style in PDF)
        doc.setDrawColor(241, 144, 241); // Simplified boarders
        doc.setFillColor(248, 250, 252);
        doc.rect(14, 50, 60, 25, 'F');
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8);
        doc.text("INGRESOS TOTALES", 18, 56);
        doc.setFontSize(12);
        doc.text(`$${formatCurrency(data.resumen.ingresos_totales)}`, 18, 65);

        doc.rect(78, 50, 60, 25, 'F');
        doc.setFontSize(8);
        doc.text("EGRESOS TOTALES", 82, 56);
        doc.setFontSize(12);
        doc.text(`$${formatCurrency(data.resumen.egresos_totales)}`, 82, 65);

        doc.setFillColor(30, 41, 59);
        doc.rect(142, 50, 54, 25, 'F');
        doc.setTextColor(255);
        doc.setFontSize(8);
        doc.text("BALANCE FINAL", 146, 56);
        doc.setFontSize(12);
        doc.text(`$${formatCurrency(data.resumen.balance_final)}`, 146, 65);

        // Payment Methods Summary Table
        autoTable(doc, {
            startY: 85,
            head: [['Medio de Pago', 'Total Consolidado']],
            body: [
                ['EFECTIVO', `$${formatCurrency(data.resumen.total_efectivo)}`],
                ['NEQUI', `$${formatCurrency(data.resumen.total_nequi)}`],
                ['Trans. Bancolombia', `$${formatCurrency(data.resumen.total_bancolombia)}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105], halign: 'center' },
            bodyStyles: { fontStyle: 'bold', halign: 'center' },
            columnStyles: { 0: { cellWidth: 100 } },
            margin: { left: 40, right: 40 }
        });

        // Transactions Table
        const tableColumn = ["Fecha/Hora", "Tipo", "Descripción", "Medio", "Monto"];
        const tableRows = data.transacciones.map(t => [
            `${new Date(t.fecha).toLocaleDateString()} ${new Date(t.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            t.tipo,
            t.descripcion,
            t.medioPago,
            `$${formatCurrency(t.monto)}`
        ]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 15,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 8 },
            columnStyles: {
                4: { halign: 'right', fontStyle: 'bold' }
            }
        });

        doc.save(`Cuadre_Caja_${filtros.inicio}_al_${filtros.fin}.pdf`);
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

    const handleVerDetalle = (t) => {
        if (t.tipo === 'HOSPEDAJE') {
            setSelectedRegistroId(t.id_ref);
            setShowRegistroModal(true);
        } else {
            setSelectedTransaccion(t);
            setShowDetalleModal(true);
        }
    };

    const getMedioBadge = (medio) => {
        const normalized = medio.toUpperCase();
        if (normalized === 'NEQUI') return <span className="flex items-center gap-1 text-[#7030a0] font-bold text-xs"><Wallet size={14} /> NEQUI</span>;
        if (normalized.includes('BANCOLOMBIA')) return <span className="flex items-center gap-1 text-[#004481] font-bold text-xs"><CreditCard size={14} /> Trans. Bancolombia</span>;
        if (normalized === 'EFECTIVO') return <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><Banknote size={14} /> EFECTIVO</span>;
        return <span className="text-gray-500 font-bold text-xs uppercase">{medio}</span>;
    };

    const handleFilterChange = (column, value) => {
        setColumnFilters(prev => ({ ...prev, [column]: value }));
        setCurrentPage(1);
    };

    const filteredTransacciones = useMemo(() => {
        return data.transacciones.filter(t => {
            const dateStr = new Date(t.fecha).toLocaleDateString() + ' ' + new Date(t.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const montoStr = t.monto.toString();

            const matchesFecha = columnFilters.fecha === '' || 
                dateStr.toLowerCase().includes(columnFilters.fecha.toLowerCase());
            const matchesTipo = columnFilters.tipo === '' || 
                (t.tipo || '').toLowerCase().includes(columnFilters.tipo.toLowerCase());
            const matchesDescripcion = columnFilters.descripcion === '' || 
                (t.descripcion || '').toLowerCase().includes(columnFilters.descripcion.toLowerCase());
            const matchesUsuario = columnFilters.usuario === '' || 
                (t.usuario || '').toLowerCase().includes(columnFilters.usuario.toLowerCase());
            const matchesMedioPago = columnFilters.medioPago === '' || 
                (t.medioPago || '').toLowerCase().includes(columnFilters.medioPago.toLowerCase());
            const matchesMonto = columnFilters.monto === '' || 
                montoStr.includes(columnFilters.monto);

            return matchesFecha && matchesTipo && matchesDescripcion && matchesUsuario && matchesMedioPago && matchesMonto;
        });
    }, [data.transacciones, columnFilters]);

    const paginatedTransacciones = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTransacciones.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTransacciones, currentPage, itemsPerPage]);

    const paginatedCierres = useMemo(() => {
        const startIndex = (currentPageCierres - 1) * itemsPerPageCierres;
        return cierres.slice(startIndex, startIndex + itemsPerPageCierres);
    }, [cierres, currentPageCierres, itemsPerPageCierres]);

    const ultimoCierre = useMemo(() => {
        return cierres.length > 0 ? cierres[0] : null;
    }, [cierres]);

    const montoUltimoCierre = useMemo(() => {
        if (!ultimoCierre) return 0;
        // Priorizar el desglose de efectivo del último cierre para la base de caja física
        if (ultimoCierre.medios_pago && typeof ultimoCierre.medios_pago.efectivo === 'number') {
            return ultimoCierre.medios_pago.efectivo;
        }
        return (ultimoCierre.saldo_real || ultimoCierre.saldo_calculado || 0);
    }, [ultimoCierre]);

    const totalEfectivoConBase = useMemo(() => {
        return (data.resumen.total_efectivo || 0) + montoUltimoCierre;
    }, [data.resumen.total_efectivo, montoUltimoCierre]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Cuadre de Caja Consolidado</h1>
                    <p className="text-gray-500 text-sm font-medium">Control total de ingresos y egresos por medio de pago</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowCierreModal(true)}
                        className="btn-primary flex items-center gap-2 text-sm font-bold bg-slate-900 hover:bg-slate-800 border-none shadow-lg"
                    >
                        <Lock size={18} /> Realizar Cierre de Caja
                    </button>
                    <button 
                        onClick={handleExportExcel}
                        className="btn-secondary flex items-center gap-2 text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                    >
                        <Download size={18} /> Excel
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="btn-secondary flex items-center gap-2 text-sm font-bold bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                    >
                        <FileText size={18} /> Exportar PDF
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
                                value={filtros.inicio.split('T')[0]}
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
                                value={filtros.fin.split('T')[0]}
                                onChange={e => setFiltros({...filtros, fin: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex items-end gap-2 pr-2 border-r border-gray-100">
                        <button 
                            type="button"
                            onClick={handleFilterLastClosure}
                            className={`flex items-center gap-2 px-4 h-11 rounded-xl font-bold transition-all border ${
                                filtros.inicio.includes(':') 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm ring-1 ring-indigo-200' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            <Clock size={18} /> Desde Último Cierre
                        </button>
                    </div>

                    <button type="submit" className="btn-primary flex items-center gap-2 h-11 px-6 font-bold shadow-lg shadow-primary-500/20 active:translate-y-0.5 transition-all">
                        <Filter size={18} /> Generar Reporte
                    </button>
                </form>
            </div>

            {filtros.inicio.includes(':') && (
                <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4 text-indigo-700 shadow-sm animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest opacity-70">Filtro Inteligente Activo</p>
                        <p className="font-bold">Calculando movimientos desde el último cierre: <span className="text-indigo-900">{new Date(filtros.inicio).toLocaleString()}</span></p>
                    </div>
                    <button 
                        type="button"
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            const resetFiltros = { inicio: today, fin: today };
                            setFiltros(resetFiltros);
                            fetchCuadre(resetFiltros);
                        }}
                        className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md"
                    >
                        Quitar filtro
                    </button>
                </div>
            )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 group hover:border-emerald-200 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <Banknote size={20} />
                        </div>
                        <span className="text-sm font-black text-gray-700 uppercase">Efectivo Hoy</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">${formatCurrency(data.resumen.total_efectivo)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 group hover:border-[#7030a0]/30 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#7030a0] flex items-center justify-center text-white shadow-lg shadow-purple-200">
                            <Wallet size={20} />
                        </div>
                        <span className="text-sm font-black text-gray-700 uppercase">Total NEQUI</span>
                    </div>
                    <p className="text-2xl font-black text-[#7030a0]">${formatCurrency(data.resumen.total_nequi)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 group hover:border-[#004481]/30 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#004481] flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-sm font-black text-gray-700 uppercase">Trans. Bancolombia</span>
                    </div>
                    <p className="text-2xl font-black text-[#004481]">${formatCurrency(data.resumen.total_bancolombia)}</p>
                </div>
                <div className="bg-indigo-50/50 p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col items-center justify-center space-y-2 group hover:border-indigo-300 transition-all active:scale-95 cursor-default">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Lock size={18} />
                        </div>
                        <span className="text-sm font-black text-indigo-900 uppercase">Total en Caja (+Base)</span>
                    </div>
                    <p className="text-2xl font-black text-indigo-700">${formatCurrency(totalEfectivoConBase)}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
                        <span>Base Inicio:</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border border-indigo-100 text-indigo-600">${formatCurrency(montoUltimoCierre)}</span>
                    </div>
                    {ultimoCierre && (
                        <div className="mt-2 text-[9px] font-bold text-indigo-300 uppercase tracking-tight text-center">
                            Último Cierre: {new Date(ultimoCierre.fecha).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction List */}
            <div className="card shadow-xl border-none overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={16} /> Historial de Movimientos Detallado
                        <span className="ml-2 text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-bold">{filteredTransacciones.length} registros</span>
                    </h2>
                    {/* Totales en encabezado */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5">
                            <TrendingUp size={14} className="text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase">Ingresos</span>
                            <span className="text-sm font-black text-emerald-700">${formatCurrency(data.resumen.ingresos_totales)}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
                            <TrendingDown size={14} className="text-red-500" />
                            <span className="text-[10px] font-black text-red-400 uppercase">Egresos</span>
                            <span className="text-sm font-black text-red-600">${formatCurrency(data.resumen.egresos_totales)}</span>
                        </div>
                        <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 ${
                            data.resumen.balance_final >= 0 
                            ? 'bg-slate-800 border-slate-700' 
                            : 'bg-red-700 border-red-600'
                        }`}>
                            <Receipt size={14} className="text-white" />
                            <span className="text-[10px] font-black text-white/70 uppercase">Balance</span>
                            <span className="text-sm font-black text-white">${formatCurrency(data.resumen.balance_final)}</span>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <div className="max-h-[520px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-gray-400">
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Fecha/Hora</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Estado</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Tipo</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest w-1/3">Descripción</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Usuario</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Medio Pago</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-right">Monto</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-center">Ver</th>
                            </tr>
                            <tr className="bg-white border-b border-gray-50">
                                <th className="px-4 py-2">
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar fecha..."
                                        className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                        value={columnFilters.fecha}
                                        onChange={(e) => handleFilterChange('fecha', e.target.value)}
                                    />
                                </th>
                                <th className="px-4 py-2">
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar tipo..."
                                        className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                        value={columnFilters.tipo}
                                        onChange={(e) => handleFilterChange('tipo', e.target.value)}
                                    />
                                </th>
                                <th className="px-4 py-2">
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar desc..."
                                        className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                        value={columnFilters.descripcion}
                                        onChange={(e) => handleFilterChange('descripcion', e.target.value)}
                                    />
                                </th>
                                <th className="px-4 py-2">
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar usuario..."
                                        className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                        value={columnFilters.usuario}
                                        onChange={(e) => handleFilterChange('usuario', e.target.value)}
                                    />
                                </th>
                                <th className="px-4 py-2">
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar medio..."
                                        className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                        value={columnFilters.medioPago}
                                        onChange={(e) => handleFilterChange('medioPago', e.target.value)}
                                    />
                                </th>
                                <th className="px-4 py-2">
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar monto..."
                                        className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                        value={columnFilters.monto}
                                        onChange={(e) => handleFilterChange('monto', e.target.value)}
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="8" className="p-12 text-center text-gray-400 font-bold animate-pulse">Analizando flujos de caja...</td></tr>
                            ) : paginatedTransacciones.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-gray-500 font-medium italic">
                                        No se encontraron movimientos.
                                    </td>
                                </tr>
                            ) : (
                                paginatedTransacciones.map((t, i) => {
                                    const tTime = new Date(t.fecha).getTime();
                                    const cTime = ultimoCierre ? new Date(ultimoCierre.fecha).getTime() : 0;
                                    const esNuevo = !ultimoCierre || tTime > cTime;
                                    
                                    return (
                                    <tr key={i} className={`transition-all duration-300 group ${esNuevo ? 'bg-blue-100/40 border-l-[6px] border-l-blue-600 shadow-sm' : 'hover:bg-gray-50'}`}>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className={`text-xs font-black ${esNuevo ? 'text-blue-900' : 'text-gray-900'} ${!esNuevo ? 'border-l-2 border-primary-500 pl-2' : 'pl-2'}`}>
                                                {new Date(t.fecha).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold pl-2">
                                                {new Date(t.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {esNuevo ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-widest animate-pulse">
                                                    <Clock size={12} />
                                                    Pendiente
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-50 text-slate-400 border border-slate-200 uppercase tracking-widest">
                                                    <Lock size={12} />
                                                    Cerrado
                                                </span>
                                            )}
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
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleVerDetalle(t)}
                                                className="p-2 text-primary-500 hover:bg-primary-50 rounded-xl transition-all active:scale-90 group-hover:scale-110"
                                                title="Ver Detalle Completo"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                        {/* Totales pegados al pie de la tabla */}
                        {!loading && filteredTransacciones.length > 0 && (
                            <tfoot className="sticky bottom-0 z-10">
                                <tr className="bg-slate-900 text-white">
                                    <td colSpan="6" className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-6 text-xs font-black uppercase tracking-wider">
                                            <span className="text-slate-400">Totales del período:</span>
                                            <span className="flex items-center gap-1 text-emerald-400">
                                                <TrendingUp size={13} /> Ingresos: ${formatCurrency(data.resumen.ingresos_totales)}
                                            </span>
                                            <span className="flex items-center gap-1 text-red-400">
                                                <TrendingDown size={13} /> Egresos: ${formatCurrency(data.resumen.egresos_totales)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <span className={`text-sm font-black ${
                                            data.resumen.balance_final >= 0 ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                            {data.resumen.balance_final >= 0 ? '+' : ''}
                                            ${formatCurrency(data.resumen.balance_final)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                    </div>
                </div>

                {!loading && (
                    <Pagination 
                        currentPage={currentPage}
                        totalItems={filteredTransacciones.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(val) => {
                            setItemsPerPage(val);
                            setCurrentPage(1);
                        }}
                    />
                )}
            </div>

            {/* Closure History */}
            <div className="card shadow-xl border-none overflow-hidden mt-8">
                <div className="p-4 border-b border-gray-100 bg-slate-50">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} /> Historial de Cierres de Caja (Notas)
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-gray-400">
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Fecha Cierre</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest">Usuario</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest w-1/3">Nota / Observación</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-right">Saldo Final</th>
                                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {cierres.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        No hay cierres registrados aún.
                                    </td>
                                </tr>
                            ) : (
                                paginatedCierres.map((c, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-slate-700">
                                            {new Date(c.fecha).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-slate-600 font-medium">
                                            {c.usuario_nombre || c.usuario?.nombre}
                                        </td>
                                        <td className="p-4 text-slate-500 italic">
                                            "{c.nota}"
                                        </td>
                                        <td className="p-4 text-right font-black text-slate-900 text-base">
                                            ${formatCurrency(c.saldo_real || c.saldo_calculado)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEditCierreStart(c)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar Cierre"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteCierre(c._id)}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar Cierre"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination 
                    currentPage={currentPageCierres}
                    totalItems={cierres.length}
                    itemsPerPage={itemsPerPageCierres}
                    onPageChange={setCurrentPageCierres}
                    onItemsPerPageChange={(val) => {
                        setItemsPerPageCierres(val);
                        setCurrentPageCierres(1);
                    }}
                />
            </div>

            {/* Closure Modal */}
            {showCierreModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-gray-100">
                        <div className="p-6 border-b border-gray-100 bg-slate-900 text-white shadow-lg">
                            <h2 className="text-2xl font-black">{editingId ? 'Editar Cierre de Caja' : 'Finalizar y Cerrar Caja'}</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {editingId ? 'Actualiza la nota o el monto físico del cierre seleccionado.' : 'Se registrará el balance actual y tu nota de cierre.'}
                            </p>
                        </div>
                        <form onSubmit={handleCierreSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Efectivo en Sistema (Base + Hoy)</p>
                                    <p className="text-lg font-black text-slate-900">${formatCurrency(totalEfectivoConBase)}</p>
                                </div>
                                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-tighter">Monto Físico (Opcional)</p>
                                    <input 
                                        type="text"
                                        placeholder="0"
                                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-lg font-black text-primary-700 placeholder:text-primary-200"
                                        value={saldoReal}
                                        onChange={handleSaldoRealChange}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Nota / Comentario de Cierre *</label>
                                <textarea 
                                    required
                                    className="input-field h-32 resize-none text-base p-4 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                                    placeholder="Escribe aquí cualquier observación sobre el cierre de hoy..."
                                    value={cierreNota}
                                    onChange={e => setCierreNota(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowCierreModal(false);
                                        resetCierreForm();
                                    }} 
                                    className="flex-1 btn-secondary py-3 font-bold border-slate-200 text-slate-500"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-[2] btn-primary bg-slate-900 hover:bg-black text-white py-3 shadow-xl font-bold border-none transition-all active:scale-95">
                                    {editingId ? 'Guardar Cambios' : 'Confirmar y Guardar Cierre'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modales de Detalle */}
            <DetallesRegistroModal 
                registroId={selectedRegistroId}
                isOpen={showRegistroModal}
                onClose={() => {
                    setShowRegistroModal(false);
                    setSelectedRegistroId(null);
                }}
                onSuccess={fetchCuadre}
            />

            <DetalleMovimientoModal 
                isOpen={showDetalleModal}
                transaccion={selectedTransaccion}
                onClose={() => {
                    setShowDetalleModal(false);
                    setSelectedTransaccion(null);
                }}
            />
        </div>
    );
};

export default CuadreCaja;
