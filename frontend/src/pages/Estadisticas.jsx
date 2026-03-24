import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { 
    TrendingUp, 
    Users, 
    DollarSign, 
    PieChart as PieIcon, 
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    RefreshCw,
    Download
} from 'lucide-react';

const Estadisticas = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/estadisticas/dashboard');
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
    );

    const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-primary-600" size={40} />
                        Métricas Avanzadas
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Análisis profundo del rendimiento hotelero y financiero</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchStats}
                        className="bg-white border border-slate-200 p-3 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
                        title="Refrescar datos"
                    >
                        <RefreshCw size={20} className="text-slate-600" />
                    </button>
                    <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 active:scale-95">
                        <Download size={16} />
                        Exportar Reporte
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                    title="Ocupación" 
                    value={`${stats?.occupancyRate || 0}%`} 
                    subtitle={`${stats?.occupiedRooms} / ${stats?.totalRooms} Habitaciones`} 
                    icon={<Users className="text-blue-600" />}
                    trend="+5.2%"
                    trendUp={true}
                />
                <Card 
                    title="RevPAR" 
                    value={`$${new Intl.NumberFormat().format(stats?.revpar || 0)}`} 
                    subtitle="Ingreso por hab. disponible" 
                    icon={<TrendingUp className="text-emerald-600" />}
                    trend="+12%"
                    trendUp={true}
                />
                <Card 
                    title="ADR" 
                    value={`$${new Intl.NumberFormat().format(stats?.adr || 0)}`} 
                    subtitle="Tarifa promedio diaria" 
                    icon={<DollarSign className="text-amber-600" />}
                    trend="-2.1%"
                    trendUp={false}
                />
                <Card 
                    title="Ingresos" 
                    value={`$${new Intl.NumberFormat().format(stats?.monthlyRevenue?.[stats.monthlyRevenue.length - 1]?.revenue || 0)}`} 
                    subtitle="Total facturado mes actual" 
                    icon={<PieIcon className="text-indigo-600" />}
                    trend="+8%"
                    trendUp={true}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Evolución de Ingresos</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Últimos 6 meses (Registros + Ventas)</p>
                        </div>
                        <Calendar size={20} className="text-slate-300" />
                    </div>
                    
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.monthlyRevenue}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="mes" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase'}} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10}} 
                                    tickFormatter={(val) => `$${val/1000}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(value) => [`$${new Intl.NumberFormat().format(value)}`, 'Ingreso']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Ocupación Actual</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Por tipo de habitación</p>
                    </div>

                    <div className="h-[250px] w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.typeDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="cantidad"
                                >
                                    {stats?.typeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-slate-900">{stats?.occupancyRate}%</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global</span>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        {stats?.typeDistribution.map((item, index) => (
                            <div key={item.nombre} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-xs font-bold text-slate-600">{item.nombre}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">{item.cantidad} hab.</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sub-KPIs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-primary-500 transition-colors duration-500">
                            <TrendingUp size={24} />
                        </div>
                        <h4 className="text-lg font-black tracking-tight leading-tight">Potencial de Crecimiento</h4>
                        <p className="text-white/60 text-sm leading-relaxed">Considera ajustar tus tarifas (ADR) durante fines de semana para maximizar el RevPAR sin comprometer la ocupación.</p>
                        <button className="text-[10px] font-black uppercase tracking-widest text-primary-400 hover:text-white transition-colors">Ver sugerencias de Revenue Management →</button>
                    </div>
                    {/* Abstract background shape */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 flex flex-col justify-center space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">RevPAR Teórico</h4>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">$${new Intl.NumberFormat().format((stats?.adr || 0) * 0.85)}</p>
                        <p className="text-xs text-slate-500 font-medium">Alcanzable con 85% de ocupación</p>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 rounded-full" style={{ width: '65%' }} />
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><PieIcon size={20} /></div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Rendimiento Mensual</h4>
                    </div>
                    <div className="space-y-4">
                        <MetricBar label="Servicios Extra" value="24%" color="bg-indigo-500" />
                        <MetricBar label="Hospedaje" value="68%" color="bg-slate-900" />
                        <MetricBar label="Otros" value="8%" color="bg-slate-200" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Card = ({ title, value, subtitle, icon, trend, trendUp }) => (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trend}
            </div>
        </div>
        <div className="space-y-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
    </div>
);

const MetricBar = ({ label, value, color }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-900">{value}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: value }} />
        </div>
    </div>
);

export default Estadisticas;
