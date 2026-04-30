import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import { Plus, Edit2, Trash2, Search, LayoutGrid, List, ChevronLeft, ChevronRight, Camera, X, Hotel, Zap, Users, Brush } from 'lucide-react';
import { formatCurrency, cleanNumericValue, getImageUrl } from '../utils/format';
import { usePermissions } from '../hooks/usePermissions';

const Carousel = ({ photos }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!photos || photos.length === 0) {
        return (
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400">Sin fotos disponibles</p>
            </div>
        );
    }

    const next = () => setCurrentIndex((currentIndex + 1) % photos.length);
    const prev = () => setCurrentIndex((currentIndex - 1 + photos.length) % photos.length);

    return (
        <div className="relative w-full h-80 rounded-xl overflow-hidden group shadow-md">
            <img 
                src={getImageUrl(photos[currentIndex], import.meta.env.VITE_API_URL || 'http://localhost:5000')} 
                alt="Habitación" 
                className="w-full h-full object-cover transition-all duration-500"
            />
            {photos.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronLeft size={24} className="text-gray-800" />
                    </button>
                    <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={24} className="text-gray-800" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {photos.map((_, idx) => (
                            <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const RoomDetailModal = ({ room, onClose }) => {
    if (!room) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
                {/* Carrusel */}
                <div className="w-full md:w-1/2 p-4 bg-gray-50 flex items-center justify-center">
                    <Carousel photos={room.photos} />
                </div>
                
                {/* Detalles */}
                <div className="w-full md:w-1/2 p-8 overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 inline-block
                                ${room.estado_nombre && room.estado_nombre.toLowerCase() === 'disponible' ? 'bg-green-100 text-green-700' : 
                                  room.estado_nombre && room.estado_nombre.toLowerCase() === 'ocupada' ? 'bg-red-100 text-red-700' : 
                                  'bg-yellow-100 text-yellow-700'}`}>
                                {room.estado_nombre}
                            </span>
                            <h2 className="text-4xl font-extrabold text-gray-900">Habitación #{room.numero}</h2>
                            <p className="text-lg text-primary-600 font-semibold capitalize">{room.tipo_nombre}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <Plus className="rotate-45 text-gray-400" size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Descripción</h3>
                            <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {room.descripcion || 'Sin descripción detallada disponible.'}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Tarifas por Persona</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[1,2,3,4,5,6].map(num => (
                                    room[`precio_${num}`] ? (
                                        <div key={num} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm flex justify-between items-center">
                                            <span className="text-gray-500 text-sm">{num} Persona(s)</span>
                                            <span className="font-bold text-gray-900">${formatCurrency(room[`precio_${num}`])}</span>
                                        </div>
                                    ) : null
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button onClick={onClose} className="w-full btn-primary py-3 rounded-xl shadow-lg shadow-primary-200">
                            Cerrar Detalles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Rooms = () => {
    const { user } = useContext(AuthContext);
    const { canEdit, canDelete } = usePermissions('habitaciones');
    const [rooms, setRooms] = useState([]);
    const [tiposHabitacion, setTiposHabitacion] = useState([]);
    const [estadosHabitacion, setEstadosHabitacion] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [currentRoom, setCurrentRoom] = useState({ 
        numero: '', 
        tipo_id: '', 
        estado_id: '', 
        precio_1: '', 
        precio_2: '',
        precio_3: '',
        precio_4: '',
        precio_5: '',
        precio_6: '',
        descripcion: '' 
    });

    useEffect(() => {
        fetchRooms();
        fetchTiposHabitacion();
        fetchEstadosHabitacion();
    }, []);

    const fetchEstadosHabitacion = async () => {
        try {
            const { data } = await api.get('/estados-habitacion');
            setEstadosHabitacion(data);
        } catch (error) {
            console.error('Error fetching estados de habitacion', error);
        }
    };

    const fetchTiposHabitacion = async () => {
        try {
            const { data } = await api.get('/tipos-habitacion');
            setTiposHabitacion(data);
        } catch (error) {
            console.error('Error fetching tipos de habitacion', error);
        }
    };

    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/habitaciones');
            setRooms(data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar las habitaciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let roomId;
            if (editMode) {
                await api.put(`/habitaciones/${currentRoom.id}`, currentRoom);
                roomId = currentRoom.id;
                Swal.fire('Éxito', 'Habitación actualizada', 'success');
            } else {
                const { data } = await api.post('/habitaciones', currentRoom);
                // Asumiendo que el backend retorna el ID en data.id o similar
                // Si no, fetchRooms() y buscar el más reciente, pero mejor si el backend lo da.
                // Re-fetch para estar seguros y obtener el ID si es nuevo.
                const newRooms = await api.get('/habitaciones');
                const lastRoom = newRooms.data.sort((a,b) => b.id - a.id)[0];
                roomId = lastRoom.id;
                Swal.fire('Éxito', 'Habitación creada', 'success');
            }
            
            // Guardar fotos si hay seleccionadas
            if (selectedFiles.length > 0) {
                await savePhotos(roomId);
            }

            setShowModal(false);
            fetchRooms();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/habitaciones/${id}`);
                Swal.fire('Eliminada', 'La habitación ha sido eliminada.', 'success');
                fetchRooms();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar la habitación', 'error');
            }
        }
    };


    const openModal = (room = null) => {
        if (room) {
            setCurrentRoom({
                ...room, 
                // Asegurar que usamos los IDs si vienen de los nombres populados
                tipo_id: room.tipo_id || (room.tipo?._id || room.tipo),
                estado_id: room.estado_id || (room.estado?._id || room.estado),
                precio_1: (room.precio_1 !== null && room.precio_1 !== undefined) ? room.precio_1 : '',
                precio_2: (room.precio_2 !== null && room.precio_2 !== undefined) ? room.precio_2 : '',
                precio_3: (room.precio_3 !== null && room.precio_3 !== undefined) ? room.precio_3 : '',
                precio_4: (room.precio_4 !== null && room.precio_4 !== undefined) ? room.precio_4 : '',
                precio_5: (room.precio_5 !== null && room.precio_5 !== undefined) ? room.precio_5 : '',
                precio_6: (room.precio_6 !== null && room.precio_6 !== undefined) ? room.precio_6 : ''
            });
            setEditMode(true);
        } else {
            setCurrentRoom({ 
                numero: '', 
                tipo_id: '', 
                estado_id: '', 
                precio_1: '', 
                precio_2: '',
                precio_3: '',
                precio_4: '',
                precio_5: '',
                precio_6: '',
                descripcion: '' 
            });
            setEditMode(false);
        }
        setShowModal(true);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles([...selectedFiles, ...files]);
    };

    const removeSelectedFile = (index) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);
    };

    const savePhotos = async (roomId) => {
        if (selectedFiles.length === 0) return;
        
        setUploading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('fotos', file);
        });

        try {
            await api.post(`/habitaciones/${roomId}/fotos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSelectedFiles([]);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron subir las fotos', 'error');
        } finally {
            setUploading(false);
        }
    };

    const openDetailModal = (room) => {
        setSelectedRoom(room);
        setShowDetailModal(true);
    };

    const filteredRooms = rooms.filter(room => {
        const searchPath = `${room.numero} ${room.tipo_nombre} ${room.estado_nombre}`.toLowerCase();
        return searchPath.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                        <Hotel size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Habitaciones</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Control de Inventario y Estados</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por #, tipo o estado..." 
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Vista de Lista"
                        >
                            <List size={20} />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Vista de Grid"
                        >
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                    {canEdit && (
                        <button onClick={() => openModal()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200">
                            <Plus size={18} />
                            <span>Nueva Habitación</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Widgets de Resumen Operativo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Hotel size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Habitaciones</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{rooms.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibles</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tighter">
                            {rooms.filter(r => r.estado_nombre?.toLowerCase() === 'disponible').length}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupadas</p>
                        <p className="text-3xl font-black text-rose-600 tracking-tighter">
                            {rooms.filter(r => r.estado_nombre?.toLowerCase() === 'ocupada').length}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Brush size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Aseo / Mant.</p>
                        <p className="text-3xl font-black text-amber-600 tracking-tighter">
                            {rooms.filter(r => ['por asear', 'sucio', 'aseo', 'mantenimiento'].includes(r.estado_nombre?.toLowerCase())).length}
                        </p>
                    </div>
                </div>
            </div>

            <div className="">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 card">Cargando habitaciones...</div>
                ) : filteredRooms.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 card">
                        {searchTerm ? 'No se encontraron habitaciones para esta búsqueda.' : 'No hay habitaciones registradas.'}
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="card overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precios x Persona</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    {(canEdit || canDelete) && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.numero}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{room.tipo_nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                <span>1: ${formatCurrency(room.precio_1)}</span>
                                                <span>2: ${formatCurrency(room.precio_2)}</span>
                                                <span>3: ${formatCurrency(room.precio_3)}</span>
                                                <span>4: ${formatCurrency(room.precio_4)}</span>
                                                <span>5: ${formatCurrency(room.precio_5)}</span>
                                                <span>6: ${formatCurrency(room.precio_6)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={room.descripcion}>
                                            {room.descripcion || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${room.estado_nombre && room.estado_nombre.toLowerCase() === 'disponible' ? 'bg-green-100 text-green-800' : 
                                                  room.estado_nombre && room.estado_nombre.toLowerCase() === 'ocupada' ? 'bg-red-100 text-red-800' : 
                                                  'bg-yellow-100 text-yellow-800'}`}>
                                                {room.estado_nombre || 'N/A'}
                                            </span>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {canEdit && (
                                                    <button onClick={() => openModal(room)} className="text-primary-600 hover:text-primary-900 mx-2">
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => handleDelete(room.id)} className="text-red-600 hover:text-red-900 mx-2">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRooms.map((room) => (
                            <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className={`h-2 ${room.estado_nombre && room.estado_nombre.toLowerCase() === 'disponible' ? 'bg-green-500' : 
                                                  room.estado_nombre && room.estado_nombre.toLowerCase() === 'ocupada' ? 'bg-red-500' : 
                                                  'bg-yellow-500'}`}></div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">#{room.numero}</h3>
                                            <p className="text-sm text-gray-500 font-medium capitalize">{room.tipo_nombre}</p>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                                            ${room.estado_nombre && room.estado_nombre.toLowerCase() === 'disponible' ? 'bg-green-100 text-green-700' : 
                                              room.estado_nombre && room.estado_nombre.toLowerCase() === 'ocupada' ? 'bg-red-100 text-red-700' : 
                                              'bg-yellow-100 text-yellow-700'}`}>
                                            {room.estado_nombre || 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-4 space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Precio base (1p):</span>
                                            <span className="font-bold text-gray-900">${formatCurrency(room.precio_1)}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-2 italic">
                                            {room.descripcion || 'Sin descripción'}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                                        {(canEdit || canDelete) && (
                                            <div className="flex space-x-1">
                                                {canEdit && (
                                                    <button onClick={() => openModal(room)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => handleDelete(room.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => openDetailModal(room)}
                                            className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-tight"
                                        >
                                            Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal simple */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-bold mb-4">{editMode ? 'Editar' : 'Nueva'} Habitación</h2>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Número</label>
                                <input type="number" required className="input-field" value={currentRoom.numero}
                                    onChange={e => setCurrentRoom({...currentRoom, numero: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                                <select required className="input-field" value={currentRoom.tipo_id} onChange={e => setCurrentRoom({...currentRoom, tipo_id: e.target.value})}>
                                    <option value="">Seleccione tipo...</option>
                                    {tiposHabitacion.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Estado</label>
                                <select required className="input-field" value={currentRoom.estado_id} onChange={e => setCurrentRoom({...currentRoom, estado_id: e.target.value})}>
                                    <option value="">Seleccione estado...</option>
                                    {estadosHabitacion.map(e => (
                                        <option key={e.id} value={e.id}>{e.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="col-span-1 md:col-span-2 mt-2 pt-2 border-t">
                                <h3 className="text-sm font-bold text-gray-600 mb-2">Precios según cantidad de personas</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[1,2,3,4,5,6].map(num => (
                                        <div key={num}>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase">Precio x {num}</label>
                                            <input 
                                                type="text" 
                                                className="input-field py-1" 
                                                value={formatCurrency(currentRoom[`precio_${num}`])} 
                                                onChange={e => setCurrentRoom({...currentRoom, [`precio_${num}`]: cleanNumericValue(e.target.value)})} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                                <textarea className="input-field" rows="3" value={currentRoom.descripcion}
                                    onChange={e => setCurrentRoom({...currentRoom, descripcion: e.target.value})}></textarea>
                            </div>

                            <div className="col-span-1 md:col-span-2 mt-2 pt-2 border-t">
                                <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center">
                                    <Camera size={16} className="mr-2" /> Subir Fotos
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Plus className="w-8 h-8 mb-3 text-gray-400" />
                                                <p className="mb-2 text-sm text-gray-500 font-semibold text-center px-4">Haz clic para subir fotos (Máx. 10)</p>
                                            </div>
                                            <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                                        </label>
                                    </div>
                                    
                                    {selectedFiles.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2">
                                            {selectedFiles.map((file, idx) => (
                                                <div key={idx} className="relative h-16 bg-gray-200 rounded-md overflow-hidden group">
                                                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeSelectedFile(idx)}
                                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={16} className="text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={uploading}>
                                    {uploading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && (
                <RoomDetailModal 
                    room={selectedRoom} 
                    onClose={() => setShowDetailModal(false)} 
                />
            )}
        </div>
    );
};

export default Rooms;
