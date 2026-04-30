import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
    FileText, 
    Plus, 
    Trash2, 
    Download, 
    Upload, 
    Calendar,
    AlertCircle,
    Loader2,
    X,
    Save,
    FileCheck
} from 'lucide-react';

const DocumentosHotel = () => {
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'OTRO',
        observacion: ''
    });

    const fetchDocumentos = async () => {
        try {
            setLoading(true);
            const res = await api.get('/documentos-hotel');
            setDocumentos(res.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
            Swal.fire('Error', 'No se pudieron cargar los documentos', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocumentos();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            tipo: 'OTRO',
            observacion: ''
        });
        setFile(null);
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            return Swal.fire('Error', 'Por favor selecciona un archivo', 'error');
        }

        try {
            setUploading(true);
            const data = new FormData();
            data.append('documento', file);
            data.append('nombre', formData.nombre);
            data.append('tipo', formData.tipo);
            data.append('observacion', formData.observacion);

            await api.post('/documentos-hotel', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Swal.fire('Subido', 'Documento guardado correctamente', 'success');
            fetchDocumentos();
            resetForm();
        } catch (error) {
            console.error('Error uploading document:', error);
            Swal.fire('Error', 'No se pudo subir el documento', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar documento?',
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
                await api.delete(`/documentos-hotel/${id}`);
                Swal.fire('Eliminado', 'El documento ha sido eliminado', 'success');
                fetchDocumentos();
            } catch (error) {
                console.error('Error deleting document:', error);
                Swal.fire('Error', 'No se pudo eliminar el documento', 'error');
            }
        }
    };

    const handleDownload = async (docId, filename) => {
        if (!docId) return;
        
        try {
            // Mostrar un pequeño aviso de descarga
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
            });
            
            toast.fire({
                icon: 'info',
                title: 'Procesando descarga segura...'
            });

            // Usar el nuevo endpoint de proxy en el backend con token en query como fallback
            const token = localStorage.getItem('token');
            const response = await api.get(`/documentos-hotel/download/${docId}?token=${token}`, {
                responseType: 'blob'
            });
            
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            
            // Asegurar que tenga la extensión correcta
            const safeFileName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
            
            link.download = safeFileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
            Swal.fire('Error', 'No se pudo procesar la descarga desde el servidor. Intente de nuevo.', 'error');
        }
    };

    const getTipoLabel = (tipo) => {
        const labels = {
            'CEDULA': 'Cédula de Ciudadanía',
            'RUT': 'RUT (Registro Único Tributario)',
            'CAMARA_COMERCIO': 'Cámara de Comercio',
            'RNT': 'RNT (Registro Nal. de Turismo)',
            'OTRO': 'Otro Documento'
        };
        return labels[tipo] || tipo;
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        Documentación Legal del Hotel
                    </h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Gestión de RUT, RNT y archivos institucionales</p>
                </div>

                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 active:scale-95"
                >
                    <Plus size={18} /> Cargar Documento
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                    <Loader2 size={40} className="text-rose-500 animate-spin opacity-20" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-4">Cargando archivos...</p>
                </div>
            ) : documentos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                    <AlertCircle size={40} className="text-slate-200" />
                    <p className="text-sm font-bold text-slate-400 mt-4">No hay documentos cargados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documentos.map((doc) => (
                        <div key={doc._id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                                        <FileCheck size={24} />
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleDownload(doc._id, doc.nombre)} 
                                            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                                            title="Descargar"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(doc._id)}
                                            className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 mb-1">{doc.nombre}</h3>
                                <div className="inline-block px-3 py-1 bg-slate-100 rounded-full mb-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{getTipoLabel(doc.tipo)}</span>
                                </div>

                                <div className="flex items-center gap-2 text-slate-400 mb-4">
                                    <Calendar size={14} />
                                    <span className="text-xs font-bold">Subido el: {new Date(doc.fechaSubida).toLocaleDateString()}</span>
                                </div>

                                {doc.observacion && (
                                    <div className="mt-4 pt-4 border-t border-slate-50">
                                        <p className="text-xs text-slate-500">{doc.observacion}</p>
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
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Cargar Nuevo Documento</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Sube archivos PDF o Imágenes oficiales</p>
                            </div>
                            <button onClick={resetForm} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Nombre del Documento *</label>
                                    <input 
                                        type="text" 
                                        name="nombre"
                                        required
                                        placeholder="Ej: RUT Hotel Balcón Plaza 2026"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-rose-500/20 transition-all"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Tipo de Documento</label>
                                    <select 
                                        name="tipo"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-rose-500/20 transition-all"
                                        value={formData.tipo}
                                        onChange={handleInputChange}
                                    >
                                        <option value="CEDULA">Cédula de Ciudadanía</option>
                                        <option value="RUT">RUT</option>
                                        <option value="CAMARA_COMERCIO">Cámara de Comercio</option>
                                        <option value="RNT">RNT</option>
                                        <option value="OTRO">Otro Documento</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Seleccionar Archivo (PDF, JPG, PNG)</label>
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            id="file-upload"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        <label 
                                            htmlFor="file-upload"
                                            className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-8 px-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-rose-300 transition-all group"
                                        >
                                            <Upload size={32} className="text-slate-300 group-hover:text-rose-400 mb-2" />
                                            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700">
                                                {file ? file.name : 'Click para buscar archivo'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 mt-1">Tamaño máx: 10MB</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Observaciones</label>
                                    <textarea 
                                        name="observacion"
                                        rows="2"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
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
                                    disabled={uploading}
                                    className="flex-2 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                                    {uploading ? 'Subiendo...' : 'Guardar Documento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentosHotel;
