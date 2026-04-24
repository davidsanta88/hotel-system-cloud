import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';
import api, { API_BASE_URL } from '../services/api';
import Swal from 'sweetalert2';
import { formatCurrency, getImageUrl } from '../utils/format';
import { Package, ShoppingCart, Check, History, Eye, X, Receipt, Pencil, Trash2, Plus, Minus, Search } from 'lucide-react';
import Select from 'react-select';

const ProductImage = ({ src, alt, className = "w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" }) => {
    const [error, setError] = React.useState(false);
    if (!src || error) {
        return <ShoppingCart size={40} className="text-gray-300" />;
    }
    return (
        <img 
            src={getImageUrl(src, API_BASE_URL)} 
            alt={alt} 
            className={className}
            onError={() => setError(true)}
        />
    );
};

const Store = () => {
    const [productos, setProductos] = useState([]);
    const [mediosPago, setMediosPago] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [categoriaActual, setCategoriaActual] = useState('todos');
    const [medioPagoId, setMedioPagoId] = useState('');
    const [tipoVenta, setTipoVenta] = useState('directa'); // directa, habitacion
    const [registrosActivos, setRegistrosActivos] = useState([]);
    const [registroId, setRegistroId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Historial States
    const [showHistorial, setShowHistorial] = useState(false);
    const [ventasHistorial, setVentasHistorial] = useState([]);
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [ventaDetalles, setVentaDetalles] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [dates, setDates] = useState({ 
        inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'), 
        fin: format(new Date(), 'yyyy-MM-dd') 
    });
    const [periodoActivo, setPeriodoActivo] = useState(3);

    const PERIODOS = [
        { label: 'Hoy', getDates: () => ({ inicio: format(new Date(), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
        { label: '7 días', getDates: () => ({ inicio: format(subDays(new Date(), 6), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
        { label: '30 días', getDates: () => ({ inicio: format(subDays(new Date(), 29), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
        { label: 'Este mes', getDates: () => ({ inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    ];

    // Edición de venta
    const [showEditModal, setShowEditModal] = useState(false);
    const [editVenta, setEditVenta] = useState(null);
    const [editItems, setEditItems] = useState([]);
    const [editMedioPago, setEditMedioPago] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const sum = cart.reduce((acc, item) => acc + item.subtotal, 0);
        setTotal(sum);
    }, [cart]);

    const fetchData = async () => {
        try {
            const [resProd, resMP, resReg] = await Promise.all([
                api.get('/productos'),
                api.get('/medios-pago'),
                api.get('/registros/activos')
            ]);
            const mappedProductos = resProd.data.map(p => ({
                ...p,
                id: p.id || p._id,
                tipo_inventario: p.tipoInventario || p.tipo_inventario || 'venta',
                imagen_url: p.imagenUrl || p.imagen_url
            }));
            setProductos(mappedProductos);
            setMediosPago(resMP.data);
            setRegistrosActivos(resReg.data);
            
            // AUTO-SELECCIONAR EFECTIVO POR DEFECTO
            if (resMP.data.length > 0) {
                const efectivo = resMP.data.find(m => m.nombre.toUpperCase().includes('EFECTIVO')) || resMP.data[0];
                setMedioPagoId(efectivo.nombre);
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar la información', 'error');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (prod) => {
        if (prod.stock <= 0) return Swal.fire('Error', 'Producto sin stock', 'warning');
        
        const existing = cart.find(item => item.id === prod.id);
        if (existing) {
            if (existing.cantidad >= prod.stock) return Swal.fire('Aviso', 'Stock máximo alcanzado', 'info');
            setCart(cart.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio } : item));
        } else {
            setCart([...cart, { ...prod, cantidad: 1, subtotal: prod.precio }]);
        }
    };

    const removeFromCart = (prodId) => {
        const existing = cart.find(item => item.id === prodId);
        if (!existing) return;

        if (existing.cantidad > 1) {
            setCart(cart.map(item => item.id === prodId ? { ...item, cantidad: item.cantidad - 1, subtotal: (item.cantidad - 1) * item.precio } : item));
        } else {
            setCart(cart.filter(item => item.id !== prodId));
        }
    };

    const getItemQuantity = (prodId) => {
        const item = cart.find(i => i.id === prodId);
        return item ? item.cantidad : 0;
    };

    const processSale = async () => {
        if (cart.length === 0) return;
        if (tipoVenta === 'directa' && !medioPagoId) return Swal.fire('Aviso', 'Seleccione un medio de pago', 'info');
        if (tipoVenta === 'habitacion' && !registroId) return Swal.fire('Aviso', 'Seleccione una habitación ocupada', 'info');

        try {
            await api.post('/ventas', { 
                productos: cart, 
                total, 
                medio_pago_id: tipoVenta === 'directa' ? medioPagoId : null,
                registro_id: tipoVenta === 'habitacion' ? registroId : null
            });
            Swal.fire('Éxito', tipoVenta === 'directa' ? 'Venta registrada con éxito' : 'Consumo cargado a la habitación', 'success');
            setCart([]);
            setRegistroId('');
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo procesar la transacción', 'error');
        }
    };

    const fetchHistorial = useCallback(async () => {
        setLoadingHistorial(true);
        try {
            const response = await api.get(`/ventas?inicio=${dates.inicio}&fin=${dates.fin}`);
            setVentasHistorial(response.data);
            setShowHistorial(true);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el historial de ventas', 'error');
        } finally {
            setLoadingHistorial(false);
        }
    }, [dates]);

    useEffect(() => {
        if (showHistorial) {
            fetchHistorial();
        }
    }, [showHistorial, fetchHistorial]);

    const verDetalleVenta = async (venta) => {
        try {
            const response = await api.get(`/ventas/${venta.id}`);
            // El API ahora devuelve el objeto Venta completo, no solo el array de items
            const data = response.data?.data || response.data;
            const items = data.items || data.productos || [];
            
            setVentaDetalles(items);
            setSelectedVenta(venta);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el detalle de la venta', 'error');
        }
    };

    const handleAddAbono = async (e) => {
        e.preventDefault();
        if (!abonoForm.monto || !abonoForm.medio) return;
    };

    const abrirEdicion = async (venta) => {
        try {
            const response = await api.get(`/ventas/${venta.id}`);
            const data = response.data?.data || response.data;
            const rawItems = data.items || data.productos || [];
            
            const items = rawItems.map(d => ({
                id: d.producto_id || (d.producto && d.producto._id ? d.producto._id : d.producto),
                nombre: d.producto_nombre || d.productoNombre || 'Producto Desconocido',
                precio: parseFloat(d.precio || d.precioUnitario || 0),
                cantidad: d.cantidad || 1,
                subtotal: parseFloat(d.subtotal || 0)
            }));
            setEditVenta(venta);
            setEditItems(items);
            setEditMedioPago(venta.medioPago || venta.medio_pago_id || '');
            setShowEditModal(true);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar la venta para editar', 'error');
        }
    };

    const cambiarCantidadEdit = (idx, delta) => {
        setEditItems(prev => prev.map((item, i) => {
            if (i !== idx) return item;
            const nuevaCant = Math.max(1, item.cantidad + delta);
            return { ...item, cantidad: nuevaCant, subtotal: parseFloat((nuevaCant * item.precio).toFixed(2)) };
        }));
    };

    const quitarItemEdit = (idx) => {
        setEditItems(prev => prev.filter((_, i) => i !== idx));
    };

    const totalEdit = editItems.reduce((acc, i) => acc + i.subtotal, 0);

    const guardarEdicion = async () => {
        if (editItems.length === 0) return Swal.fire('Aviso', 'La venta debe tener al menos un producto', 'warning');
        setSavingEdit(true);
        try {
            // Bypass logic: The DigitalOcean backend blindly calls `findByIdAndUpdate(req.body)`.
            // We must inject the EXACT MongoDB field names into the request body to force the update
            // while preserving the new names for when the server deploys properly later.
            const itemsMappedForDO = editItems.map(i => ({
                producto: i.id,
                productoNombre: i.nombre,
                precioUnitario: i.precio,
                cantidad: i.cantidad,
                subtotal: i.subtotal
            }));

            await api.put(`/ventas/${editVenta.id}`, {
                productos: editItems, // New schema
                items: itemsMappedForDO, // Old DO schema
                total: totalEdit,
                medio_pago_id: editMedioPago || null, // New schema
                medioPago: editMedioPago || null // Old DO Schema
            });
            Swal.fire('Éxito', 'Venta actualizada correctamente', 'success');
            setShowEditModal(false);
            setEditVenta(null);
            // Refrescar historial
            fetchHistorial();
            // Si el recibo de esta venta estaba abierto, actualizarlo
            if (selectedVenta?.id === editVenta.id) setSelectedVenta(null);
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar la venta', 'error');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDeleteVenta = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar venta?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/ventas/${id}`);
                Swal.fire('Eliminada!', 'La venta ha sido eliminada.', 'success');
                // Refrescar historial
                fetchHistorial();
                if (selectedVenta?.id === id) setSelectedVenta(null);
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar la venta', 'error');
            }
        }
    };

    const productosFiltrados = productos.filter(p => 
        p.tipo_inventario === 'venta' && 
        (p.activo === true || p.activo === 1) &&
        (categoriaActual === 'todos' || p.categoria === categoriaActual) &&
        (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const categorias = ['todos', ...new Set(productos.filter(p => p.tipo_inventario === 'venta').map(p => p.categoria))];

    // Opciones para react-select
    const registroOptions = registrosActivos.map(reg => ({
        value: reg.id,
        label: `Hab. ${reg.numero_habitacion} - ${reg.nombre_cliente}`
    }));
    const selectedRegistroOption = registroOptions.find(opt => opt.value === registroId) || null;

    const medioPagoOptions = mediosPago.map(mp => ({
        value: mp.nombre,
        label: mp.nombre
    }));
    const selectedMedioPagoOption = medioPagoOptions.find(opt => opt.value === medioPagoId) || null;

    const selectStyles = {
        control: (base, state) => ({
            ...base,
            border: state.isFocused ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '2px',
            fontSize: '14px',
            boxShadow: 'none',
            '&:hover': { border: '2px solid #3b82f6' }
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

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                        <div className="flex justify-between items-center w-full">
                            <h1 className="text-2xl font-bold text-gray-900">Tienda / POS</h1>
                            <button 
                                onClick={fetchHistorial}
                                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold transition hover:bg-blue-100"
                            >
                                <History size={16} /> Historial
                            </button>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
                            {categorias.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setCategoriaActual(cat)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all whitespace-nowrap ${categoriaActual === cat ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="w-full md:w-auto flex gap-3 items-center">
                        <input 
                            type="text" 
                            placeholder="Buscar producto..." 
                            className="input-field m-0 md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button 
                            onClick={fetchHistorial}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold shadow-sm transition-all hover:bg-blue-100 hover:-translate-y-0.5"
                        >
                            <History size={18} /> Historial de Ventas
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
                    {productosFiltrados.map(prod => {
                        const cant = getItemQuantity(prod.id);
                        return (
                            <div key={prod.id}
                                 className={`card p-3 transition-all flex flex-col justify-between h-[220px] relative border-2 ${cant > 0 ? 'border-primary-400 shadow-md bg-primary-50/10' : 'border-transparent hover:border-primary-200 hover:shadow-lg'}`}>

                                <div className="h-24 -mx-3 -mt-3 mb-2 bg-gray-50 flex items-center justify-center relative border-b border-gray-100 overflow-hidden rounded-t-xl group">
                                    <ProductImage src={prod.imagen_url} alt={prod.nombre} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 flex flex-col justify-start">
                                    <div className="flex justify-between items-start mb-1 gap-1">
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[60%]">
                                            {prod.categoria}
                                        </span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prod.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            Stock: {prod.stock}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2" title={prod.nombre}>{prod.nombre}</h3>
                                </div>

                                {/* Precio + botón carrito */}
                                <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                                    <span className="text-xl font-black text-gray-900">${formatCurrency(prod.precio)}</span>

                                    {/* Botón + / control cantidad */}
                                    {cant === 0 ? (
                                        <button
                                            onClick={() => addToCart(prod)}
                                            title="Agregar al carrito"
                                            className="w-9 h-9 rounded-full bg-primary-500 hover:bg-primary-600 active:scale-95 text-white shadow-md flex items-center justify-center transition-all flex-shrink-0"
                                        >
                                            <span className="text-2xl font-light leading-none mb-0.5">+</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center bg-primary-500 text-white rounded-full shadow-md overflow-hidden h-9 flex-shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFromCart(prod.id); }}
                                                className="px-2.5 font-bold text-lg hover:bg-primary-600 transition-colors h-full leading-none"
                                            >−</button>
                                            <span className="px-1 font-bold text-sm min-w-[1.2rem] text-center">{cant}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                                                className="px-2.5 font-bold text-lg hover:bg-primary-600 transition-colors h-full leading-none"
                                            >+</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="w-full lg:w-96 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between text-primary-700 font-bold">
                    <div className="flex items-center space-x-2">
                        <ShoppingCart size={24} />
                        <span className="text-lg">Resumen de Venta</span>
                    </div>
                    <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs">{cart.length} items</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 group">
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-800 text-sm">{item.nombre}</h4>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    ${formatCurrency(item.precio)} x {item.cantidad}
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className="font-bold text-gray-900 text-sm">${formatCurrency(item.subtotal)}</span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newCart = cart.filter((_, i) => i !== idx);
                                        setCart(newCart);
                                    }}
                                    className="text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Quitar
                                </button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <ShoppingCart size={48} className="mb-2 opacity-20" />
                            <p className="text-sm">El carrito está vacío</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl space-y-4">
                    <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                        <button 
                            onClick={() => setTipoVenta('directa')}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${tipoVenta === 'directa' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400'}`}
                        >
                            Venta Directa
                        </button>
                        <button 
                            onClick={() => setTipoVenta('habitacion')}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${tipoVenta === 'habitacion' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400'}`}
                        >
                            Cargar Habitación
                        </button>
                    </div>

                    {tipoVenta === 'directa' ? (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Medio de Pago</label>
                            <Select 
                                placeholder="Seleccione medio..."
                                options={medioPagoOptions}
                                value={selectedMedioPagoOption}
                                onChange={(opt) => setMedioPagoId(opt ? opt.value : '')}
                                styles={selectStyles}
                                noOptionsMessage={() => "No se encontró"}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Habitación / Huésped</label>
                            <Select 
                                placeholder="Buscar habitación/cliente..."
                                options={registroOptions}
                                value={selectedRegistroOption}
                                onChange={(opt) => setRegistroId(opt ? opt.value : '')}
                                styles={selectStyles}
                                noOptionsMessage={() => "No hay registros activos"}
                                isClearable
                            />
                        </div>
                    )}

                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm font-medium">Total a Pagar</span>
                            <span className="text-2xl font-black text-gray-900">${formatCurrency(total)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={processSale}
                            disabled={cart.length === 0 || !medioPagoId}
                            className={`w-full py-3 rounded-lg font-bold shadow-sm transition-all flex justify-center items-center space-x-2
                                ${cart.length > 0 && medioPagoId ? 'bg-primary-600 hover:bg-primary-700 text-white transform hover:scale-[1.02] active:scale-95' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            <Check size={20} />
                            <span>FINALIZAR VENTA</span>
                        </button>
                        {cart.length > 0 && (
                            <button 
                                onClick={() => setCart([])}
                                className="w-full py-2 text-xs text-gray-500 hover:text-red-500 font-bold transition-colors uppercase tracking-widest"
                            >
                                Cancelar Todo
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals para Historial de Ventas */}
            {showHistorial && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    {/* Modal Principal: Lista de Ventas */}
                    <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in border border-gray-100 flex flex-col ${selectedVenta ? 'hidden md:flex' : 'flex'} max-h-[90vh]`}>
                        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl shadow-sm">
                                        <History size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-black text-gray-800">Historial de Ventas</h2>
                                        <p className="text-xs md:text-sm text-gray-500 mt-0.5 font-medium">Registro de todas las transacciones realizadas en la tienda</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowHistorial(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Filtros de Fecha */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                                    {PERIODOS.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setPeriodoActivo(i); setDates(p.getDates()); }}
                                            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider ${periodoActivo === i ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 flex-1 md:flex-none">
                                        <input type="date" className="bg-transparent text-xs border-none focus:ring-0 text-gray-700"
                                            value={dates.inicio} onChange={e => { setDates({ ...dates, inicio: e.target.value }); setPeriodoActivo(-1); }} />
                                        <span className="text-gray-300">→</span>
                                        <input type="date" className="bg-transparent text-xs border-none focus:ring-0 text-gray-700"
                                            value={dates.fin} onChange={e => { setDates({ ...dates, fin: e.target.value }); setPeriodoActivo(-1); }} />
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex flex-col items-end min-w-[140px]">
                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Total Periodo</span>
                                        <span className="text-lg font-black text-emerald-700 leading-none">${formatCurrency(ventasHistorial.reduce((acc, v) => acc + v.total, 0))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-auto flex-1 p-4 md:p-6">
                            {loadingHistorial ? (
                                <div className="text-center py-12 text-gray-400 font-medium">Cargando transacciones...</div>
                            ) : ventasHistorial.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                                    <Receipt size={48} className="text-gray-200" />
                                    <p className="text-gray-500 font-medium">No hay ventas registradas en el sistema aún</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-100 text-[11px] uppercase tracking-wider">
                                                <th className="p-4 font-bold">Resumen Transacción</th>
                                                <th className="p-4 font-bold hidden sm:table-cell">Cajero / Vendedor</th>
                                                <th className="p-4 font-bold text-right">Monto Total</th>
                                                <th className="p-4 font-bold text-center">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {ventasHistorial.map(venta => (
                                                <tr key={venta.id} className={`hover:bg-blue-50/30 transition-colors ${selectedVenta?.id === venta.id ? 'bg-blue-50/50' : ''}`}>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900">Venta #{venta.id?.slice(-6).toUpperCase()}</span>
                                                            <span className="text-xs text-gray-500 mt-0.5 font-medium">{new Date(venta.fecha).toLocaleString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 hidden sm:table-cell">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                                                            {venta.empleado?.nombre || venta.empleado || 'Sistema'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className="font-black text-gray-900 text-base">${formatCurrency(venta.total)}</span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button 
                                                                onClick={() => verDetalleVenta(venta)}
                                                                className="inline-flex items-center justify-center p-2 text-primary-600 hover:text-white hover:bg-primary-500 rounded-lg transition-all"
                                                                title="Ver Recibo"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => abrirEdicion(venta)}
                                                                className="inline-flex items-center justify-center p-2 text-amber-600 hover:text-white hover:bg-amber-500 rounded-lg transition-all"
                                                                title="Editar Venta"
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteVenta(venta.id)}
                                                                className="inline-flex items-center justify-center p-2 text-red-600 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                                                                title="Eliminar Venta"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal Secundario: Detalle de la Venta (Recibo) */}
                    {selectedVenta && (
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-gray-100 flex flex-col max-h-[90vh] absolute md:relative z-[70]">
                            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 text-primary-600 mb-1">
                                        <Receipt size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Recibo de Venta</span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-1">Transacción #{selectedVenta.id?.slice(-6).toUpperCase()}</h3>
                                    <p className="text-xs text-gray-500 font-medium">{new Date(selectedVenta.fecha).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setSelectedVenta(null)} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 border border-gray-100 p-2 rounded-xl transition shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-5 bg-white">
                                <div className="space-y-3 mb-6">
                                    {ventaDetalles.map((detalle, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm border-b border-dashed border-gray-200 pb-3">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800">{detalle.producto_nombre || detalle.productoNombre || 'Producto Desconocido'}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{detalle.cantidad}x ${formatCurrency(detalle.precio || detalle.precioUnitario)} c/u</p>
                                            </div>
                                            <div className="font-black text-gray-900">
                                                ${formatCurrency(detalle.subtotal)}
                                            </div>
                                        </div>
                                    ))}
                                    {ventaDetalles.length === 0 && (
                                        <div className="text-center py-6 text-gray-400 text-sm">Cargando recibo...</div>
                                    )}
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Atendido por</span>
                                        <span className="text-sm font-bold text-gray-800">{selectedVenta.empleado?.nombre || (typeof selectedVenta.empleado === 'string' ? selectedVenta.empleado : 'Sistema')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 bg-gray-900 text-white flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Total Cobrado</span>
                                <span className="text-2xl font-black">${formatCurrency(selectedVenta.total)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Edición de Venta */}
            {showEditModal && editVenta && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-fade-in border border-gray-100">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 bg-amber-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 text-amber-600 p-2 rounded-xl">
                                    <Pencil size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Editar Venta #{editVenta.id?.slice(-6).toUpperCase()}</h3>
                                    <p className="text-xs text-gray-500">{new Date(editVenta.fecha).toLocaleString()}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 border border-gray-100 p-2 rounded-xl transition shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Lista de productos */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-2">
                            {editItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 text-sm truncate">{item.nombre}</p>
                                        <p className="text-xs text-gray-500">${formatCurrency(item.precio)} c/u</p>
                                    </div>
                                    <div className="flex items-center bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                        <button onClick={() => cambiarCantidadEdit(idx, -1)} className="px-2.5 py-1.5 hover:bg-red-100 text-red-600 font-bold transition-colors text-sm">
                                            <Minus size={14} />
                                        </button>
                                        <span className="px-2 font-bold text-sm min-w-[2rem] text-center">{item.cantidad}</span>
                                        <button onClick={() => cambiarCantidadEdit(idx, 1)} className="px-2.5 py-1.5 hover:bg-green-100 text-green-600 font-bold transition-colors text-sm">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <span className="font-black text-gray-900 text-sm w-20 text-right flex-shrink-0">${formatCurrency(item.subtotal)}</span>
                                    <button onClick={() => quitarItemEdit(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition flex-shrink-0" title="Quitar producto">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {editItems.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">No hay productos. La venta debe tener al menos uno.</div>
                            )}
                        </div>

                        {/* Medio de pago (solo si la venta lo tenía) */}
                        <div className="px-5 pb-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Medio de Pago</label>
                            <select required className="input-field text-sm border-2 focus:border-amber-500" value={editMedioPago} onChange={e => setEditMedioPago(e.target.value)}>
                                <option value="">Sin especificar / Seleccione...</option>
                                {mediosPago.map(mp => (
                                    <option key={mp.id} value={mp.nombre}>{mp.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Footer */}
                        <div className="p-5 bg-gray-900 text-white flex items-center justify-between rounded-b-2xl gap-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Nuevo Total</p>
                                <p className="text-2xl font-black">${formatCurrency(totalEdit)}</p>
                            </div>
                            <button
                                onClick={guardarEdicion}
                                disabled={savingEdit || editItems.length === 0}
                                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
                            >
                                {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Store;
