import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api, { API_BASE_URL } from '../services/api';
import Swal from 'sweetalert2';
import { Package, History, AlertTriangle, Plus, Trash2, Edit, PackagePlus } from 'lucide-react';
import { formatCurrency, cleanNumericValue } from '../utils/format';
import { usePermissions } from '../hooks/usePermissions';

const ToggleSwitch = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

const Inventory = () => {
    const { user } = useContext(AuthContext);
    const { canEdit, canDelete } = usePermissions('inventario');
    const [productos, setProductos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [categoriasLista, setCategoriasLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('products'); // products, movements, alerts
    const [showModal, setShowModal] = useState(false);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        categoria: '',
        precio_compra: '',
        precio: '',
        margen: '',
        stock: '',
        stock_minimo: '',
        descripcion: '',
        tipo_inventario: 'venta'
    });

    const [movementFormData, setMovementFormData] = useState({
        producto_id: '',
        tipo: 'entrada',
        cantidad: '',
        motivo: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const compra = parseFloat(formData.precio_compra) || 0;
        const venta = parseFloat(formData.precio) || 0;
        const calculado = venta - compra;
        if (formData.margen !== calculado.toString()) {
            setFormData(prev => ({ ...prev, margen: calculado.toString() }));
        }
    }, [formData.precio, formData.precio_compra]);

    useEffect(() => {
        fetchData();
    }, [view]);


    const fetchData = async () => {
        setLoading(true);
        try {
            if (view === 'products' || view === 'alerts') {
                const [prodRes, catRes] = await Promise.all([
                    api.get('/productos'),
                    api.get('/categorias')
                ]);
                
                // Mapear campos de Mongoose (camelCase) a lo que espera la UI (snake_case)
                const mapped = prodRes.data.map(p => ({
                    ...p,
                    id: p.id || p._id,
                    tipo_inventario: p.tipoInventario || p.tipo_inventario || 'venta',
                    imagen_url: p.imagenUrl || p.imagen_url,
                    stock_minimo: p.stockMinimo || p.stock_minimo || 0,
                    precio_compra: p.precio_compra || 0,
                    margen: (p.precio || 0) - (p.precio_compra || 0)
                }));

                const filtered = view === 'alerts' 
                    ? mapped.filter(p => p.stock <= p.stock_minimo)
                    : mapped;

                setProductos(filtered.filter(p => p.tipo_inventario === 'venta'));
                setCategoriasLista(catRes.data.filter(c => c.activo === 1 || c.activo === true));
            } else if (view === 'movements') {
                const { data } = await api.get('/inventario/movimientos');
                setMovimientos(data);
            }
        } catch (error) {
            console.error('Fetch Data Error:', error);
            Swal.fire('Error', 'No se pudo cargar la información', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActivo = async (prod) => {
        try {
            const { data } = await api.patch(`/productos/${prod.id}/activo`);
            setProductos(prev =>
                prev.map(p => p.id === prod.id ? { ...p, activo: data.activo } : p)
            );
        } catch (error) {
            Swal.fire('Error', 'No se pudo cambiar el estado del producto', 'error');
        }
    };

    const exportToCSV = () => {
        const headers = ["Producto", "Categoría", "Precio Compra", "Precio Venta", "Margen", "Stock", "Estado"];
        const rows = filteredProducts.map(p => [
            p.nombre,
            p.categoria,
            p.precio_compra,
            p.precio,
            p.margen,
            p.stock,
            p.activo ? "Activo" : "Inactivo"
        ]);

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for UTF-8
        csvContent += headers.join(",") + "\n";
        rows.forEach(row => {
            csvContent += row.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `productos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Preparar datos en formato JSON (más robusto para el proxy)
        const productData = {
            ...formData,
            precio_compra: parseFloat(formData.precio_compra) || 0,
            precio: parseFloat(formData.precio) || 0,
            margen: parseFloat(formData.margen) || 0,
            stock: parseInt(formData.stock) || 0,
            stock_minimo: parseInt(formData.stock_minimo) || 0
        };

        console.log('Submitting Product Data (JSON):', productData);

        try {
            let response;
            if (editingProduct) {
                const targetId = editingProduct.id || editingProduct._id;
                response = await api.put(`/productos/${targetId}`, productData);
            } else {
                response = await api.post('/productos', productData);
            }

            const savedProduct = response.data.producto;
            const productId = savedProduct?.id || savedProduct?._id || (editingProduct?.id || editingProduct?._id);

            // Si hay un archivo seleccionado, subirlo por separado
            if (selectedFile && productId) {
                console.log('Uploading image separately for product:', productId);
                const fileData = new FormData();
                fileData.append('imagen', selectedFile);
                
                try {
                    await api.put(`/productos/${productId}/imagen`, fileData);
                } catch (imgError) {
                    console.error('Image Upload Error:', imgError);
                    const target = imgError.response?.headers?.['x-proxy-target'] || 'N/A';
                    // No bloqueamos el éxito del producto si falla la imagen, pero avisamos
                    Swal.fire({
                        title: 'Atención',
                        text: `El producto se guardó, pero hubo un error al subir la imagen. [Target: ${target}] Error: ` + (imgError.response?.data?.message || imgError.message),
                        icon: 'warning'
                    });
                }

            }

            if (!selectedFile || (selectedFile && !editingProduct)) {
                 Swal.fire('Éxito', editingProduct ? 'Producto actualizado' : 'Producto creado', 'success');
            }
            
            setShowModal(false);
            setEditingProduct(null);
            setSelectedFile(null);
            fetchData();
        } catch (error) {
            console.error('Save Product Error:', error);
            const target = error.response?.headers?.['x-proxy-target'];
            const detailedMsg = (target ? `[Target: ${target}] ` : '') + (error.response?.data?.message || error.message || 'No se pudo guardar el producto');
            Swal.fire('Error', detailedMsg, 'error');
        }

    };


    const handleMovementSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventario/movimientos', movementFormData);
            Swal.fire('Éxito', 'Movimiento registrado', 'success');
            setShowMovementModal(false);
            setMovementFormData({ producto_id: '', tipo: 'entrada', cantidad: '', motivo: '' });
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo registrar el movimiento', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/productos/${id}`);
                Swal.fire('Eliminado!', 'El producto ha sido eliminado.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar', 'error');
            }
        }
    };

    const openEdit = (prod) => {
        setEditingProduct(prod);
        setFormData({
            nombre: prod.nombre,
            categoria: prod.categoria,
            precio_compra: prod.precio_compra || '',
            precio: prod.precio,
            margen: prod.margen || '',
            stock: prod.stock,
            stock_minimo: prod.stock_minimo || 0,
            descripcion: prod.descripcion || '',
            tipo_inventario: prod.tipo_inventario || 'venta'
        });

        setShowModal(true);
    };

    const filteredProducts = productos.filter(p => {
        const searchStr = `${p.nombre} ${p.categoria}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registro de Productos</h1>
                    <p className="text-gray-500">Gestione los productos, stock y alertas de la tienda</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                    {view === 'products' && (
                        <div className="relative w-full sm:w-64">
                            <input 
                                type="text" 
                                placeholder="Buscar producto..." 
                                className="input-field pl-4 pr-10 py-2 w-full text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit shrink-0">
                        <button onClick={() => setView('products')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'products' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>Productos</button>
                        <button onClick={() => setView('movements')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'movements' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>Movimientos</button>
                        <button onClick={() => setView('alerts')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'alerts' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>Alertas Stock</button>
                    </div>
                </div>
                <div className="flex gap-2">
                    {view === 'products' && (
                        <button onClick={exportToCSV} className="btn-secondary flex items-center space-x-2">
                            <span>CSV / Excel</span>
                        </button>
                    )}
                    {canEdit && view === 'products' && (
                        <button onClick={() => { 
                            setEditingProduct(null); 
                            setFormData({
                                nombre:'', 
                                categoria:'', 
                                precio_compra: '',
                                precio:'', 
                                margen: '',
                                stock:'', 
                                stock_minimo:'', 
                                descripcion:'',
                                tipo_inventario: 'venta'
                            }); 
                            setSelectedFile(null);
                            setShowModal(true); 
                        }} className="btn-primary flex items-center space-x-2">
                            <Plus size={20} />
                            <span>Nuevo</span>
                        </button>
                    )}
                </div>
                {canEdit && view === 'movements' && (
                    <button onClick={() => setShowMovementModal(true)} className="btn-primary flex items-center space-x-2">
                        <PackagePlus size={20} />
                        <span>Nuevo Movimiento</span>
                    </button>
                )}
            </div>

            {view === 'products' || view === 'alerts' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Img</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Compra</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margen</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    {canEdit && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>}
                                    {(canEdit || canDelete) && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.map((prod) => (
                                    <tr key={prod.id} className={`transition-colors ${prod.activo === false || prod.activo === 0 ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-12 w-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center relative group">
                                                {prod.imagen_url ? (
                                                    <img 
                                                        src={`${API_BASE_URL}${prod.imagen_url}`} 
                                                        alt={prod.nombre} 
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                ) : (
                                                    <Package className="text-gray-300" size={20} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 text-sm">{prod.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-blue-50 text-blue-600 uppercase border border-blue-100">{prod.categoria}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">${formatCurrency(prod.precio_compra)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">${formatCurrency(prod.precio)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-emerald-600">
                                            ${formatCurrency(prod.margen)}
                                            <span className="ml-1 text-[10px] text-gray-400">({Math.round((prod.margen / (prod.precio || 1)) * 100)}%)</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <span className={`font-black text-sm ${prod.stock <= prod.stock_minimo ? 'text-red-500 bg-red-50 px-2 py-0.5 rounded' : 'text-gray-700'}`}>{prod.stock}</span>
                                                {prod.stock <= prod.stock_minimo && <AlertTriangle size={14} className="text-red-500" />}
                                            </div>
                                        </td>
                                        {canEdit && (
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <ToggleSwitch
                                                        checked={prod.activo === true || prod.activo === 1}
                                                        onChange={() => handleToggleActivo(prod)}
                                                    />
                                                </div>
                                            </td>
                                        )}
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                                                {canEdit && <button onClick={() => openEdit(prod)} className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg"><Edit size={16} /></button>}
                                                {canDelete && <button onClick={() => handleDelete(prod.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {movimientos.map((mov) => (
                                <tr key={mov.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(mov.fecha).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{mov.producto_nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${mov.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} uppercase`}>{mov.tipo}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{mov.cantidad}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{mov.motivo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="bg-primary-600 p-6 text-white">
                            <h2 className="text-xl font-bold">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input type="text" required className="input-field" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select required className="input-field text-sm" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                                        <option value="">Seleccione...</option>
                                        {categoriasLista.map(cat => (
                                            <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Compra</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="input-field text-sm" 
                                        value={formatCurrency(formData.precio_compra)} 
                                        onChange={e => setFormData({...formData, precio_compra: cleanNumericValue(e.target.value)})} 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="input-field text-sm" 
                                        value={formatCurrency(formData.precio)} 
                                        onChange={e => setFormData({...formData, precio: cleanNumericValue(e.target.value)})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Margen ($)</label>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        className="input-field text-sm bg-gray-50 font-bold text-green-600" 
                                        value={formatCurrency(formData.margen)} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input type="number" required className="input-field" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                                    <input type="number" required className="input-field" value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea className="input-field min-h-[80px]" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="input-field py-1" 
                                    onChange={e => setSelectedFile(e.target.files[0])} 
                                />
                                {editingProduct?.imagen_url && !selectedFile && (
                                    <p className="text-[10px] text-gray-500 mt-1 italic">Ya tiene una imagen. Suba una nueva para reemplazarla.</p>
                                )}
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => { setShowModal(false); setSelectedFile(null); }} className="px-4 py-2 text-gray-500 font-medium hover:text-gray-700 transition-colors">Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar Producto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showMovementModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="bg-primary-600 p-6 text-white">
                            <h2 className="text-xl font-bold">Nuevo Movimiento</h2>
                        </div>
                        <form onSubmit={handleMovementSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                                <select required className="input-field" value={movementFormData.producto_id} onChange={e => setMovementFormData({...movementFormData, producto_id: e.target.value})}>
                                    <option value="">Seleccione producto...</option>
                                    {productos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select className="input-field" value={movementFormData.tipo} onChange={e => setMovementFormData({...movementFormData, tipo: e.target.value})}>
                                        <option value="entrada">Entrada (+)</option>
                                        <option value="salida">Salida (-)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                    <input type="number" required min="1" className="input-field" value={movementFormData.cantidad} onChange={e => setMovementFormData({...movementFormData, cantidad: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Observación</label>
                                <input type="text" required placeholder="Ej: Compra, Ajuste, Daño..." className="input-field" value={movementFormData.motivo} onChange={e => setMovementFormData({...movementFormData, motivo: e.target.value})} />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setShowMovementModal(false)} className="px-4 py-2 text-gray-500 font-medium hover:text-gray-700 transition-colors">Cancelar</button>
                                <button type="submit" className="btn-primary">Registrar Movimiento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
