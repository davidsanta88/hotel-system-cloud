import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, UserCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePermissions } from '../hooks/usePermissions';

const Usuarios = () => {
    const { user } = useContext(AuthContext);
    const { canView, canEdit, canDelete } = usePermissions('usuarios');
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [current, setCurrent] = useState({ nombre: '', email: '', password: '', rol_id: 2, telefono: '' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (canView) {
            fetchUsuarios();
            fetchRoles();
        }
    }, [canView]);

    const fetchUsuarios = async () => {
        try {
            const response = await api.get('/usuarios');
            setUsuarios(response.data);
            setLoading(false);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles', error);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setCurrent({ ...item, password: '' });
            setIsEditing(true);
        } else {
            setCurrent({ nombre: '', email: '', password: '', rol_id: 2, telefono: '' });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/usuarios/${current.id}`, current);
                Swal.fire('Éxito', 'Usuario actualizado', 'success');
            } else {
                await api.post('/usuarios', current);
                Swal.fire('Éxito', 'Usuario creado', 'success');
            }
            setShowModal(false);
            fetchUsuarios();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar el usuario', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar acceso?',
            text: "El usuario ya no podrá iniciar sesión en el sistema.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/usuarios/${id}`);
                Swal.fire('Eliminado!', 'El usuario ha sido eliminado.', 'success');
                fetchUsuarios();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el usuario', 'error');
            }
        }
    };

    if (!canView && user?.rol_nombre !== 'Admin' && user?.nombre !== 'Administrador') {
        return <div className="p-8 text-center text-red-500 font-bold">Acceso Denegado. Área exclusiva para Administradores autorizados.</div>;
    }

    const filtered = usuarios.filter(u => 
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Cuentas y Personal</h1>
                    <p className="text-gray-500">Administra quiénes pueden acceder al sistema y establece sus permisos</p>
                </div>
                {canEdit && (
                    <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 shadow-lg hover:-translate-y-1 transition-transform">
                        <Plus size={20} />
                        Registrar Empleado
                    </button>
                )}
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
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
                            <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 uppercase text-xs tracking-wider">
                                <th className="p-4 font-semibold uppercase text-xs tracking-wider">Usuario / Nombre</th>
                                <th className="p-4 font-semibold">Contacto</th>
                                <th className="p-4 font-semibold text-center">Nivel de Acceso</th>
                                {(canEdit || canDelete) && <th className="p-4 font-semibold text-right">Manejo de Cuenta</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-gray-500 font-medium">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                                            <div className="bg-blue-100 text-blue-600 p-2 rounded-full hidden sm:block">
                                                <UserCircle size={20} />
                                            </div>
                                            {item.nombre}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-900 font-semibold">{item.email}</div>
                                            <div className="text-gray-500 text-[11px] font-medium mt-1 uppercase tracking-wider">{item.telefono || 'Sin teléfono'}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest ${item.rol_id === 1 ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-green-100 text-green-700 border border-green-200 shadow-sm'}`}>
                                                {roles.find(r => r.id === item.rol_id)?.nombre || (item.rol_id === 1 ? 'Administrador' : 'Empleado')}
                                            </span>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit && (
                                                        <button 
                                                            onClick={() => handleOpenModal(item)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 bg-white rounded-lg shadow-sm border border-gray-100 transition-all hover:scale-105"
                                                            title="Editar Datos o Cambiar Clave"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    {canDelete && item.id !== user.id && (
                                                        <button 
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 bg-white rounded-lg shadow-sm border border-gray-100 transition-all hover:scale-105"
                                                            title="Revocar Acceso"
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-gray-100">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-3.5 rounded-xl shadow-lg">
                                <UserCircle size={26} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-800">
                                    {isEditing ? 'Configurar Credenciales' : 'Conceder Acceso'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1 font-medium">
                                    {isEditing ? 'Modifica el rol o la contraseña de este empleado' : 'Crea un usuario nuevo para tu personal'}
                                </p>
                            </div>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field text-gray-900 font-medium"
                                        placeholder="Ej. Juan Pérez"
                                        value={current.nombre}
                                        onChange={e => setCurrent({...current, nombre: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono (Opcional)</label>
                                    <input
                                        type="tel"
                                        className="input-field text-gray-900 font-medium"
                                        placeholder="Ej. 300 123 4567"
                                        value={current.telefono || ''}
                                        onChange={e => setCurrent({...current, telefono: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico *</label>
                                    <input
                                        type="email"
                                        required
                                        className="input-field text-gray-900 font-medium"
                                        placeholder="correo@ejemplo.com"
                                        value={current.email}
                                        onChange={e => setCurrent({...current, email: e.target.value})}
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wide">Usuario de Ingreso</p>
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nivel de Permisos *</label>
                                    <select
                                        className="input-field font-bold text-blue-900 bg-blue-50/30 border-blue-200"
                                        value={current.rol_id}
                                        onChange={e => setCurrent({...current, rol_id: parseInt(e.target.value)})}
                                        required
                                    >
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/50 mt-4 shadow-inner">
                                <label className="block text-sm font-bold text-amber-800 mb-2">Clave Maestra {isEditing ? '(Solo si deseas cambiarla)' : '*'}</label>
                                <input
                                    type={isEditing ? "password" : "text"}
                                    required={!isEditing}
                                    minLength={isEditing ? 0 : 5}
                                    className="input-field bg-white focus:border-amber-400 focus:ring-amber-400/20"
                                    placeholder={isEditing ? "****************" : "Asigna una contraseña inicial"}
                                    value={current.password}
                                    onChange={e => setCurrent({...current, password: e.target.value})}
                                />
                            </div>

                            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary py-3 text-sm font-bold text-gray-600 hover:text-gray-800 transition">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-[2] btn-primary py-3 text-sm font-bold shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all">
                                    {isEditing ? 'Guardar Cambios' : 'Registrar Empleado'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;
