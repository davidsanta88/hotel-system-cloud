import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    Bed, 
    UserCheck, 
    CalendarDays, 
    DollarSign, 
    XCircle, 
    TrendingUp, 
    Activity, 
    Wrench, 
    Clock, 
    ShoppingBag, 
    PlusCircle, 
    Wallet, 
    CalendarPlus,
    BarChart3,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import moment from 'moment-timezone';

const Dashboard = () => {
    const [stats, setStats] = useState({
        habitacionesDisponibles: 0,
        habitacionesOcupadas: 0,
        registrosHoy: 0,
        ventasHoy: 0,
        ingresosHoy: 0,
        egresosHoy: 0,
        recientes: { registros: [], ventas: [] },
        historial: [],
        top_productos: [],
        mantenimientos_pendientes: 0,
        llegadas_proximas: []
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await api.get('/reportes/resumen');
                setStats({
                    ...data,
                    habitacionesDisponibles: data.hab_disponibles || 0,
                    habitacionesOcupadas: data.hab_ocupadas || 0,
                    registrosHoy: data.registros_hoy || 0,
                    ventasHoy: data.ventas_hoy || 0,
                    ingresosHoy: data.ingresos_hoy || 0,
                    egresosHoy: data.egresos_hoy || 0,
                    recientes: data.recientes || { registros: [], ventas: [] },
                    historial: data.historial || [],
                    top_productos: data.top_productos || [],
                    mantenimientos_pendientes: data.mantenimientos_pendientes || 0,
                    llegadas_proximas: data.llegadas_proximas || []
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const occupancyRate = useMemo(() => {
        const total = stats.habitacionesDisponibles + stats.habitacionesOcupadas;
        return total > 0 ? ((stats.habitacionesOcupadas / total) * 100).toFixed(0) : 0;
    }, [stats]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50/50">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
            </div>
            <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Sincronizando Sistema...</p>
        </div>
    );

    const quickActions = [
        { label: 'Nueva Venta', icon: <ShoppingBag size={18}/>, path: '/tienda', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
        { label: 'Registrar Gasto', icon: <Wallet size={18}/>, path: '/gastos-ingresos', color: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
        { label: 'Nueva Reserva', icon: <CalendarPlus size={18}/>, path: '/mapa-habitaciones', color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
        { label: 'Mapa Consolidado', icon: <BarChart3 size={18}/>, path: '/mapa-habitaciones-consolidado', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Top Bar / Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bienvenido al Panel de Control</h1>
                    <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-indigo-400" /> {moment().tz('America/Bogota').format('dddd, D [de] MMMM')}
                    </p>
                </div>
                
                {/* Gauge de Ocupación */}
                <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <div className="relative w-20 h-20">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * occupancyRate) / 100}
                                className="text-indigo-600 transition-all duration-1000 ease-out" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-black text-slate-900">{occupancyRate}%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupación Actual</p>
                        <p className="text-xs font-bold text-slate-600">{stats.habitacionesOcupadas} de {stats.habitacionesDisponibles + stats.habitacionesOcupadas} Habitaciones</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, i) => (
                    <button 
                        key={i}
                        onClick={() => navigate(action.path)}
                        className={`flex items-center justify-between p-5 rounded-3xl transition-all active:scale-95 shadow-sm border border-transparent hover:shadow-md ${action.color}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/50 rounded-xl">{action.icon}</div>
                            <span className="text-sm font-black uppercase tracking-tight">{action.label}</span>
                        </div>
                        <ChevronRight size={18} />
                    </button>
                ))}
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-indigo-100 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl group-hover:scale-110 transition-transform"><Bed size={28}/></div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">Libres</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-4xl font-black text-slate-900">{stats.habitacionesDisponibles}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1">Disponibles Ahora</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-rose-100 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl group-hover:scale-110 transition-transform"><TrendingUp size={28}/></div>
                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">Flujo Caja</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-4xl font-black text-slate-900">${formatCurrency(stats.ingresosHoy)}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1">Ingresos de Hoy</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-amber-100 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-amber-50 text-amber-600 rounded-3xl group-hover:scale-110 transition-transform"><Wrench size={28}/></div>
                        <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-full uppercase">Mantenimiento</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-4xl font-black text-slate-900">{stats.mantenimientos_pendientes}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1">Tareas Pendientes</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-sky-100 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-sky-50 text-sky-600 rounded-3xl group-hover:scale-110 transition-transform"><UserCheck size={28}/></div>
                        <span className="text-[10px] font-black text-sky-500 bg-sky-50 px-3 py-1 rounded-full uppercase">Mañana</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-4xl font-black text-slate-900">{stats.llegadas_proximas.length}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1">Próximas Llegadas</p>
                    </div>
                </div>
            </div>

            {/* Charts and Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Health Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Salud Financiera (7 Días)</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Ingresos vs Gastos</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full" /><span className="text-[10px] font-black uppercase">Ingresos</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-400 rounded-full" /><span className="text-[10px] font-black uppercase">Gastos</span></div>
                        </div>
                    </div>
                    
                    <div className="relative h-64 flex items-end justify-between gap-2 px-2">
                        {stats.historial.map((day, i) => {
                            const max = Math.max(...stats.historial.map(d => Math.max(d.ingresos, d.egresos)), 1000);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group">
                                    <div className="w-full flex items-end gap-1 justify-center h-48">
                                        <div 
                                            className="w-3 bg-indigo-500 rounded-t-lg transition-all duration-700 hover:brightness-110" 
                                            style={{ height: `${(day.ingresos / max) * 100}%` }}
                                        />
                                        <div 
                                            className="w-3 bg-rose-400 rounded-t-lg transition-all duration-700 hover:brightness-110" 
                                            style={{ height: `${(day.egresos / max) * 100}%` }}
                                        />
                                    </div>
                                    <span className="mt-4 text-[9px] font-black text-slate-400 uppercase">{moment(day.fecha).format('DD MMM')}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-6">Top Ventas Tienda</h2>
                    <div className="space-y-6">
                        {stats.top_productos.length > 0 ? stats.top_productos.map((prod, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-xl text-xs font-black italic">{i+1}</div>
                                    <div>
                                        <p className="text-sm font-black uppercase truncate w-32">{prod.nombre}</p>
                                        <div className="h-1 w-20 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                                            <div className="h-full bg-indigo-400" style={{ width: `${(prod.total / stats.top_productos[0].total) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-lg font-black text-indigo-400">{prod.total} <small className="text-[10px] opacity-50 uppercase">und</small></span>
                            </div>
                        )) : (
                            <p className="text-white/30 text-xs italic font-medium uppercase text-center py-20 tracking-widest">Sin ventas registradas</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Arrivals */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Próximos en Llegar</h2>
                        <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-full text-[10px] font-black uppercase tracking-widest">A 48 Horas</span>
                    </div>
                    <div className="space-y-4">
                        {stats.llegadas_proximas.length > 0 ? stats.llegadas_proximas.map((res, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-sky-600"><UserCheck size={20}/></div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 uppercase">{res.cliente}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Llega el {moment(res.fecha).format('DD [de] MMMM')} • {res.noches} Noches
                                        </p>
                                    </div>
                                </div>
                                <ArrowUpRight className="text-slate-300" size={20} />
                            </div>
                        )) : (
                            <p className="text-slate-300 text-center py-10 uppercase font-black text-[10px] tracking-widest">No hay llegadas programadas</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity (Combined) */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Actividad Reciente</h2>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase">En Vivo</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {stats.recientes.registros.slice(0, 4).map((reg, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-500"><PlusCircle size={16}/></div>
                                    <div>
                                        <p className="text-xs font-black text-slate-700 uppercase">Check-in: {reg.cliente}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Habitación {reg.habitacion} • {moment(reg.fecha).fromNow()}</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">Exitoso</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
