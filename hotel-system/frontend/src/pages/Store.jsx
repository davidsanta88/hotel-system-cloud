import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import Swal from 'sweetalert2';
import { ShoppingCart, Check, History, Eye, X, Receipt } from 'lucide-react';
import { formatCurrency } from '../utils/format';

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
            setProductos(resProd.data);
            setMediosPago(resMP.data);
            setRegistrosActivos(resReg.data);
            if (resMP.data.length > 0) setMedioPagoId(resMP.data[0].id);
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

    const fetchHistorial = async () => {
        setLoadingHistorial(true);
        try {
            const response = await api.get('/ventas');
            setVentasHistorial(response.data);
            setShowHistorial(true);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el historial de ventas', 'error');
        } finally {
            setLoadingHistorial(false);
        }
    };

    const verDetalleVenta = async (venta) => {
        try {
            const response = await api.get(`/ventas/${venta.id}`);
            setVentaDetalles(response.data);
            setSelectedVenta(venta);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el detalle de la venta', 'error');
        }
    };

    const productosFiltrados = productos.filter(p => 
        p.tipo_inventario === 'venta' && 
        (p.activo === true || p.activo === 1) &&
        (categoriaActual === 'todos' || p.categoria === categoriaActual) &&
        (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const categorias = ['todos', ...new Set(productos.filter(p => p.tipo_inventario === 'venta').map(p => p.categoria))];

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

                                {/* Imagen */}
                                <div className="h-24 -mx-3 -mt-3 mb-2 bg-gray-50 flex items-center justify-center relative border-b border-gray-100 overflow-hidden rounded-t-xl group">
                                    {prod.imagen_url ? (
                                        <img
                                            src={`${API_BASE_URL}${prod.imagen_url}`}
                                            alt={prod.nombre}
                                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <ShoppingCart size={40} className="text-gray-300" />
                                    )}
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
                            <select 
                                className="input-field text-sm"
                                value={medioPagoId}
                                onChange={e => setMedioPagoId(e.target.value)}
                            >
                                <option value="">Seleccione...</option>
                                {mediosPago.map(mp => (
                                    <option key={mp.id} value={mp.id}>{mp.nombre}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Habitación / Huésped</label>
                            <select 
                                className="input-field text-sm"
                                value={registroId}
                                onChange={e => setRegistroId(e.target.value)}
                            >
                                <option value="">Seleccione habitación ocupada...</option>
                                {registrosActivos.map(reg => (
                                    <option key={reg.id} value={reg.id}>
                                        Hab. {reg.numero_habitacion} - {reg.nombre_cliente}
                                    </option>
                                ))}
                            </select>
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
                        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
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
                                                            <span className="font-bold text-gray-900">Venta #{venta.id}</span>
                                                            <span className="text-xs text-gray-500 mt-0.5 font-medium">{new Date(venta.fecha).toLocaleString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 hidden sm:table-cell">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                                                            {venta.empleado}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className="font-black text-gray-900 text-base">${formatCurrency(venta.total)}</span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => verDetalleVenta(venta)}
                                                            className="inline-flex items-center justify-center p-2 text-primary-600 hover:text-white hover:bg-primary-500 rounded-lg transition-all"
                                                            title="Ver Recibo"
                                                        >
                                                            <Eye size={20} />
                                                        </button>
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
                                    <h3 className="text-xl font-black text-gray-900 mb-1">Transacción #{selectedVenta.id}</h3>
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
                                                <p className="font-bold text-gray-800">{detalle.producto_nombre}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{detalle.cantidad}x ${formatCurrency(detalle.precio)} c/u</p>
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
                                        <span className="text-sm font-bold text-gray-800">{selectedVenta.empleado}</span>
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
        </div>
    );
};

export default Store;
