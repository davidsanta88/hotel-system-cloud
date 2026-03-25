import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePermissions } from '../hooks/usePermissions';

// Reusable Toggle Switch Component
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

const CategoriasGastos = () => {
    const { user } = useContext(AuthContext);
    const { canView, canEdit, canDelete } = usePermissions('categorias_gastos');
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [current, setCurrent] = useState({ nombre: '', descripcion: '', tipo: 'Gasto' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchCategorias();
    }, []);

    const fetchCategorias = async () => {
        try {
            const response = await api.get('/categorias-gastos');
            setCategorias(response.data);
            setLoading(false);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar las categorías de gastos e ingresos', 'error');
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setCurrent(item);
            setIsEditing(true);
        } else {
            setCurrent({ nombre: '', descripcion: '', tipo: 'Gasto' });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/categorias-gastos/${current.id}`, current);
                Swal.fire('Éxito', 'Categoría actualizada', 'success');
            } else {
                await api.post('/categorias-gastos', current);
                Swal.fire('Éxito', 'Categoría creada', 'success');
            }
            setShowModal(false);
            fetchCategorias();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar la categoría', 'error');
        }
    };

    const handleToggleActivo = async (item) => {
        if (!canEdit) return;
        try {
            await api.put(`/categorias-gastos/${item.id}/toggle`);
            fetchCategorias();
        } catch (error) {
            Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
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
                await api.delete(`/categorias-gastos/${id}`);
                Swal.fire('Eliminado!', 'La categoría ha sido eliminada.', 'success');
                fetchCategorias();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar la categoría', 'error');
            }
        }
    };

    if (!canView) {
        return <div className="p-8 text-center text-red-500">Acceso denegado. Se requieren permisos específicos para ver configuraciones de gastos.</div>;
    }

    const filtered = categorias.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando categorías...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Categorías de Gastos e Ingresos</h1>
                    <p className="text-gray-500">Configuración de clasificaciones para movimientos de tesorería</p>
                </div>
                {canEdit && (
                    <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 shadow-lg">
                        <Plus size={20} />
                        Nueva Categoría
                    </button>
                )}
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="Buscar categoría..."
                            className="input-field pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                                <th className="p-4 font-semibold uppercase text-xs tracking-wider">Nombre</th>
                                <th className="p-4 font-semibold">Tipo</th>
                                <th className="p-4 font-semibold">Descripción</th>
                                <th className="p-4 font-semibold text-center">Estado</th>
                                {(canEdit || canDelete) && <th className="p-4 font-semibold text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-4 text-center text-gray-500">
                                        No se encontraron categorías.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!item.activo ? 'opacity-60' : ''}`}>
                                        <td className="p-4 font-bold text-gray-800">{item.nombre}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.tipo === 'Ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {item.tipo || 'Gasto'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm">{item.descripcion || '-'}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <ToggleSwitch
                                                    checked={item.activo}
                                                    onChange={() => handleToggleActivo(item)}
                                                />
                                                <span className={`text-[10px] font-bold ${item.activo ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {item.activo ? 'ACTIVA' : 'INACTIVA'}
                                                </span>
                                            </div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit && (
                                                        <button 
                                                            onClick={() => handleOpenModal(item)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 bg-white rounded-lg shadow-sm border border-gray-100 transition-all hover:-translate-y-0.5"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 bg-white rounded-lg shadow-sm border border-gray-100 transition-all hover:-translate-y-0.5"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
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
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-gray-100">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Clasifica los movimientos de dinero (Ingresos/Egresos)
                            </p>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        placeholder="Ej. Nómina, Lavandería..."
                                        value={current.nombre}
                                        onChange={e => setCurrent({...current, nombre: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo *</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={current.tipo || 'Gasto'}
                                        onChange={e => setCurrent({...current, tipo: e.target.value})}
                                    >
                                        <option value="Gasto">Egreso / Gasto</option>
                                        <option value="Ingreso">Ingreso</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    className="input-field h-24 resize-none"
                                    placeholder="Detalles sobre qué abarca esta categoría..."
                                    value={current.descripcion || ''}
                                    onChange={e => setCurrent({...current, descripcion: e.target.value})}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary py-2.5">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 btn-primary py-2.5 shadow-md hover:shadow-lg">
                                    Guardar Nivel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriasGastos;
