import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import { format, subMonths, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { 
    Plus, Search, Edit2, Trash2, Calendar, FileText, FileSpreadsheet, Map, 
    ChevronLeft, ChevronRight, Info, Eye, Printer, CreditCard, MessageCircle, 
    CheckCircle, XCircle, Wallet, CircleDollarSign, TrendingUp, Receipt
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import RegistroModal from '../components/modals/RegistroModal';
import DetallesRegistroModal from '../components/modals/DetallesRegistroModal';
import { formatCurrency, cleanNumericValue } from '../utils/format';
import Pagination from '../components/common/Pagination';
import { generateVoucher } from '../utils/voucherGenerator';

const Registros = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [registros, setRegistros] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [mediosPago, setMediosPago] = useState([]);
    const [tiposRegistro, setTiposRegistro] = useState([]);
    const [clienteSearch, setClienteSearch] = useState('');
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRegistroDetails, setSelectedRegistroDetails] = useState(null);
    const [selectedRegistroId, setSelectedRegistroId] = useState(null);
    const [initialEditMode, setInitialEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState([]);
    const [consumos, setConsumos] = useState([]);
    const [abonos, setAbonos] = useState([]);
    const [showAbonoForm, setShowAbonoForm] = useState(false);
    const [abonoForm, setAbonoForm] = useState({ monto: '', medio: '', notas: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [showConsumoForm, setShowConsumoForm] = useState(false);
    const [selectedProducto, setSelectedProducto] = useState('');
    const [cantidadConsumo, setCantidadConsumo] = useState(1);
    const [guestEditForm, setGuestEditForm] = useState({ 
        nombre: '', 
        documento: '', 
        tipo_documento: 'CC', 
        telefono: '', 
        email: '', 
        municipio_origen_id: '' 
    });
    
    // Form state
    const [formData, setFormData] = useState({
        habitacion_id: '',
        fecha_ingreso: '',
        fecha_salida: '',
        total: '',
        medio_pago_id: '',
        valor_cobrado: '',
        notas: '',
        tipo_registro_id: ''
    });
    const [huespedesList, setHuespedesList] = useState([]);
    const [guestForm, setGuestForm] = useState({ 
        nombre: '', 
        documento: '', 
        tipo_documento: 'CC', 
        telefono: '', 
        email: '', 
        municipio_origen_id: '' 
    });

    // Estados para búsqueda, filtrado y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [fechaInicio, setFechaInicio] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [columnFilters, setColumnFilters] = useState({
        huesped: '',
        habitacion: '',
        fechas: '',
        estado: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleFilterChange = (column, value) => {
        setColumnFilters(prev => ({ ...prev, [column]: value }));
        setCurrentPage(1);
    };

    // Lógica de Filtrado Combinada (Búsqueda General + Filtros por Columna + Rango de Fechas)
    const filteredRegistros = useMemo(() => {
        return registros.filter(res => {
            // 1. Rango de Fechas (sobre fecha_ingreso)
            const fIngreso = parseISO(res.fecha_ingreso);
            const start = startOfDay(parseISO(fechaInicio));
            const end = endOfDay(parseISO(fechaFin));
            const matchesDates = isWithinInterval(fIngreso, { start, end });
            if (!matchesDates) return false;

            // 2. Búsqueda General
            const searchStr = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                res.nombre_cliente?.toLowerCase().includes(searchStr) ||
                res.numero_habitacion?.toString().includes(searchStr) ||
                res.documento_cliente?.toLowerCase().includes(searchStr);
            if (!matchesSearch) return false;

            // 3. Filtros por Columna
            const matchesHuesped = !columnFilters.huesped || res.nombre_cliente?.toLowerCase().includes(columnFilters.huesped.toLowerCase());
            const matchesHabitacion = !columnFilters.habitacion || res.numero_habitacion?.toString().includes(columnFilters.habitacion);
            const matchesFechas = !columnFilters.fechas || format(new Date(res.fecha_ingreso), 'dd/MM/yyyy').includes(columnFilters.fechas);
            const matchesEstado = !columnFilters.estado || res.estado?.toLowerCase().includes(columnFilters.estado.toLowerCase());

            return matchesHuesped && matchesHabitacion && matchesFechas && matchesEstado;
        });
    }, [registros, searchTerm, columnFilters, fechaInicio, fechaFin]);

    const paginatedRegistros = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRegistros.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRegistros, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredRegistros.length / itemsPerPage);
    
    // Estadísticas Dinámicas para las Tarjetas
    const stats = useMemo(() => {
        const alojamiento = filteredRegistros.reduce((acc, r) => acc + (r.total || 0), 0);
        const abonado = filteredRegistros.reduce((acc, r) => acc + (r.valor_pagado || 0), 0);
        const saldo = alojamiento - abonado;
        return { alojamiento, abonado, saldo };
    }, [filteredRegistros]);

    // Funciones de Exportación
    const handleExportExcel = () => {
        const totalEstancia = filteredRegistros.reduce((acc, res) => acc + (res.total || 0), 0);
        const totalPagado = filteredRegistros.reduce((acc, res) => acc + (res.valor_pagado || 0), 0);

        const dataToExport = filteredRegistros.map(res => ({
            'Huésped': res.nombre_cliente,
            'Documento': res.documento_cliente,
            'Teléfono': res.telefono_cliente || 'N/A',
            'Habitación': res.numero_habitacion,
            'Entrada': format(new Date(res.fecha_ingreso), 'dd/MM/yyyy'),
            'Salida': format(new Date(res.fecha_salida), 'dd/MM/yyyy'),
            'Tipo': res.tipo_registro_nombre || 'Formal',
            'Valor Estancia': res.total,
            'Total Pagado': res.valor_pagado,
            'Saldo': res.total - res.valor_pagado,
            'Estado': res.estado.toUpperCase()
        }));

        // Añadir fila de totales
        dataToExport.push({
            'Huésped': '--- TOTALES ---',
            'Documento': '',
            'Teléfono': '',
            'Habitación': '',
            'Entrada': '',
            'Salida': '',
            'Tipo': '',
            'Valor Estancia': totalEstancia,
            'Total Pagado': totalPagado,
            'Saldo': totalEstancia - totalPagado,
            'Estado': ''
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
        XLSX.writeFile(workbook, `Reporte_Registros_${fechaInicio}_al_${fechaFin}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const totalEstancia = filteredRegistros.reduce((acc, res) => acc + (res.total || 0), 0);
        const totalPagado = filteredRegistros.reduce((acc, res) => acc + (res.valor_pagado || 0), 0);

        const tableColumn = ["Huésped", "Hab", "Entrada", "Salida", "Total", "Pagado", "Saldo", "Estado"];
        const tableRows = filteredRegistros.map(res => [
            res.nombre_cliente,
            res.numero_habitacion,
            format(new Date(res.fecha_ingreso), 'dd/MM/yyyy'),
            format(new Date(res.fecha_salida), 'dd/MM/yyyy'),
            `$${formatCurrency(res.total)}`,
            `$${formatCurrency(res.valor_pagado)}`,
            `$${formatCurrency((res.total || 0) - (res.valor_pagado || 0))}`,
            res.status?.toUpperCase() || res.estado?.toUpperCase() || ''
        ]);

        doc.setFontSize(18);
        doc.text("Reporte de Registro de Huéspedes", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Rango: ${fechaInicio} al ${fechaFin}`, 14, 30);
        doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35);

        autoTable(doc, {
            startY: 40,
            head: [tableColumn],
            body: tableRows,
            foot: [[
                "--- TOTALES ---",
                "",
                "",
                "",
                `$${formatCurrency(totalEstancia)}`,
                `$${formatCurrency(totalPagado)}`,
                `$${formatCurrency(totalEstancia - totalPagado)}`,
                ""
            ]],
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] },
            footStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' }
        });

        doc.save(`Reporte_Huespedes_${fechaInicio}_al_${fechaFin}.pdf`);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [resRegistros, resHab, resClientes, resMuni, resMedios, resProd, resTipos] = await Promise.all([
                api.get('/registros'),
                api.get('/habitaciones'),
                api.get('/clientes'),
                api.get('/municipios'),
                api.get('/medios-pago'),
                api.get('/productos'),
                api.get('/tipos-registro')
            ]);
            setRegistros(resRegistros.data);
            setHabitaciones(resHab.data);
            setClientes(resClientes.data);
            setMunicipios(resMuni.data);
            setMediosPago(resMedios.data);
            setProductos(resProd.data);
            setTiposRegistro(resTipos.data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoEdit = (id) => {
        handleViewDetails(id, true);
    };

    const updateStatus = async (id, estado) => {
        try {
            await api.put(`/registros/${id}`, { estado });
            Swal.fire('Actualizado', `Registro marcado como ${estado}`, 'success');
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
        }
    };

    const handleCheckout = async (id) => {
        const result = await Swal.fire({
            title: '¿Confirmar Check-out?',
            text: "La habitación pasará a estado 'Pendiente por asear'.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, finalizar estancia',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                await api.put(`/registros/checkout/${id}`);
                Swal.fire('Éxito', 'Check-out realizado. Habitación lista para aseo.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo procesar el check-out', 'error');
            }
        }
    };

    const handleViewDetails = async (id, editMode = false) => {
        setSelectedRegistroId(id);
        setInitialEditMode(editMode);
        
        if (!editMode) {
            try {
                setLoading(true);
                const [resDet, resCons, resAbonos] = await Promise.all([
                    api.get(`/registros/${id}`),
                    api.get(`/ventas/consumo/${id}`),
                    api.get(`/registros/${id}/pagos`)
                ]);
                setSelectedRegistroDetails(resDet.data);
                setConsumos(resCons.data);
                setAbonos(resAbonos.data);
                setShowDetailsModal(true);
            } catch (error) {
                Swal.fire('Error', 'No se pudieron cargar los detalles del registro', 'error');
            } finally {
                setLoading(false);
            }
        } else {
            setShowDetailsModal(true);
        }
    };

    const handleDelete = async (id) => {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: "Esta acción eliminará el registro permanentemente y liberará la habitación si está activa.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                Swal.fire({ title: 'Eliminando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                await api.delete(`/registros/${id}`);
                Swal.fire('Eliminado', 'El registro ha sido eliminado correctamente.', 'success');
                fetchData();
            }
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el registro', 'error');
        }
    };

    useEffect(() => {
        const roomToSelect = searchParams.get('habitacionId');
        const isNew = searchParams.get('nueva');
        const roomToView = searchParams.get('habitacion');
        const verPagos = searchParams.get('verPagos');
        
        if (isNew === 'true' && roomToSelect && habitaciones.length > 0) {
            const fechaIn = format(new Date(), 'yyyy-MM-dd');
            const fechaOut = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
            
            setFormData(prev => ({ 
                ...prev, 
                habitacion_id: roomToSelect,
                fecha_ingreso: fechaIn,
                fecha_salida: fechaOut
            }));
            
            setShowModal(true);
            
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('nueva');
            newSearchParams.delete('habitacionId');
            setSearchParams(newSearchParams);
        } else if (verPagos === 'true' && roomToView && registros.length > 0) {
            const registro = registros.find(r => String(r.numero_habitacion) === String(roomToView) && r.estado === 'activa');
            if (registro) {
                handleViewDetails(registro.id);
            }
            
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('verPagos');
            newParams.delete('habitacion');
            setSearchParams(newParams);
        } else if (searchParams.get('editar') === 'true') {
            const idToEdit = searchParams.get('id');
            const roomNum = searchParams.get('habitacion');
            
            if (idToEdit) {
                handleAutoEdit(idToEdit);
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('editar');
                newParams.delete('id');
                setSearchParams(newParams);
            } else if (roomNum && registros.length > 0) {
                const registro = registros.find(r => String(r.numero_habitacion) === String(roomNum) && r.estado === 'activa');
                if (registro) {
                    handleAutoEdit(registro.id);
                }
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('editar');
                newParams.delete('habitacion');
                setSearchParams(newParams);
            }
        }
    }, [searchParams, habitaciones, registros]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Registro de Huéspedes</h1>
                    <p className="text-slate-500 font-medium">Gestione los ingresos y el alojamiento diario</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => navigate('/habitaciones/mapa')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                    >
                        <Map size={18} /> Ir a Mapa de Habitaciones
                    </button>
                </div>
            </div>

            {/* Tarjetas de Resumen Financiero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md group">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Alojamiento</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">${formatCurrency(stats.alojamiento)}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md group">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Abonado</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">${formatCurrency(stats.abonado)}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md group">
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Pendiente</p>
                        <h3 className="text-2xl font-black text-red-600 tracking-tight">${formatCurrency(stats.saldo)}</h3>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros y Herramientas */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative group w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre de huésped o habitación..."
                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 px-3 border-r border-slate-200">
                            <Calendar size={14} className="text-slate-400" />
                            <input 
                                type="date" 
                                className="bg-transparent border-none text-[11px] font-black text-slate-600 focus:ring-0 p-0"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 px-3">
                            <input 
                                type="date" 
                                className="bg-transparent border-none text-[11px] font-black text-slate-600 focus:ring-0 p-0"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={handleExportExcel}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-all border border-emerald-100"
                        title="Exportar a Excel"
                    >
                        <FileSpreadsheet size={16} /> Excel
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-2xl font-black text-xs hover:bg-blue-100 transition-all border border-blue-100"
                        title="Exportar a PDF"
                    >
                        <FileText size={16} /> PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="text-center p-8 text-gray-400">Cargando registros...</div>
                ) : (
                    <div className="card overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Huésped</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Hab.</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fechas</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Alojamiento</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Abonado</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                                {/* Fila de Filtros */}
                                <tr className="bg-white">
                                    <th className="px-6 py-2 border-b border-slate-50">
                                        <input 
                                            type="text" 
                                            placeholder="Filtrar huésped..."
                                            className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                            value={columnFilters.huesped}
                                            onChange={(e) => handleFilterChange('huesped', e.target.value)}
                                        />
                                    </th>
                                    <th className="px-6 py-2 border-b border-slate-50">
                                        <input 
                                            type="text" 
                                            placeholder="Hab..."
                                            className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300 text-center"
                                            value={columnFilters.habitacion}
                                            onChange={(e) => handleFilterChange('habitacion', e.target.value)}
                                        />
                                    </th>
                                    <th className="px-6 py-2 border-b border-slate-50">
                                        <input 
                                            type="text" 
                                            placeholder="Filtrar fecha..."
                                            className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                            value={columnFilters.fechas}
                                            onChange={(e) => handleFilterChange('fechas', e.target.value)}
                                        />
                                    </th>
                                    <th className="px-6 py-2 border-b border-slate-50"></th>
                                    <th className="px-6 py-2 border-b border-slate-50"></th>
                                    <th className="px-6 py-2 border-b border-slate-50"></th>
                                    <th className="px-6 py-2 border-b border-slate-50">
                                        <input 
                                            type="text" 
                                            placeholder="Estado..."
                                            className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                            value={columnFilters.estado}
                                            onChange={(e) => handleFilterChange('estado', e.target.value)}
                                        />
                                    </th>
                                    <th className="px-6 py-2 border-b border-slate-50"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedRegistros.map((res) => {
                                    const saldo = (res.total || 0) - (res.valor_pagado || 0);
                                    return (
                                        <tr key={res.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900 uppercase leading-none mb-1">{res.nombre_cliente}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-500 font-medium leading-none mb-1">Doc: {res.documento_cliente || 'N/A'}</span>
                                                    {(res.telefono_cliente || res.cliente?.telefono) && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-gray-400 bg-teal-50 px-1.5 py-0.5 rounded-md leading-none">{(res.telefono_cliente || res.cliente?.telefono)}</span>
                                                            <a 
                                                                href={`https://wa.me/${(res.telefono_cliente || res.cliente?.telefono).toString().replace(/\s+/g, '')}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                                title="Escribir al WhatsApp"
                                                            >
                                                                <MessageCircle size={10} />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">#{res.numero_habitacion}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[11px] text-gray-500 font-medium">
                                                {format(new Date(res.fecha_ingreso), 'dd/MM/yyyy')} - {format(new Date(res.fecha_salida), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="font-bold text-gray-700 text-sm">${formatCurrency(res.total)}</div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase">{res.tipo_registro_nombre || 'Formal'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="font-bold text-emerald-600 text-sm">${formatCurrency(res.valor_pagado)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className={`font-black text-sm ${saldo > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    ${formatCurrency(saldo)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase
                                                    ${['activa', 'activo'].includes(res.estado?.toLowerCase()) ? 'bg-green-100 text-green-800' : 
                                                      res.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                      res.estado === 'completada' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {res.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleViewDetails(res.id, false)} className="text-gray-500 hover:text-gray-900 mx-1" title="Ver Detalles">
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        await generateVoucher({
                                                            cliente_nombre: res.nombre_cliente || res.cliente?.nombre || 'Huésped',
                                                            identificacion: res.documento_cliente || res.cliente?.documento || 'N/A',
                                                            telefono: res.telefono_cliente || res.cliente?.telefono || 'N/A',
                                                            fecha_entrada: res.fecha_ingreso,
                                                            fecha_salida: res.fecha_salida,
                                                            habitaciones: [{
                                                                numero: res.numero_habitacion,
                                                                precio: res.total / Math.max(1, Math.ceil((new Date(res.fecha_salida) - new Date(res.fecha_ingreso)) / (1000 * 60 * 60 * 24)))
                                                            }],
                                                            valor_total: res.total,
                                                            valor_abonado: res.valor_pagado,
                                                            tipo: 'registro'
                                                        });
                                                    }} 
                                                    className="text-slate-400 hover:text-slate-700 mx-1" 
                                                    title="Imprimir Voucher PDF"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                {res.estado === 'activa' && (
                                                    <button onClick={() => handleViewDetails(res.id, true)} className="text-emerald-600 hover:text-emerald-900 mx-1" title="Registrar Pago / Abono">
                                                        <CreditCard size={18} />
                                                    </button>
                                                )}
                                                {res.estado === 'pendiente' && (
                                                    <>
                                                        <button onClick={() => updateStatus(res.id, 'activa')} className="text-green-600 hover:text-green-900 mx-1" title="Check-in">
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button onClick={() => updateStatus(res.id, 'cancelada')} className="text-red-600 hover:text-red-900 mx-1" title="Cancelar">
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {res.estado === 'activa' && (
                                                    <button onClick={() => handleCheckout(res.id)} className="text-blue-600 hover:text-blue-900 mx-1 font-bold text-[10px] uppercase border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 transition-colors" title="Realizar Check-out">
                                                        SALIDA
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(res.id)} className="text-red-300 hover:text-red-600 mx-1" title="Eliminar Registro">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {paginatedRegistros.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <Info className="text-slate-200 mb-2" size={48} />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No se encontraron registros</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        <div className="mt-4">
                            <Pagination 
                                currentPage={currentPage}
                                totalItems={filteredRegistros.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={(val) => {
                                    setItemsPerPage(val);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <RegistroModal 
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                initialHabitacionId={formData.habitacion_id}
                onSuccess={() => {
                    fetchData();
                    setShowModal(false);
                }}
            />

            {/* Modal de Detalle Original (Restaurado) */}
            {showDetailsModal && selectedRegistroDetails && !initialEditMode && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl w-full max-w-4xl m-4 relative animate-in zoom-in duration-300">
                        <button 
                            onClick={() => setShowDetailsModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XCircle size={24} />
                        </button>
                        
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Detalles del Registro</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Resumen General Operativo</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => {
                                        setInitialEditMode(true);
                                    }}
                                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all font-bold text-xs uppercase"
                                >
                                    <Edit2 size={16} />
                                    <span>Editar / Pagos</span>
                                </button>
                                <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest
                                    ${selectedRegistroDetails.estado === 'activa' ? 'bg-green-100 text-green-800' : 
                                    selectedRegistroDetails.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                    selectedRegistroDetails.estado === 'completada' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {selectedRegistroDetails.estado}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alojamiento</div>
                                <div className="text-xl font-black text-slate-800">${formatCurrency(selectedRegistroDetails.total)}</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Consumos</div>
                                <div className="text-xl font-black text-blue-800">
                                    ${formatCurrency(consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0))}
                                </div>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Abonado</div>
                                <div className="text-xl font-black text-emerald-800">
                                    ${formatCurrency(selectedRegistroDetails.valor_pagado || 0)}
                                </div>
                            </div>
                            <div className={`p-4 rounded-2xl border ${ ((selectedRegistroDetails.total + consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0)) - (selectedRegistroDetails.valor_pagado || 0) > 0) ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo</div>
                                <div className={`text-xl font-black ${((selectedRegistroDetails.total + consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0)) - (selectedRegistroDetails.valor_pagado || 0) > 0) ? 'text-red-600' : 'text-green-600'}`}>
                                    ${formatCurrency(Math.max(0, (selectedRegistroDetails.total + consumos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0)) - (selectedRegistroDetails.valor_pagado || 0)))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="font-black text-slate-700 border-b border-slate-200 pb-2 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                                        <Info size={14} className="text-slate-400" /> Información General
                                    </h3>
                                    <div className="grid grid-cols-2 gap-y-5 text-sm">
                                        <div>
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Habitación</span>
                                            <span className="font-black text-slate-800 text-base">#{selectedRegistroDetails.numero_habitacion}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Huésped Titular</span>
                                            <span className="font-black text-slate-800 truncate block text-base">{selectedRegistroDetails.nombre_cliente}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-in</span>
                                            <span className="font-black text-slate-800">{format(new Date(selectedRegistroDetails.fecha_ingreso), 'dd/MM/yyyy')}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-out (Est.)</span>
                                            <span className="font-black text-slate-800">{format(new Date(selectedRegistroDetails.fecha_salida), 'dd/MM/yyyy')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="font-black text-slate-700 border-b border-slate-200 pb-2 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                                        <CreditCard size={14} className="text-slate-400" /> Notas y Observaciones
                                    </h3>
                                    <p className="text-sm text-slate-600 italic leading-relaxed bg-white p-4 rounded-xl border border-slate-100 min-h-[100px]">
                                        {selectedRegistroDetails.notas || 'Sin notas registradas para este ingreso.'}
                                    </p>
                                    
                                    {selectedRegistroDetails.estado === 'finalizado' && (
                                        <div className="mt-4 pt-4 border-t border-red-100">
                                            <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <Info size={12} /> Notas de Salida (Check-out)
                                            </h4>
                                            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 italic font-black text-red-900 text-xs shadow-sm min-h-[50px] flex items-center px-4">
                                                {selectedRegistroDetails.notasSalida || 'Sin observaciones registradas en la salida.'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => setShowDetailsModal(false)}
                                className="bg-slate-800 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 active:scale-95"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Nuevo Modal de Edición */}
            <DetallesRegistroModal 
                registroId={selectedRegistroId}
                isOpen={showDetailsModal && (initialEditMode || !selectedRegistroDetails)}
                initialEditMode={initialEditMode}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedRegistroId(null);
                    setSelectedRegistroDetails(null);
                    setInitialEditMode(false);
                }}
                onSuccess={() => {
                    fetchData();
                }}
            />
        </div>
    );
};

export default Registros;
