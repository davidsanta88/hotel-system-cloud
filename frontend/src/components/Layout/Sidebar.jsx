import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
    LayoutDashboard, 
    Bed, 
    CalendarCheck, 
    Store as ShoppingStore, 
    LogOut, 
    Hotel, 
    Users, 
    MapPin, 
    CreditCard, 
    PieChart, 
    Package, 
    TrendingDown, 
    UserCog, 
    ShieldCheck, 
    ClipboardList,
    StickyNote,
    X,
    Bell,
    Brush,
    ShieldAlert,
    Wrench,
    QrCode,
    Plus,
    TrendingUp
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useContext(AuthContext);

    const hasPermission = (code) => {
        if (!code) return true;
        if (user?.rol_id === 1) return true;
        return user?.permisos?.some(p => p.p === code && p.v);
    };

    const menuGroups = [
        {
            title: 'Recepción y Operaciones',
            items: [
                { name: 'Dashboard Inicio', path: '/dashboard', icon: <LayoutDashboard size={20} />, code: 'dashboard' },
                { name: 'Registro Huéspedes', path: '/registros', icon: <CalendarCheck size={20} />, code: 'registros' },
                { name: 'Tienda / POS', path: '/tienda', icon: <ShoppingStore size={20} />, code: 'tienda' },
                { name: 'Productos Tienda', path: '/inventario', icon: <Package size={20} />, code: 'inventario' },
                { name: 'Reservas a Futuro', path: '/reservas', icon: <CalendarCheck size={20} />, code: 'reservas' },
                { name: 'Clientes', path: '/clientes', icon: <Users size={20} />, code: 'clientes' },
                { name: 'Gastos e Ingresos', path: '/gastos', icon: <TrendingDown size={20} />, code: 'gastos' },
                { name: 'Solicitudes Reserva', path: '/solicitudes', icon: <Bell size={20} />, code: 'solicitudes' },
                { name: 'Gestión de Aseo', path: '/aseo', icon: <Brush size={20} />, code: 'aseo' },
                { name: 'Mantenimiento', path: '/mantenimiento', icon: <Wrench size={20} />, code: 'mantenimiento' }
            ]
        },
        {
            title: 'Recepción y Reservas',
            items: [
                { name: 'Nueva Reserva', path: '/solicitud-reserva', icon: <Plus size={20} />, code: 'reservas' },
                { name: 'Check-in Digital QR', path: '/checkin-digital', icon: <QrCode size={20} />, code: 'checkin_digital' }
            ]
        },
        {
            title: 'Administración y Tesorería',
            items: [
                { name: 'Notas y Alertas', path: '/notas', icon: <StickyNote size={20} />, code: 'notas' },
                { name: 'Reportes', path: '/reportes', icon: <PieChart size={20} />, code: 'reportes' },
                { name: 'Estadísticas Avanzadas', path: '/estadisticas', icon: <TrendingUp size={20} />, code: 'estadisticas' },
                { name: 'Medios de Pago', path: '/medios-pago', icon: <CreditCard size={20} />, code: 'medios_pago' },
                { name: 'Auditoría Logs', path: '/auditoria', icon: <ShieldAlert size={20} />, code: 'auditoria' }
            ]
        },
        {
            title: 'Configuraciones',
            items: [
                { name: 'Zonas y Habitación', path: '/habitaciones', icon: <Hotel size={20} />, code: 'habitaciones' },
                { name: 'Tipos de Habitación', path: '/tipos-habitaciones', icon: <Bed size={20} />, code: 'tipos_habitaciones' },
                { name: 'Estados de Hab.', path: '/estados-habitaciones', icon: <Bed size={20} />, code: 'estados_habitaciones' },
                { name: 'O. Lugares', path: '/municipios', icon: <MapPin size={20} />, code: 'municipios' },
                { name: 'Cat. Productos', path: '/categorias-productos', icon: <Package size={20} />, code: 'categorias_productos' },
                { name: 'Cat. Gastos/Ingresos', path: '/categorias-gastos', icon: <Package size={20} />, code: 'categorias_gastos' },
                { name: 'Tipos de Registro', path: '/tipos-registro', icon: <ClipboardList size={20} />, code: 'tipos_registro' },
                { name: 'Personal (Usuarios)', path: '/usuarios', icon: <UserCog size={20} />, code: 'usuarios' },
                { name: 'Roles y Permisos', path: '/roles', icon: <ShieldCheck size={20} />, code: 'roles_permisos' },
                { name: 'Notificaciones', path: '/notificaciones', icon: <Bell size={20} />, code: 'notificaciones' }
            ]
        }
    ];

    return (
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between lg:justify-center bg-slate-950">
                <h2 className="text-2xl font-black bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Hotel Admin</h2>
                <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>
            
            <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
                <ul className="space-y-6">
                    {menuGroups.map((group, index) => {
                        const visibleItems = group.items.filter(item => hasPermission(item.code));
                        if (visibleItems.length === 0) return null;

                        return (
                            <li key={index}>
                                <div className="px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {group.title}
                                </div>
                                <ul className="space-y-1">
                                    {visibleItems.map((item, idx) => (
                                        <li key={idx}>
                                            <NavLink
                                                to={item.path}
                                                onClick={() => { if(window.innerWidth < 1024) setIsOpen(false); }}
                                                className={({ isActive }) =>
                                                    `flex items-center px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 group relative ${
                                                        isActive
                                                            ? 'bg-primary-600/20 text-primary-400 shadow-sm border border-primary-500/20'
                                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                    }`
                                                }
                                            >
                                                <span className="transition-transform group-hover:scale-110 mr-3 text-primary-500/80 group-hover:text-primary-400">{item.icon}</span>
                                                <span className="font-medium text-sm">{item.name}</span>
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950 mt-auto">
                <button
                    onClick={logout}
                    className="flex w-full items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-red-600/20 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-600/30"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
