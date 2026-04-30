import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
    Users, 
    Plus, 
    Trash2, 
    Edit2, 
    Globe, 
    Phone, 
    MapPin, 
    Image as ImageIcon,
    Loader2,
    X,
    Save,
    ExternalLink,
    CheckCircle,
    XCircle,
    Utensils,
    Coffee,
    Compass,
    Briefcase,
    Truck,
    LayoutGrid
} from 'lucide-react';

const Aliados = () => {
    const [aliados, setAliados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAliado, setEditingAliado] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'OTRO',
        descripcion: '',
        sitioWeb: '',
        telefono: '',
        ubicacion: '',
        orden: 0,
        activo: true
    });

    const fetchAliados = async () => {
        try {
            setLoading(true);
            const res = await api.get('/aliados');
            setAliados(res.data);
        } catch (error) {
            console.error('Error fetching aliados:', error);
            Swal.fire('Error', 'No se pudieron cargar los aliados', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAliados();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            tipo: 'OTRO',
            descripcion: '',
            sitioWeb: '',
            telefono: '',
            ubicacion: '',
            orden: 0,
            activo: true
        });
        setFile(null);
        setEditingAliado(null);
        setShowModal(false);
    };

    const handleEdit = (aliado) => {
        setEditingAliado(aliado);
        setFormData({
            nombre: aliado.nombre,
            tipo: aliado.tipo,
            descripcion: aliado.descripcion || '',
            sitioWeb: aliado.sitioWeb || '',
            telefono: aliado.telefono || '',
            ubicacion: aliado.ubicacion || '',
            orden: aliado.orden || 0,
            activo: aliado.activo
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            const data = new FormData();
            data.append('nombre', formData.nombre);
            data.append('tipo', formData.tipo);
            data.append('descripcion', formData.descripcion);
            data.append('sitioWeb', formData.sitioWeb);
            data.append('telefono', formData.telefono);
            data.append('ubicacion', formData.ubicacion);
            data.append('orden', formData.orden);
            data.append('activo', formData.activo);
            if (file) data.append('logo', file);

            if (editingAliado) {
                await api.put(`/aliados/${editingAliado._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire('Actualizado', 'Aliado actualizado correctamente', 'success');
            } else {
                await api.post('/aliados', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire('Creado', 'Aliado creado correctamente', 'success');
            }

            fetchAliados();
            resetForm();
        } catch (error) {
            console.error('Error saving aliado:', error);
            Swal.fire('Error', 'No se pudo guardar el aliado', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar aliado?',
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
                await api.delete(`/aliados/${id}`);
                Swal.fire('Eliminado', 'El aliado ha sido eliminado', 'success');
                fetchAliados();
            } catch (error) {
                console.error('Error deleting aliado:', error);
                Swal.fire('Error', 'No se pudo eliminar el aliado', 'error');
            }
        }
    };

    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case 'RESTAURANTE': return <Utensils size={18} />;
            case 'CAFE_BAR': return <Coffee size={18} />;
            case 'AGENCIA_TURISMO': return <Compass size={18} />;
            case 'CAJA_COMPENSACION': return <Briefcase size={18} />;
            case 'TRANSPORTE': return <Truck size={18} />;
            default: return <LayoutGrid size={18} />;
        }
    };

    const getTipoLabel = (tipo) => {
        const labels = {
            'RESTAURANTE': 'Restaurante',
            'CAFE_BAR': 'Café / Bar',
            'AGENCIA_TURISMO': 'Agencia de Turismo',
            'CAJA_COMPENSACION': 'Caja de Compensación',
            'TRANSPORTE': 'Transporte',
            'OTRO': 'Otro Aliado'
        };
        return labels[tipo] || tipo;
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        Gestión de Aliados Estratégicos
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Configura convenios y servicios externos para el Home</p>
                </div>

                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                    <Plus size={18} /> Nuevo Aliado
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <Loader2 size={40} className="text-indigo-500 animate-spin opacity-20" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-4">Cargando aliados...</p>
                </div>
            ) : aliados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Users size={40} className="text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Aún no hay aliados configurados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aliados.map((aliado) => (
                        <div key={aliado._id} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border ${aliado.activo ? 'border-slate-100' : 'border-slate-200 opacity-75 grayscale'} hover:shadow-md transition-all group relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden p-1">
                                        {aliado.logoUrl ? (
                                            <img src={aliado.logoUrl} alt={aliado.nombre} className="w-full h-full object-contain" />
                                        ) : (
                                            <ImageIcon size={30} className="text-slate-200" />
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleEdit(aliado)} 
                                            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(aliado._id)}
                                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-black text-slate-900 truncate">{aliado.nombre}</h3>
                                    {aliado.activo ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-slate-400" />}
                                </div>

                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                                    {getTipoIcon(aliado.tipo)}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{getTipoLabel(aliado.tipo)}</span>
                                </div>

                                {aliado.descripcion && (
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">{aliado.descripcion}</p>
                                )}

                                <div className="space-y-2 pt-4 border-t border-slate-50">
                                    {aliado.sitioWeb && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Globe size={14} className="text-slate-300" />
                                            <span className="truncate">{aliado.sitioWeb}</span>
                                        </div>
                                    )}
                                    {aliado.telefono && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Phone size={14} className="text-slate-300" />
                                            <span>{aliado.telefono}</span>
                                        </div>
                                    )}
                                    {aliado.ubicacion && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <MapPin size={14} className="text-slate-300" />
                                            <span className="truncate">{aliado.ubicacion}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4 flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-300 uppercase">Orden: {aliado.orden}</span>
                                    {aliado.sitioWeb && (
                                        <a href={aliado.sitioWeb} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700">
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingAliado ? 'Editar Aliado' : 'Nuevo Aliado Estratégico'}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Define los convenios que aparecerán en la web pública</p>
                            </div>
                            <button onClick={resetForm} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Nombre del Aliado *</label>
                                        <input 
                                            type="text" 
                                            name="nombre"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Tipo / Categoría</label>
                                        <select 
                                            name="tipo"
                                            className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                                            value={formData.tipo}
                                            onChange={handleInputChange}
                                        >
                                            <option value="RESTAURANTE">Restaurante</option>
                                            <option value="CAFE_BAR">Café / Bar</option>
                                            <option value="AGENCIA_TURISMO">Agencia de Turismo</option>
                                            <option value="CAJA_COMPENSACION">Caja de Compensación</option>
                                            <option value="TRANSPORTE">Transporte</option>
                                            <option value="OTRO">Otro Aliado</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Logo / Imagen</label>
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                id="logo-upload"
                                                className="hidden"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                            />
                                            <label 
                                                htmlFor="logo-upload"
                                                className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-4 px-4 flex items-center gap-3 cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-all group"
                                            >
                                                <div className="p-2 bg-white rounded-lg text-slate-300 group-hover:text-indigo-400 border border-slate-100">
                                                    <ImageIcon size={20} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 truncate">
                                                    {file ? file.name : 'Subir logo'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Orden de Visualización</label>
                                        <input 
                                            type="number" 
                                            name="orden"
                                            className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                                            value={formData.orden}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Teléfono de Contacto</label>
                                        <input 
                                            type="text" 
                                            name="telefono"
                                            className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                                            value={formData.telefono}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Sitio Web / Red Social</label>
                                        <input 
                                            type="text" 
                                            name="sitioWeb"
                                            placeholder="https://..."
                                            className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                                            value={formData.sitioWeb}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Dirección / Ubicación</label>
                                        <input 
                                            type="text" 
                                            name="ubicacion"
                                            className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                                            value={formData.ubicacion}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 py-4">
                                        <input 
                                            type="checkbox" 
                                            name="activo"
                                            id="activo"
                                            className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                            checked={formData.activo}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="activo" className="text-sm font-bold text-slate-700 cursor-pointer uppercase tracking-tight">Aliado Activo en la Web</label>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Breve Descripción / Beneficio para el Huésped</label>
                                <textarea 
                                    name="descripcion"
                                    rows="3"
                                    placeholder="Ej: 10% de descuento para huéspedes del hotel presentando su tarjeta de registro."
                                    className="w-full bg-slate-50 border-none rounded-3xl py-4 px-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner resize-none"
                                    value={formData.descripcion}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-[2] px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                                    {uploading ? 'Procesando...' : (editingAliado ? 'Actualizar Aliado' : 'Guardar Aliado')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Aliados;
