import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
    Users, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Phone, 
    Smartphone, 
    Mail, 
    FileText, 
    AlertCircle,
    Loader2,
    X,
    Save
} from 'lucide-react';

const Proveedores = () => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        nit: '',
        telefono: '',
        celular: '',
        email: '',
        observacion: ''
    });

    const fetchProveedores = async () => {
        try {
            setLoading(true);
            const res = await api.get('/proveedores');
            setProveedores(res.data);
        } catch (error) {
            console.error('Error fetching providers:', error);
            Swal.fire('Error', 'No se pudieron cargar los proveedores', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProveedores();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            nit: '',
            telefono: '',
            celular: '',
            email: '',
            observacion: ''
        });
        setEditingId(null);
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/proveedores/${editingId}`, formData);
                Swal.fire('Actualizado', 'Proveedor actualizado correctamente', 'success');
            } else {
                await api.post('/proveedores', formData);
                Swal.fire('Creado', 'Proveedor creado correctamente', 'success');
            }
            fetchProveedores();
            resetForm();
        } catch (error) {
            console.error('Error saving provider:', error);
            Swal.fire('Error', 'No se pudo guardar el proveedor', 'error');
        }
    };

    const handleEdit = (prov) => {
        setFormData({
            nombre: prov.nombre,
            nit: prov.nit || '',
            telefono: prov.telefono || '',
            celular: prov.celular || '',
            email: prov.email || '',
            observacion: prov.observacion || ''
        });
        setEditingId(prov._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/proveedores/${id}`);
                Swal.fire('Eliminado', 'El proveedor ha sido eliminado', 'success');
                fetchProveedores();
            } catch (error) {
                console.error('Error deleting provider:', error);
                Swal.fire('Error', 'No se pudo eliminar el proveedor', 'error');
            }
        }
    };

    const filteredProveedores = proveedores.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        Gestión de Proveedores
                    </h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Directorio de aliados y suministros</p>
                </div>

                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                    <Plus size={18} /> Nuevo Proveedor
                </button>
            </div>

            {/* Search & Stats */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, NIT o email..."
                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                    <Loader2 size={40} className="text-indigo-500 animate-spin opacity-20" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-4">Cargando directorio...</p>
                </div>
            ) : filteredProveedores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                    <AlertCircle size={40} className="text-slate-200" />
                    <p className="text-sm font-bold text-slate-400 mt-4">No se encontraron proveedores</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProveedores.map((prov) => (
                        <div key={prov._id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 font-black text-xl">
                                        {prov.nombre.charAt(0)}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleEdit(prov)}
                                            className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(prov._id)}
                                            className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 mb-1">{prov.nombre}</h3>
                                {prov.nit && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">NIT: {prov.nit}</p>}

                                <div className="space-y-3">
                                    {prov.telefono && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                                <Phone size={14} />
                                            </div>
                                            <span className="text-sm font-bold">{prov.telefono}</span>
                                        </div>
                                    )}
                                    {prov.celular && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                                <Smartphone size={14} />
                                            </div>
                                            <span className="text-sm font-bold">{prov.celular}</span>
                                        </div>
                                    )}
                                    {prov.email && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                                <Mail size={14} />
                                            </div>
                                            <span className="text-sm font-bold truncate max-w-[180px]">{prov.email}</span>
                                        </div>
                                    )}
                                </div>

                                {prov.observacion && (
                                    <div className="mt-6 pt-4 border-t border-slate-50">
                                        <p className="text-xs text-slate-400 italic">"{prov.observacion}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Completa los datos del aliado comercial</p>
                            </div>
                            <button onClick={resetForm} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Nombre del Proveedor *</label>
                                    <input 
                                        type="text" 
                                        name="nombre"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">NIT / RUT</label>
                                    <input 
                                        type="text" 
                                        name="nit"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        value={formData.nit}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Correo Electrónico</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Teléfono Fijo</label>
                                    <input 
                                        type="text" 
                                        name="telefono"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Celular / WhatsApp</label>
                                    <input 
                                        type="text" 
                                        name="celular"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        value={formData.celular}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Observaciones</label>
                                    <textarea 
                                        name="observacion"
                                        rows="3"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                        value={formData.observacion}
                                        onChange={handleInputChange}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-2 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                                >
                                    <Save size={18} /> {editingId ? 'Actualizar' : 'Guardar Proveedor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Proveedores;
