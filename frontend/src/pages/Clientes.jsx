import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, MessageSquare, FileSpreadsheet, FileText, UserPlus, Phone, Mail, MapPin, Calendar, Filter, Building } from 'lucide-react';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { format, subMonths, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePermissions } from '../hooks/usePermissions';
import Pagination from '../components/common/Pagination';
import { formatCurrency } from '../utils/format';

const Clientes = () => {
    const { user } = useContext(AuthContext);
    const { canEdit, canDelete } = usePermissions('clientes');
    const [clientes, setClientes] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fechaInicio, setFechaInicio] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    const [showModal, setShowModal] = useState(false);
    const [currentCliente, setCurrentCliente] = useState({
        nombre: '',
        documento: '',
        tipo_documento: 'CC',
        telefono: '',
        email: '',
        municipio_origen_id: '',
        empresa_id: '',
        observaciones: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    
    // Filtros por columna
    const [columnFilters, setColumnFilters] = useState({
        documento: '',
        nombre: '',
        telefono: '',
        municipio: ''
    });
    
    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchClientes();
    }, []);

    // Reiniciar a la primera página si cambia la búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchClientes = async () => {
        try {
            const [clientesRes, municipiosRes, empresasRes] = await Promise.all([
                api.get('/clientes'),
                api.get('/municipios'),
                api.get('/empresas')
            ]);
            setClientes(clientesRes.data);
            setMunicipios(municipiosRes.data);
            setEmpresas(empresasRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching clientes:', error);
            setLoading(false);
            Swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
        }
    };

    const handleOpenModal = (cliente = null) => {
        if (cliente) {
            setCurrentCliente({
                ...cliente,
                tipo_documento: cliente.tipo_documento || 'CC',
                municipio_origen_id: cliente.municipio_origen_id || '',
                empresa_id: cliente.empresa_id || ''
            });
            setIsEditing(true);
        } else {
            setCurrentCliente({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '', empresa_id: '', observaciones: '' });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentCliente({ nombre: '', documento: '', tipo_documento: 'CC', telefono: '', email: '', municipio_origen_id: '', empresa_id: '', observaciones: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/clientes/${currentCliente.id}`, currentCliente);
                Swal.fire('Éxito', 'Cliente actualizado correctamente', 'success');
            } else {
                await api.post('/clientes', currentCliente);
                Swal.fire('Éxito', 'Cliente registrado correctamente', 'success');
            }
            handleCloseModal();
            fetchClientes();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar cliente', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/clientes/${id}`);
                Swal.fire('Eliminado!', 'El cliente ha sido eliminado.', 'success');
                fetchClientes();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el cliente', 'error');
            }
        }
    };

    const handleFilterChange = (column, value) => {
        setColumnFilters(prev => ({ ...prev, [column]: value }));
        setCurrentPage(1);
    };

    // Lógica de Filtrado Local con useMemo
    const filteredClientes = useMemo(() => {
        return clientes.filter(c => {
            // 0. Rango de Fechas (sobre fechaCreacion)
            // Usamos fechaCreacion o fallback a la fecha actual si no existe
            const fCreacion = parseISO(c.fechaCreacion || new Date().toISOString());
            const start = startOfDay(parseISO(fechaInicio));
            const end = endOfDay(parseISO(fechaFin));
            const matchesDates = isWithinInterval(fCreacion, { start, end });
            if (!matchesDates) return false;

            // 1. Búsqueda global
            const searchStr = searchTerm.toLowerCase();
            const matchesGlobal = searchTerm === '' || 
                c.nombre?.toLowerCase().includes(searchStr) || 
                c.documento?.toLowerCase().includes(searchStr) ||
                (c.municipio_nombre || (c.municipio_origen_id && municipios.find(m => String(m.id) === String(c.municipio_origen_id))?.nombre) || '').toLowerCase().includes(searchStr);
            if (!matchesGlobal) return false;
            
            // 2. Filtros por columna
            const matchesDocumento = columnFilters.documento === '' || 
                c.documento?.toLowerCase().includes(columnFilters.documento.toLowerCase());
                
            const matchesNombre = columnFilters.nombre === '' || 
                c.nombre?.toLowerCase().includes(columnFilters.nombre.toLowerCase());
                
            const matchesTelefono = columnFilters.telefono === '' || 
                (c.telefono || '').toLowerCase().includes(columnFilters.telefono.toLowerCase());
                
            const matchesMunicipio = columnFilters.municipio === '' || 
                (c.municipio_nombre || c.municipio_origen_nombre || '').toLowerCase().includes(columnFilters.municipio.toLowerCase());

            return matchesDocumento && matchesNombre && matchesTelefono && matchesMunicipio;
        });
    }, [clientes, searchTerm, columnFilters, fechaInicio, fechaFin]);

    const paginatedClientes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredClientes.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredClientes, currentPage, itemsPerPage]);

    // Funciones de Exportación
    const handleExportExcel = () => {
        const dataToExport = filteredClientes.map(c => ({
            'Nombre': c.nombre?.toUpperCase(),
            'Identificación': c.documento,
            'Tipo Doc': c.tipo_documento || 'CC',
            'Teléfono': c.telefono || 'N/A',
            'Email': c.email || 'N/A',
            'Ciudad/Municipio': c.municipio_nombre || (c.municipio_origen_id && municipios.find(m => String(m.id) === String(c.municipio_origen_id))?.nombre) || 'N/A',
            'Observaciones': c.observaciones || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
        XLSX.writeFile(workbook, `Reporte_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["Nombre", "Documento", "Teléfono", "Ciudad", "Email"];
        const tableRows = filteredClientes.map(c => [
            c.nombre?.toUpperCase(),
            c.documento,
            c.telefono || 'N/A',
            c.municipio_nombre || (c.municipio_origen_id && municipios.find(m => String(m.id) === String(c.municipio_origen_id))?.nombre) || 'N/A',
            c.email || 'N/A'
        ]);

        doc.setFontSize(18);
        doc.text("Directorio de Clientes", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Total Clientes: ${filteredClientes.length}`, 14, 30);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 35);

        autoTable(doc, {
            startY: 40,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] },
        });

        doc.save(`Reporte_Clientes_${new Date().getTime()}.pdf`);
    };

    // Opciones para el buscador de municipios
    const municipioOptions = municipios
        .filter(m => m.visualizar)
        .map(m => ({
            value: m.id,
            label: m.nombre
        }));

    const selectedMunicipioOption = municipioOptions.find(opt => String(opt.value) === String(currentCliente.municipio_origen_id)) || null;

    const selectStyles = {
        control: (base, state) => ({
            ...base,
            border: state.isFocused ? '1px solid #3b82f6' : '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '2px',
            fontSize: '14px',
            boxShadow: 'none',
            '&:hover': { border: '1px solid #3b82f6' }
        }),
        option: (base, state) => ({
            ...base,
            fontSize: '13px',
            backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
            color: state.isSelected ? 'white' : '#374151',
            padding: '10px'
        }),
        menu: (base) => ({
            ...base,
            borderRadius: '0.75rem',
            overflow: 'hidden',
            zIndex: 60
        })
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando clientes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Directorio de Clientes</h1>
                    <p className="text-slate-500 font-medium">Administre la base de datos de sus huéspedes</p>
                </div>
                {canEdit && (
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        <UserPlus size={18} /> Nuevo Cliente
                    </button>
                )}
            </div>

            {/* Barra de Filtros y Herramientas */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative group w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o identificación..."
                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all"
                        title="Exportar a Excel"
                    >
                        <FileSpreadsheet size={16} /> Excel
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all"
                        title="Exportar a PDF"
                    >
                        <FileText size={16} /> PDF
                    </button>
                </div>
            </div>

            <div className="card !p-0 overflow-hidden border border-slate-100 shadow-xl rounded-3xl">
                <div className="overflow-x-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="sticky-header">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">T. Doc</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">Documento</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">Nombre Completo</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">Empresa</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">Contacto</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">Origen</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">Acciones</th>
                            </tr>
                            {/* Fila de Filtros */}
                            <tr className="bg-white">
                                <th className="px-6 py-2 border-b border-slate-50"></th>
                                <th className="px-6 py-2 border-b border-slate-50">
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar doc..."
                                        className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                        value={columnFilters.documento}
                                        onChange={(e) => handleFilterChange('documento', e.target.value)}
                                    />
                                </th>
                                <th className="px-6 py-2 border-b border-slate-50">
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar nombre..."
                                        className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                        value={columnFilters.nombre}
                                        onChange={(e) => handleFilterChange('nombre', e.target.value)}
                                    />
                                </th>
                                <th className="px-6 py-2 border-b border-slate-50"></th>
                                <th className="px-6 py-2 border-b border-slate-50">
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar tel..."
                                        className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                        value={columnFilters.telefono}
                                        onChange={(e) => handleFilterChange('telefono', e.target.value)}
                                    />
                                </th>
                                <th className="px-6 py-2 border-b border-slate-50">
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar ciudad..."
                                        className="w-full text-[10px] bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-400 py-1.5 px-3 font-bold text-slate-600 placeholder:text-slate-300"
                                        value={columnFilters.municipio}
                                        onChange={(e) => handleFilterChange('municipio', e.target.value)}
                                    />
                                </th>
                                <th className="px-6 py-2 border-b border-slate-50"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedClientes.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-4 text-center text-gray-500">
                                        No se encontraron clientes.
                                    </td>
                                </tr>
                            ) : (
                                paginatedClientes.map(cliente => (
                                    <tr key={cliente.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-600 font-mono text-sm">{cliente.tipo_documento}</td>
                                        <td className="p-4 font-medium text-gray-800">{cliente.documento}</td>
                                        <td className="p-4">
                                            <div className="text-gray-800 font-bold">{cliente.nombre}</div>
                                        </td>
                                        <td className="p-4">
                                            {cliente.empresa_nombre && cliente.empresa_nombre !== '-' ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                                        <Building size={12} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tight leading-tight">
                                                        {cliente.empresa_nombre}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-300 uppercase italic">Particular</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span>{cliente.telefono || '-'}</span>
                                                {cliente.telefono && (
                                                    <a 
                                                        href={`https://wa.me/${cliente.telefono.replace(/\s+/g, '')}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-800 transition-colors"
                                                        title="Escribir al WhatsApp"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </a>
                                                )}
                                            </div>
                                             <div className="text-gray-400 text-[10px]">{cliente.email || ''}</div>
                                             {cliente.observaciones && (
                                                <div className="mt-1 p-1 bg-amber-50 text-[10px] text-amber-700 rounded border border-amber-100 italic">
                                                    Obs: {cliente.observaciones}
                                                </div>
                                             )}
                                         </td>
                                        <td className="p-4 text-gray-600 text-sm whitespace-nowrap">
                                            {cliente.municipio_nombre || (cliente.municipio_origen_id && municipios.find(m => String(m.id) === String(cliente.municipio_origen_id))?.nombre) || '-'}
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <div className="text-gray-900 font-medium">{cliente.UsuarioCreacion || cliente.usuarioCreacion || '-'}</div>
                                            <div className="text-gray-400 text-[10px]">{(cliente.FechaCreacion || cliente.fechaCreacion) ? new Date(cliente.FechaCreacion || cliente.fechaCreacion).toLocaleDateString() : ''}</div>
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <div className="text-gray-900 font-medium">{cliente.UsuarioModificacion || cliente.usuarioModificacion || '-'}</div>
                                            <div className="text-gray-400 text-[10px]">{(cliente.FechaModificacion || cliente.fechaModificacion) ? new Date(cliente.FechaModificacion || cliente.fechaModificacion).toLocaleDateString() : ''}</div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit && (
                                                        <button 
                                                            onClick={() => handleOpenModal(cliente)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDelete(cliente.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    currentPage={currentPage}
                    totalItems={filteredClientes.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(val) => {
                        setItemsPerPage(val);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* Modal para Crear/Editar */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field uppercase"
                                    value={currentCliente.nombre}
                                    onChange={e => setCurrentCliente({...currentCliente, nombre: e.target.value.toUpperCase()})}
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Doc. *</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={currentCliente.tipo_documento}
                                        onChange={e => setCurrentCliente({...currentCliente, tipo_documento: e.target.value})}
                                    >
                                        <option value="CC">CÉDULA</option>
                                        <option value="CE">EXTRANJERÍA</option>
                                        <option value="PASAPORTE">PASAPORTE</option>
                                        <option value="TI">T. IDENTIDAD</option>
                                        <option value="NIT">NIT</option>
                                    </select>
                                </div>
                                <div className="w-full sm:w-2/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Documento *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={currentCliente.documento}
                                        onChange={e => setCurrentCliente({...currentCliente, documento: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={currentCliente.telefono}
                                        onChange={e => setCurrentCliente({...currentCliente, telefono: e.target.value})}
                                    />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={currentCliente.email}
                                        onChange={e => setCurrentCliente({...currentCliente, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Origen</label>
                                <Select
                                    placeholder="Buscar ciudad/municipio..."
                                    options={municipioOptions}
                                    value={selectedMunicipioOption}
                                    onChange={(opt) => setCurrentCliente({...currentCliente, municipio_origen_id: opt ? opt.value : ''})}
                                    styles={selectStyles}
                                    noOptionsMessage={() => "No se encontró el municipio"}
                                    isClearable
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa / Convenio</label>
                                <select
                                    className="input-field uppercase font-bold text-indigo-600 bg-indigo-50/50"
                                    value={currentCliente.empresa_id || ''}
                                    onChange={e => setCurrentCliente({...currentCliente, empresa_id: e.target.value})}
                                >
                                    <option value="">-- NINGUNA / PARTICULAR --</option>
                                    {empresas.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.razon_social} (NIT: {emp.nit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Observaciones</label>
                                <textarea
                                    className="input-field min-h-[80px]"
                                    placeholder="Notas especiales del cliente..."
                                    value={currentCliente.observaciones || ''}
                                    onChange={e => setCurrentCliente({...currentCliente, observaciones: e.target.value})}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button type="submit" className="flex-1 btn-primary">
                                    Guardar
                                </button>
                                <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clientes;
