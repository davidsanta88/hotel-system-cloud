import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { ShieldCheck, Plus, Edit2, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const MENU_HIERARCHY = [
    {
        title: 'Recepción y Operaciones',
        permissions: [
            { id: 'dashboard', nombre: 'Dashboard Inicio' },
            { id: 'registros', nombre: 'Mapa de Habitaciones' },
            { id: 'tienda', nombre: 'Tienda / POS' },
            { id: 'inventario', nombre: 'Productos Tienda' },
            { id: 'reservas', nombre: 'Reservas a Futuro' },
            { id: 'clientes', nombre: 'Gestión de Clientes' },
            { id: 'empresas', nombre: 'Empresas Convenio' },
            { id: 'gastos', nombre: 'Gastos e Ingresos' },
            { id: 'solicitudes', nombre: 'Solicitudes de Reserva' },
            { id: 'mantenimiento', nombre: 'Mantenimiento y Reparaciones' },
            { id: 'aseo', nombre: 'Aseo Diario' },
            { id: 'auditoria_limpieza', nombre: 'Auditoría de Limpieza' }
        ]
    },
    {
        title: 'Recepción y Reservas',
        permissions: [
            { id: 'checkin_digital', nombre: 'Check-in Digital QR' }
        ]
    },
    {
        title: 'Administración y Tesorería',
        permissions: [
            { id: 'notas', nombre: 'Notas y Alertas' },
            { id: 'reportes', nombre: 'Reportes Generales' },
            { id: 'cuadre_caja', nombre: 'Cuadre de Caja' },
            { id: 'reporte_ingresos', nombre: 'Reporte de Caja' },
            { id: 'calendario_ingresos', nombre: 'Calendario Flujo de Caja' },
            { id: 'rentabilidad', nombre: 'Rentabilidad de Habitaciones' },
            { id: 'cotizaciones', nombre: 'Cotizaciones Profesionales' },
            { id: 'invitacion', nombre: 'Invitación Religiosa' },
            { id: 'medios_pago', nombre: 'Medios de Pago' }
        ]
    },
    {
        title: 'Gestión Multi-Hotel',
        permissions: [
            { id: 'reporte_ingresos_consolidado', nombre: 'Caja Consolidada' },
            { id: 'mapa_habitaciones_consolidado', nombre: 'Mapa Consolidado' },
            { id: 'calendario_ingresos', nombre: 'Flujo Caja Consolidado' },
            { id: 'rentabilidad', nombre: 'Rentabilidad Consolidada' },
            { id: 'reservas_consolidadas', nombre: 'Consolidado Reservas' },
            { id: 'comparativa', nombre: 'Comparativa de Hoteles' },
            { id: 'estadisticas', nombre: 'Estadísticas Avanzadas' }
        ]
    },
    {
        title: 'Configuraciones',
        permissions: [
            { id: 'habitaciones', nombre: 'Zonas y Habitación' },
            { id: 'tipos_habitaciones', nombre: 'Tipos de Habitación' },
            { id: 'estados_habitaciones', nombre: 'Estados de Habitación' },
            { id: 'municipios', nombre: 'Orígenes y Municipios' },
            { id: 'categorias_productos', nombre: 'Categorías de Productos' },
            { id: 'categorias_gastos', nombre: 'Categorías de Gastos/Ingresos' },
            { id: 'tipos_registro', nombre: 'Tipos de Registro' },
            { id: 'usuarios', nombre: 'Personal y Usuarios' },
            { id: 'roles_permisos', nombre: 'Roles y Permisos' },
            { id: 'configuracion', nombre: 'Información del Hotel' },
            { id: 'notificaciones', nombre: 'Notificaciones del Sistema' }
        ]
    }
];

const Roles = () => {
    const { user } = useContext(AuthContext);
    const isSuperAdmin = user?.rol_id === 1 || user?.rol_nombre?.toLowerCase()?.includes('admin') || user?.nombre === 'Administrador';
    const isAdmin = isSuperAdmin;
    
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [current, setCurrent] = useState({ nombre: '', descripcion: '', permisos: [] });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (isAdmin) fetchRoles();
    }, [isAdmin]);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
            setLoading(false);
        } catch(e) {
            Swal.fire('Error', 'No se pudieron cargar los roles', 'error');
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setCurrent({ ...item });
            setIsEditing(true);
        } else {
            setCurrent({ nombre: '', descripcion: '', permisos: [] });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const togglePermission = (permId, attr) => {
        if (current.id === 1) return; // Admin is locked
        
        const existing = current.permisos.find(p => p.p === permId);
        let newPerms;

        if (existing) {
            newPerms = current.permisos.map(p => {
                if (p.p === permId) {
                    const newVal = !p[attr];
                    const updated = { ...p, [attr]: newVal ? 1 : 0 };
                    // Si apagamos Ver (v), apagamos todo lo demás
                    if (attr === 'v' && !newVal) {
                        updated.e = 0;
                        updated.d = 0;
                    }
                    return updated;
                }
                return p;
            });
            // Si el objeto resultante tiene todo en 0, mejor lo removemos para limpiar la BD
            const target = newPerms.find(p => p.p === permId);
            if (!target.v && !target.e && !target.d) {
                newPerms = newPerms.filter(p => p.p !== permId);
            }
        } else {
            // No existía, solo permitimos encender 'v' primero o el click lo fuerza
            newPerms = [...current.permisos, { p: permId, v: 1, e: attr === 'e' ? 1 : 0, d: attr === 'd' ? 1 : 0 }];
        }
        
        setCurrent({ ...current, permisos: newPerms });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/roles/${current.id}`, current);
                Swal.fire('Éxito', 'Rol actualizado con éxito', 'success');
            } else {
                await api.post('/roles', current);
                Swal.fire('Éxito', 'Rol y permisos creados', 'success');
            }
            setShowModal(false);
            fetchRoles();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar el rol', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (id === 1 || id === 2) return Swal.fire('Bloqueado', 'Los roles nativos no pueden eliminarse', 'error');
        
        const res = await Swal.fire({
            title: '¿Eliminar Rol?',
            text: "Se borrarán sus permisos. (Asegúrate que ningún usuario lo tenga asignado o no podrán ingresar a nada)",
            icon: 'warning',
            showCancelButton: true
        });

        if (res.isConfirmed) {
            try {
                await api.delete(`/roles/${id}`);
                Swal.fire('Eliminado', 'Rol eliminado exitosamente', 'success');
                fetchRoles();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Error al eliminar', 'error');
            }
        }
    };

    if (!isAdmin) return <div className="p-8 text-center text-red-500 font-bold">Acceso Denegado</div>;

    if (loading) return <div className="p-8 text-center">Cargando roles...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Roles y Permisos</h1>
                    <p className="text-gray-500">Configura matrices de acceso personalizadas para las distintas áreas del sistema</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 shadow-lg hover:-translate-y-1 transition-transform">
                    <Plus size={20} />
                    Crear Nuevo Rol
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(rol => (
                    <div key={rol.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-125 group-hover:-rotate-12 ${rol.id === 1 ? 'text-purple-600' : 'text-blue-600'}`}>
                            <ShieldCheck size={100} />
                        </div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-black text-gray-800">{rol.nombre}</h3>
                                {rol.id === 1 && (
                                    <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-1 rounded-full font-black tracking-wider uppercase">Maestro</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-6 flex-grow">{rol.descripcion || 'Sin descripción'}</p>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    {rol.permisos?.length || 0} Accesos Disp.
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(rol)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Editar Permisos">
                                        <Edit2 size={16} />
                                    </button>
                                    {rol.id !== 1 && rol.id !== 2 && (
                                        <button onClick={() => handleDelete(rol.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Eliminar Rol">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-gray-100 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-2xl font-black text-gray-800">
                                {isEditing ? 'Configurar Matriz de Accesos' : 'Diseñar Nuevo Rol'}
                            </h2>
                            <p className="text-sm text-gray-500 font-medium">{isEditing ? `Selecciona o retira permisos para ${current.nombre}` : 'Los permisos darán acceso a bloques completos de información'}</p>
                        </div>
                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Perfil *</label>
                                        <input 
                                            type="text" required 
                                            className="input-field disabled:bg-gray-100" 
                                            value={current.nombre} 
                                            disabled={current.id === 1 || current.id === 2}
                                            onChange={e => setCurrent({...current, nombre: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Descripción Breve</label>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            value={current.descripcion} 
                                            onChange={e => setCurrent({...current, descripcion: e.target.value})} 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-blue-900 mb-3 uppercase tracking-wider">Pantallas Autorizadas</label>
                                    {current.id === 1 && (
                                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm mb-4 font-bold border border-yellow-200">
                                            El Administrador Maestro no puede perder accesos. Tiene el control total bloqueado por seguridad.
                                        </div>
                                    )}
                                    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                                        <table className="w-full text-left border-collapse bg-white">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                    <th className="p-3 text-[10px] font-black uppercase text-gray-500 tracking-widest">Pantalla / Módulo</th>
                                                    <th className="p-3 text-center text-[10px] font-black uppercase text-gray-500 tracking-widest">Ver</th>
                                                    <th className="p-3 text-center text-[10px] font-black uppercase text-gray-500 tracking-widest">Editar</th>
                                                    <th className="p-3 text-center text-[10px] font-black uppercase text-gray-500 tracking-widest">Eliminar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {MENU_HIERARCHY.map(group => (
                                                    <React.Fragment key={group.title}>
                                                        <tr className="bg-blue-900/5 border-y border-blue-900/10">
                                                            <td colSpan="4" className="p-3">
                                                                <span className="text-[10px] font-black uppercase text-blue-900 tracking-[0.2em]">
                                                                    {group.title}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        {group.permissions.map(perm => {
                                                            const currentPerm = current.permisos.find(p => p.p === perm.id) || { p: perm.id, v: 0, e: 0, d: 0 };
                                                            return (
                                                                <tr key={perm.id} className="hover:bg-blue-50/30 transition-colors">
                                                                    <td className="p-3 pl-8">
                                                                        <span className="text-sm font-bold text-gray-700">{perm.nombre}</span>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-30 cursor-pointer"
                                                                            disabled={current.id === 1}
                                                                            checked={!!currentPerm.v}
                                                                            onChange={() => togglePermission(perm.id, 'v')}
                                                                        />
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 disabled:opacity-30 cursor-pointer"
                                                                            disabled={current.id === 1 || !currentPerm.v}
                                                                            checked={!!currentPerm.e}
                                                                            onChange={() => togglePermission(perm.id, 'e')}
                                                                        />
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 disabled:opacity-30 cursor-pointer"
                                                                            disabled={current.id === 1 || !currentPerm.v}
                                                                            checked={!!currentPerm.d}
                                                                            onChange={() => togglePermission(perm.id, 'd')}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>
                            <div className="p-6 border-t border-gray-100 bg-white flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary py-3 text-sm font-bold uppercase tracking-wider">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-[2] btn-primary py-3 text-sm font-bold uppercase tracking-wider shadow-lg hover:-translate-y-0.5 transition-transform">
                                    Guardar Configuración
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;
