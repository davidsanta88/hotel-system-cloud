import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import moment from 'moment';
import 'moment/locale/es';
import { 
    Calendar as CalendarIcon, 
    Search, 
    AlertCircle, 
    Printer, 
    RefreshCw, 
    Hotel, 
    Building2, 
    Calendar, 
    User, 
    FileSpreadsheet, 
    FileText,
    TrendingUp,
    CreditCard,
    ClipboardCheck,
    MapPin,
    ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import { formatCurrency } from '../utils/format';
import Pagination from '../components/common/Pagination';
import { generateVoucher } from '../utils/voucherGenerator';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

moment.locale('es');

const ReservasConsolidadas = () => {
    const { user } = useContext(AuthContext);
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [hotelFilter, setHotelFilter] = useState('all'); // 'all', 'plaza', 'colonial'
    const [statusFilter, setStatusFilter] = useState('all');
    const [fechaInicio, setFechaInicio] = useState(moment().format('YYYY-MM-DD'));
    const [fechaFin, setFechaFin] = useState(moment().add(3, 'months').format('YYYY-MM-DD'));
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchConsolidated();
    }, [fechaInicio, fechaFin]);

    const fetchConsolidated = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/stats/consolidated-reservations?inicio=${fechaInicio}&fin=${fechaFin}`);
            setReservas(res.data);
        } catch (error) {
            console.error('Error fetching consolidated reservations:', error);
            Swal.fire('Error', 'No se pudieron cargar las reservaciones consolidadas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredReservas = useMemo(() => {
        return reservas.filter(r => {
            // Search term
            const searchLower = searchTerm.toLowerCase();
            const cliente = (r.cliente_nombre || '').toLowerCase();
            const doc = (r.documento || '').toLowerCase();
            const matchesSearch = searchTerm === '' || cliente.includes(searchLower) || doc.includes(searchLower);

            // Hotel filter
            const matchesHotel = hotelFilter === 'all' || r.hotel_id === hotelFilter;

            // Status filter
            const matchesStatus = statusFilter === 'all' || (r.estado || 'Confirmada') === statusFilter;

            return matchesSearch && matchesHotel && matchesStatus;
        });
    }, [reservas, searchTerm, hotelFilter, statusFilter]);

    // Resumen estadístico
    const stats = useMemo(() => {
        const totalValue = filteredReservas.reduce((acc, r) => acc + (r.valor_total || 0), 0);
        const totalPaid = filteredReservas.reduce((acc, r) => acc + (r.valor_abonado || 0), 0);
        return {
            total: filteredReservas.length,
            totalValue,
            pending: totalValue - totalPaid
        };
    }, [filteredReservas]);

    const paginatedReservas = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredReservas.slice(start, start + itemsPerPage);
    }, [filteredReservas, currentPage, itemsPerPage]);

    // Funciones de Exportación
    const handleExportExcel = () => {
        const dataToExport = filteredReservas.map(r => ({
            'Hotel': r.hotel,
            'Estado': r.estado || 'Confirmada',
            'Cliente': r.cliente_nombre?.toUpperCase(),
            'Identificación': r.documento,
            'Habitaciones': r.habitaciones_desc,
            'Entrada': moment.utc(r.fecha_entrada).format('DD/MM/YYYY'),
            'Salida': moment.utc(r.fecha_salida).format('DD/MM/YYYY'),
            'Noches': moment.utc(r.fecha_salida).diff(moment.utc(r.fecha_entrada), 'days'),
            'Valor Total': r.valor_total,
            'Valor Abonado': r.valor_abonado,
            'Saldo': (r.valor_total || 0) - (r.valor_abonado || 0)
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas");
        XLSX.writeFile(workbook, `Consolidado_Reservas_${fechaInicio}_al_${fechaFin}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const tableColumn = ["Hotel", "Estado", "Cliente", "Habitaciones", "Entrada", "Salida", "Total", "Abonado", "Saldo"];
        const tableRows = filteredReservas.map(r => [
            r.hotel,
            r.estado || 'Confirmada',
            r.cliente_nombre?.toUpperCase(),
            r.habitaciones_desc,
            moment.utc(r.fecha_entrada).format('DD/MM/YYYY'),
            moment.utc(r.fecha_salida).format('DD/MM/YYYY'),
            `$${formatCurrency(r.valor_total)}`,
            `$${formatCurrency(r.valor_abonado)}`,
            `$${formatCurrency((r.valor_total || 0) - (r.valor_abonado || 0))}`
        ]);

        doc.setFontSize(18);
        doc.text("Consolidado Global de Reservas", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Rango: ${fechaInicio} al ${fechaFin}`, 14, 30);
        doc.text(`Generado el: ${moment().format('DD/MM/YYYY HH:mm')}`, 14, 35);

        autoTable(doc, {
            startY: 40,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] },
            styles: { fontSize: 8 }
        });

        doc.save(`Consolidado_Reservas_${new Date().getTime()}.pdf`);
    };

    const getStatusStyle = (estado) => {
        switch((estado || 'Confirmada').toLowerCase()) {
            case 'confirmada': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'pendiente': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'checked-in': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cancelada': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 min-h-[60vh]">
            <div className="relative">
                <RefreshCw className="animate-spin text-indigo-600 mb-4" size={64} />
                <Hotel className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 opacity-20" size={32} />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm animate-pulse">Consolidando ocupación global...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800 tracking-tight">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                            <Building2 size={28} />
                        </div>
                        Consolidado de Reservas
                    </h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1 ml-1">Proyección de ocupación multihotel</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <button 
                            onClick={() => setHotelFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${hotelFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                        >
                            TODOS
                        </button>
                        <button 
                            onClick={() => setHotelFilter('plaza')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${hotelFilter === 'plaza' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                        >
                            PLAZA
                        </button>
                        <button 
                            onClick={() => setHotelFilter('colonial')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${hotelFilter === 'colonial' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                        >
                            COLONIAL
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <Calendar size={16} className="text-slate-400" />
                        <input 
                            type="date" 
                            className="bg-transparent border-none text-[11px] font-black text-slate-600 focus:ring-0 p-0 w-28"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                        <span className="text-slate-300">-</span>
                        <input 
                            type="date" 
                            className="bg-transparent border-none text-[11px] font-black text-slate-600 focus:ring-0 p-0 w-28"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        onClick={fetchConsolidated}
                        className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                    >
                        <RefreshCw size={20} />
                    </button>

                    <div className="flex items-center gap-2 border-l pl-3 border-slate-200">
                        <button 
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                        >
                            <FileSpreadsheet size={16} />
                            EXCEL
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos Proyectados</p>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(stats.totalValue)}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                        <CreditCard size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cartera Pendiente</p>
                        <h4 className="text-2xl font-black text-rose-600 tracking-tighter">{formatCurrency(stats.pending)}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <ClipboardCheck size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reservas Activas</p>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.total} registros</h4>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-2">
                    <div className="pl-4 text-slate-300">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text"
                        placeholder="Buscar por cliente o identificación..."
                        className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="w-full md:w-64 bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-2">
                    <select 
                        className="w-full bg-transparent border-none text-xs font-black text-slate-600 focus:ring-0 uppercase tracking-widest"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">TODOS LOS ESTADOS</option>
                        <option value="Confirmada">CONFIRMADAS</option>
                        <option value="Pendiente">PENDIENTES</option>
                        <option value="Checked-in">YA EN HOTEL</option>
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                                <th className="px-6 py-5">Ubicación / Hotel</th>
                                <th className="px-6 py-5">Información Cliente</th>
                                <th className="px-6 py-5 text-center">Estado</th>
                                <th className="px-6 py-5">Habitaciones</th>
                                <th className="px-6 py-5 text-right">Fechas y Valor</th>
                                <th className="px-6 py-5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginatedReservas.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                                                <AlertCircle size={40} />
                                            </div>
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No se encontraron reservas para estos filtros</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedReservas.map((r, idx) => {
                                    const diff = moment.utc(r.fecha_salida).diff(moment.utc(r.fecha_entrada), 'days');
                                    const saldo = (r.valor_total || 0) - (r.valor_abonado || 0);
                                    
                                    return (
                                        <tr key={`${r.hotel_id}-${r.id || idx}`} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className={`flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                                        r.hotel_id === 'plaza' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                                                    }`}>
                                                        <MapPin size={10} />
                                                        {r.hotel}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                        <Hotel size={12} className="text-slate-300" />
                                                        {r.hotel_id === 'plaza' ? 'Principal' : 'Colonial'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 text-sm uppercase tracking-tight">{r.cliente_nombre}</span>
                                                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                                        <User size={10} /> {r.documento}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(r.estado)}`}>
                                                    {r.estado || 'Confirmada'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black border border-slate-200">
                                                        Hab {r.habitaciones_desc}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-2 text-xs font-black text-slate-800 tracking-tighter">
                                                        {moment.utc(r.fecha_entrada).format('DD MMM')} 
                                                        <ArrowRight size={10} className="text-slate-300" /> 
                                                        {moment.utc(r.fecha_salida).format('DD MMM')}
                                                    </div>
                                                    <div className="text-sm font-black text-indigo-600 mt-1">
                                                        {formatCurrency(r.valor_total)}
                                                    </div>
                                                    {saldo > 0 && (
                                                        <div className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded mt-1">
                                                            DEBE: {formatCurrency(saldo)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => generateVoucher({ ...r, tipo: 'reserva' })}
                                                        className="p-2.5 bg-white text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-slate-100 hover:border-indigo-100 shadow-sm"
                                                        title="Imprimir Voucher"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-slate-50/30">
                    <Pagination 
                        currentPage={currentPage}
                        totalItems={filteredReservas.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(val) => {
                            setItemsPerPage(val);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ReservasConsolidadas;
