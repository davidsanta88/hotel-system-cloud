import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Trash2, Filter, Search, Paperclip, ImageIcon, Edit2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { formatCurrency, cleanNumericValue } from '../utils/format';
import { usePermissions } from '../hooks/usePermissions';

const Gastos = () => {
    const { user } = useContext(AuthContext);
    const { canEdit, canDelete } = usePermissions('gastos');
    
    const [gastos, setGastos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros
    const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [categoriaFilter, setCategoriaFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [current, setCurrent] = useState({
        concepto: '',
        categoria_id: '',
        monto: '',
        fecha_gasto: new Date().toISOString().split('T')[0],
        notas: '',
        tipo: 'Gasto',
        imagen: null
    });

    useEffect(() => {
        // Cargar categorias activas
        api.get('/categorias-gastos').then(res => {
            setCategorias(res.data.filter(c => c.activo));
        }).catch(() => {});
        
        fetchGastos();
    }, []);

    const fetchGastos = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (fechaInicio) params.append('fechaInicio', fechaInicio);
            if (fechaFin) params.append('fechaFin', fechaFin);
            if (categoriaFilter) params.append('categoria_id', categoriaFilter);

            const res = await api.get(`/gastos?${params.toString()}`);
            setGastos(res.data);
            setLoading(false);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los movimientos financieros', 'error');
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchGastos();
    };

    const handleOpenModal = (item = null) => {
        if (item && item.id) {
            setCurrent({
                id: item.id,
                concepto: item.concepto,
                categoria_id: item.categoria_id,
                monto: item.monto,
                fecha_gasto: item.fecha_gasto ? item.fecha_gasto.split('T')[0] : new Date().toISOString().split('T')[0],
                notas: item.notas || '',
                tipo: item.tipo || 'Gasto',
                imagen: null,
                imagen_url: item.imagen_url
            });
        } else {
            setCurrent({
                concepto: '',
                categoria_id: '',
                monto: '',
                fecha_gasto: new Date().toISOString().split('T')[0],
                notas: '',
                tipo: 'Gasto',
                imagen: null
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('concepto', current.concepto);
            formData.append('categoria_id', current.categoria_id);
            formData.append('monto', current.monto);
            formData.append('fecha_gasto', current.fecha_gasto);
            formData.append('tipo', current.tipo);
            if (current.notas) formData.append('notas', current.notas);
            if (current.imagen) formData.append('imagen', current.imagen);

            if (current.id) {
                await api.put(`/gastos/${current.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/gastos', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            Swal.fire('Éxito', `${current.tipo === 'Gasto' ? 'Gasto' : 'Ingreso'} ${current.id ? 'actualizado' : 'registrado'} correctamente`, 'success');
            setShowModal(false);
            fetchGastos();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar el movimiento', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar registro?',
            text: "No podrás recuperar este registro de dinero.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/gastos/${id}`);
                Swal.fire('Eliminado!', 'El movimiento ha sido borrado.', 'success');
                fetchGastos();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el movimiento', 'error');
            }
        }
    };

    // Filtro por texto local (ya que el rango de fechas es desde el servidor)
    const filteredGastos = gastos.filter(g => 
        g.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (g.notas && g.notas.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalEgresos = filteredGastos.filter(g => g.tipo === 'Gasto').reduce((sum, g) => sum + g.monto, 0);
    const totalIngresos = filteredGastos.filter(g => g.tipo === 'Ingreso').reduce((sum, g) => sum + g.monto, 0);
    const balanceNeto = totalIngresos - totalEgresos;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gastos e Ingresos</h1>
                    <p className="text-gray-500">Registra y monitorea todos los movimientos de dinero de caja</p>
                </div>
                {canEdit && (
                    <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2 shadow-lg hover:-translate-y-1 transition-transform">
                        <Plus size={20} />
                        Registrar Movimiento
                    </button>
                )}
            </div>

            <div className="card">
                <form onSubmit={handleSearch} className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desde</label>
                        <input 
                            type="date" 
                            className="input-field py-2" 
                            value={fechaInicio} 
                            onChange={e => setFechaInicio(e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hasta</label>
                        <input 
                            type="date" 
                            className="input-field py-2" 
                            value={fechaFin} 
                            onChange={e => setFechaFin(e.target.value)} 
                        />
                    </div>
                    <div className="min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                        <select 
                            className="input-field py-2" 
                            value={categoriaFilter} 
                            onChange={e => setCategoriaFilter(e.target.value)}
                        >
                            <option value="">Todas</option>
                            {categorias.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn-secondary flex items-center gap-2 py-2 h-10 shadow-sm border-gray-200">
                        <Filter size={18} /> Filtrar
                    </button>
                    <div className="flex-1 min-w-[200px] flex justify-end">
                        <div className="relative w-full max-w-sm">
                            <input
                                type="text"
                                placeholder="Buscar en resultados..."
                                className="input-field pl-10 py-2 h-10 m-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>
                </form>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Fecha</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Categoría</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider w-1/3">Concepto/Detalle</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Auditoría</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Monto</th>
                                {canDelete && <th className="p-4 font-semibold text-right text-xs uppercase tracking-wider">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400 font-medium">Cargando registros...</td></tr>
                            ) : filteredGastos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-gray-500">
                                        No se encontraron movimientos financieros en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                filteredGastos.map(item => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                            {new Date(item.fecha_gasto).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.tipo === 'Ingreso' ? 'text-emerald-700 bg-emerald-100' : 'text-orange-700 bg-orange-100'}`}>
                                                {item.categoria_nombre || 'Sin Asignar'}
                                            </span>
                                            <div className="text-[9px] font-black mt-1 opacity-50 tracking-tighter">
                                                {item.tipo || 'Gasto'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-gray-900 leading-tight">{item.concepto}</div>
                                                {item.imagen_url && (
                                                    <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.imagen_url}`} target="_blank" rel="noreferrer" title="Ver Factura" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded transition hover:scale-105 shadow-sm">
                                                        <ImageIcon size={14} />
                                                    </a>
                                                )}
                                            </div>
                                            {item.notas && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{item.notas}</div>}
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <div className="text-gray-600 text-[10px] uppercase font-bold tracking-wide">Por:</div>
                                            <div className="text-gray-900 font-medium">{item.UsuarioCreacion || '-'}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className={`text-lg font-black ${item.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {item.tipo === 'Ingreso' ? '+' : '-'}${formatCurrency(item.monto)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {canEdit && (
                                                    <button 
                                                        onClick={() => handleOpenModal(item)}
                                                        className="p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar Registro"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar Registro"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {filteredGastos.length > 0 && (
                            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                <tr className="divide-x divide-gray-100">
                                    <td colSpan="2" className="p-4 text-center">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">Resumen Egresos</div>
                                        <div className="text-lg font-black text-red-600">-${formatCurrency(totalEgresos)}</div>
                                    </td>
                                    <td colSpan="2" className="p-4 text-center">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">Resumen Ingresos</div>
                                        <div className="text-lg font-black text-emerald-600">+${formatCurrency(totalIngresos)}</div>
                                    </td>
                                    <td colSpan="2" className="p-4 text-right bg-blue-50/50">
                                        <div className="text-[10px] font-bold text-blue-400 uppercase">Balance de Caja</div>
                                        <div className={`text-xl font-black ${balanceNeto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {balanceNeto >= 0 ? '+' : '-'}${formatCurrency(Math.abs(balanceNeto))}
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Modal Crear Gasto */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-gray-100">
                        <div className={`p-6 border-b border-gray-100 ${current.tipo === 'Ingreso' ? 'bg-emerald-50' : 'bg-red-50'} transition-colors duration-500`}>
                            <h2 className={`text-2xl font-black ${current.tipo === 'Ingreso' ? 'text-emerald-800' : 'text-red-800'}`}>
                                {current.tipo === 'Ingreso' ? 'Registrar Ingreso de Dinero' : 'Registrar Salida de Dinero'}
                            </h2>
                            <p className={`text-sm ${current.tipo === 'Ingreso' ? 'text-emerald-600/70' : 'text-red-600/70'} mt-1 font-medium`}>
                                {current.tipo === 'Ingreso' ? 'El monto sumará al balance positivo de la caja habitual' : 'El monto será deducido como un gasto o pago operativo'}
                            </p>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Concepto Principal *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        placeholder={current.tipo === 'Ingreso' ? "Ej. Cobro Lavandería..." : "Ej. Factura de Luz..."}
                                        value={current.concepto}
                                        onChange={e => setCurrent({...current, concepto: e.target.value})}
                                    />
                                </div>
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Mov. *</label>
                                    <select
                                        required
                                        className={`input-field font-black ${current.tipo === 'Ingreso' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-red-600 border-red-200 bg-red-50'}`}
                                        value={current.tipo}
                                        onChange={e => setCurrent({...current, tipo: e.target.value, categoria_id: ''})}
                                    >
                                        <option value="Gasto">EGRESO (-)</option>
                                        <option value="Ingreso">INGRESO (+)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                                    <select
                                        className="input-field font-medium text-gray-700"
                                        value={current.categoria_id}
                                        onChange={e => setCurrent({...current, categoria_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Seleccione...</option>
                                        {categorias.filter(c => c.tipo === current.tipo).map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha Movimiento *</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field text-gray-700"
                                        value={current.fecha_gasto}
                                        onChange={e => setCurrent({...current, fecha_gasto: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Monto *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        className={`input-field pl-8 font-black text-xl ${current.tipo === 'Ingreso' ? 'text-emerald-700' : 'text-red-700'}`}
                                        placeholder="0"
                                        value={current.monto === 0 || current.monto === '0' ? '' : current.monto}
                                        onChange={e => {
                                            // Permite solo números y punto decimal
                                            const raw = e.target.value.replace(/[^0-9.]/g, '');
                                            setCurrent({...current, monto: raw});
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Notas Adicionales (Opcional)</label>
                                <textarea
                                    className="input-field h-20 resize-none text-sm"
                                    placeholder="Detalles sobre este movimiento, referencias, número de factura..."
                                    value={current.notas}
                                    onChange={e => setCurrent({...current, notas: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Copia de la Factura (Opcional)</label>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white text-gray-600 hover:bg-gray-50 transition w-full text-sm">
                                        <Paperclip size={18} className="mr-2 text-gray-400" />
                                        {current.imagen ? current.imagen.name : 'Seleccionar Archivo (Imagen)...'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={e => setCurrent({...current, imagen: e.target.files[0]})}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary py-3">
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className={`flex-1 btn-primary text-white shadow-xl py-3 text-lg transition-all ${current.tipo === 'Ingreso' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
                                >
                                    {current.tipo === 'Ingreso' ? 'Confirmar Ingreso' : 'Confirmar Egreso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gastos;
