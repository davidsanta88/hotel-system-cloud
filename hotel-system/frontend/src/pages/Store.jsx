import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import Swal from 'sweetalert2';
import { ShoppingCart, Check } from 'lucide-react';
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
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-gray-900">Tienda / POS</h1>
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
                    <div className="w-full md:w-64">
                        <input 
                            type="text" 
                            placeholder="Buscar producto..." 
                            className="input-field m-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
                    {productosFiltrados.map(prod => {
                        const cant = getItemQuantity(prod.id);
                        return (
                            <div key={prod.id}
                                 className={`card p-4 transition-all flex flex-col justify-between min-h-[160px] relative border-2 ${cant > 0 ? 'border-primary-400 shadow-md' : 'border-transparent hover:border-primary-100 hover:shadow-xl'}`}>

                                {/* Imagen */}
                                <div className="h-40 -mx-4 -mt-4 mb-3 bg-gray-100 flex items-center justify-center relative border-b border-gray-100">
                                    {prod.imagen_url ? (
                                        <img
                                            src={`${API_BASE_URL}${prod.imagen_url}`}
                                            alt={prod.nombre}
                                            className="w-full h-full object-contain p-2 rounded-t-xl"
                                        />
                                    ) : (
                                        <ShoppingCart size={40} className="text-gray-300" />
                                    )}
                                </div>

                                {/* Info */}
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-primary-600 uppercase bg-primary-50 px-2 py-0.5 rounded">
                                            {prod.categoria}
                                        </span>
                                        <span className={`text-[10px] font-bold ${prod.stock > 5 ? 'text-green-600' : 'text-red-500'}`}>
                                            Stock: {prod.stock}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 line-clamp-1 text-base leading-tight">{prod.nombre}</h3>
                                </div>

                                {/* Precio + botón carrito */}
                                <div className="mt-3 flex items-center justify-between">
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
        </div>
    );
};

export default Store;
