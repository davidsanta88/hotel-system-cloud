import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
    TrendingUp, 
    ArrowUpRight, 
    ArrowDownRight, 
    Hotel, 
    DollarSign, 
    Calendar,
    RefreshCw,
    Loader2,
    LayoutDashboard,
    Activity,
    Lock,
    Bell,
    Award,
    Trophy,
    Sparkles,
    AlertTriangle,
    Eye,
    MapPin,
    Zap,
    Users,
    Brush,
    Target,
    Heart,
    Crown,
    ShieldCheck,
    User,
    Building2,
    Clock,
    CheckCircle,
    Info,
    FileText,
    PieChart as PieChartIcon,
    BarChart3
} from 'lucide-react';
import { format, subDays, startOfMonth, differenceInDays, parseISO, addDays } from 'date-fns';

const PERIODOS = [
    { label: 'Hoy', getDates: () => ({ inicio: format(new Date(), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '7 días', getDates: () => ({ inicio: format(subDays(new Date(), 6), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '30 días', getDates: () => ({ inicio: format(subDays(new Date(), 29), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: 'Este mes', getDates: () => ({ inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'), fin: format(addDays(new Date(), 1), 'yyyy-MM-dd') }) },
    { label: '90 días', getDates: () => ({ inicio: format(subDays(new Date(), 89), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
];

const ComparativaHoteles = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [periodoActivo, setPeriodoActivo] = useState(3);
    const [dates, setDates] = useState(PERIODOS[3].getDates());
    const [statsConsolidadas, setStatsConsolidadas] = useState(null);

    useEffect(() => {
        fetchComparativeData();
        fetchConsolidatedStats();
    }, [dates]);

    const fetchConsolidatedStats = async () => {
        try {
            const response = await api.get(`/reportes/stats-consolidado?inicio=${dates.inicio}&fin=${dates.fin}`);
            setStatsConsolidadas(response.data);
        } catch (error) {
            console.error('Error fetching consolidated stats:', error);
        }
    };

    const fetchComparativeData = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/stats/comparative?inicio=${dates.inicio}&fin=${dates.fin}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching comparative stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const seleccionarPeriodo = (idx) => {
        setPeriodoActivo(idx);
        setDates(PERIODOS[idx].getDates());
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
    );

    const allLabels = Array.from(new Set([
        ...(data?.plaza?.history?.map(p => p.label) || []),
        ...(data?.colonial?.history?.map(c => c.label) || [])
    ])).sort((a, b) => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        if (months.includes(a) && months.includes(b)) {
            return months.indexOf(a) - months.indexOf(b);
        }
        try {
            const [da, ma] = a.split('/').map(Number);
            const [db, mb] = b.split('/').map(Number);
            if (ma !== mb) return ma - mb;
            return da - db;
        } catch (e) {
            return a.localeCompare(b);
        }
    });

    const chartData = allLabels.map(label => {
        const p = data?.plaza?.history?.find(x => x.label === label) || { ingresos: 0, egresos: 0, margen: 0 };
        const c = data?.colonial?.history?.find(x => x.label === label) || { ingresos: 0, egresos: 0, margen: 0 };
        return {
            name: label,
            plazaIngresos: p.ingresos,
            plazaEgresos: p.egresos,
            plazaMargen: p.margen,
            colonialIngresos: c.ingresos,
            colonialEgresos: c.egresos,
            colonialMargen: c.margen
        };
    });

    const totalPlaza = data?.plaza?.history?.reduce((acc, curr) => acc + curr.ingresos, 0) || 0;
    const totalColonial = data?.colonial?.history?.reduce((acc, curr) => acc + curr.ingresos, 0) || 0;
    const shopPlaza = data?.plaza?.history?.reduce((acc, curr) => acc + (curr.ventasTienda || 0), 0) || 0;
    const shopColonial = data?.colonial?.history?.reduce((acc, curr) => acc + (curr.ventasTienda || 0), 0) || 0;
    const plazaExpenses = data?.plaza?.history?.reduce((acc, curr) => acc + curr.egresos, 0) || 0;
    const colonialExpenses = data?.colonial?.history?.reduce((acc, curr) => acc + curr.egresos, 0) || 0;

    const totalGlobalIngresos = totalPlaza + totalColonial;
    const totalGlobalEgresos = plazaExpenses + colonialExpenses;
    const totalGlobalTienda = shopPlaza + shopColonial;
    const globalDisponibles = (data?.plaza?.rooms?.disponibles || 0) + (data?.colonial?.rooms?.disponibles || 0);
    const globalOcupadas = (data?.plaza?.rooms?.ocupadas || 0) + (data?.colonial?.rooms?.ocupadas || 0);
    const globalAseo = (data?.plaza?.rooms?.aseo || 0) + (data?.colonial?.rooms?.aseo || 0);

    const totalGlobalMargen = totalGlobalIngresos - totalGlobalEgresos;
    const globalMargenPercent = totalGlobalIngresos > 0 ? (totalGlobalMargen / totalGlobalIngresos) * 100 : 0;
    
    const diffDays = Math.max(1, differenceInDays(parseISO(dates.fin), parseISO(dates.inicio)) + 1);
    const globalDailyAvg = totalGlobalIngresos / diffDays;
    const globalExpensesAvg = totalGlobalEgresos / diffDays;
    const globalProfitAvg = globalDailyAvg - globalExpensesAvg;
    const plazaDailyAvg = totalPlaza / diffDays;
    const plazaExpensesAvg = plazaExpenses / diffDays;
    const plazaProfitAvg = plazaDailyAvg - plazaExpensesAvg;
    const colonialDailyAvg = totalColonial / diffDays;
    const colonialExpensesAvg = colonialExpenses / diffDays;
    const colonialProfitAvg = colonialDailyAvg - colonialExpensesAvg;
    
    const globalTotalHabitaciones = globalDisponibles + globalOcupadas + globalAseo;
    const globalOccupancyPercent = globalTotalHabitaciones > 0 ? (globalOcupadas / globalTotalHabitaciones) * 100 : 0;
    const globalFreePercent = globalTotalHabitaciones > 0 ? (globalDisponibles / globalTotalHabitaciones) * 100 : 0;
    const globalAseoPercent = globalTotalHabitaciones > 0 ? (globalAseo / globalTotalHabitaciones) * 100 : 0;
    
    const incomeMixData = [
        { name: 'Hotel Plaza', value: totalPlaza, color: '#2563eb' },
        { name: 'Hotel Colonial', value: totalColonial, color: '#6366f1' }
    ];

    const globalCashTotal = (data?.plaza?.cash?.efectivo || 0) + (data?.colonial?.cash?.efectivo || 0) + (data?.plaza?.cash?.nequi || 0) + (data?.colonial?.cash?.nequi || 0) + (data?.plaza?.cash?.bancolombia || 0) + (data?.colonial?.cash?.bancolombia || 0);
    const globalCashBase = (data?.plaza?.cash?.base || 0) + (data?.colonial?.cash?.base || 0);
    const globalCashTotalConBase = globalCashTotal + globalCashBase;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary-100 rounded-2xl text-primary-600">
                                <LayoutDashboard size={28} />
                            </div>
                            Comparativa de Hoteles
                        </h1>
                        <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-wider">Análisis entre Hotel Plaza y Hotel Colonial</p>
                    </div>
                    
                    <button 
                        onClick={() => window.location.href = '/caja-diaria-consolidada'}
                        className="flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 w-full md:w-auto"
                    >
                        <FileText size={18} />
                        Ver Detalle Diario
                    </button>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                            {PERIODOS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => seleccionarPeriodo(i)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${periodoActivo === i ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
                            <Calendar size={14} className="text-slate-400" />
                            <input type="date" className="bg-transparent text-[10px] font-bold border-none focus:ring-0 text-slate-700 p-0 w-24"
                                value={dates.inicio} onChange={e => { setDates({ ...dates, inicio: e.target.value }); setPeriodoActivo(-1); }} />
                            <span className="text-slate-300">→</span>
                            <input type="date" className="bg-transparent text-[10px] font-bold border-none focus:ring-0 text-slate-700 p-0 w-24"
                                value={dates.fin} onChange={e => { setDates({ ...dates, fin: e.target.value }); setPeriodoActivo(-1); }} />
                            <button onClick={fetchComparativeData} className="text-primary-600 hover:text-primary-800 transition" title="Actualizar">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN MAESTRA: MÉTRICAS CLAVE DE LA CADENA --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. LIQUIDEZ CONSOLIDADA (Mejorado) */}
                <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group border border-white/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                    
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-[1.5rem] shadow-inner border border-white/10">
                                <DollarSign size={32} className="text-white" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100/80">Liquidez Consolidada</span>
                                <h3 className="text-xl font-black tracking-tight">Total en Caja (+Base) Cadena</h3>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-6xl font-black tracking-tighter drop-shadow-2xl">
                                ${new Intl.NumberFormat().format(globalCashTotalConBase)}
                            </h2>
                            <div className="flex items-center gap-3 text-indigo-100/60 font-bold">
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-indigo-600 flex items-center justify-center text-[8px] font-black">PZ</div>
                                    <div className="w-6 h-6 rounded-full bg-indigo-400 border-2 border-indigo-600 flex items-center justify-center text-[8px] font-black">CL</div>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-black">Suma de todas las cajas y bases</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Hotel Plaza</p>
                                <p className="text-xl font-black">${new Intl.NumberFormat().format( (data?.plaza?.cash?.efectivo || 0) + (data?.plaza?.cash?.base || 0) + (data?.plaza?.cash?.nequi || 0) + (data?.plaza?.cash?.bancolombia || 0) )}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Hotel Colonial</p>
                                <p className="text-xl font-black">${new Intl.NumberFormat().format( (data?.colonial?.cash?.efectivo || 0) + (data?.colonial?.cash?.base || 0) + (data?.colonial?.cash?.nequi || 0) + (data?.colonial?.cash?.bancolombia || 0) )}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. OCUPACIÓN GRUPAL (NUEVO - Estilo imagen 1) */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between group transition-all hover:shadow-2xl">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ocupación Grupal</span>
                            <Users size={20} className="text-primary-500 opacity-20" />
                        </div>
                        
                        <div className="flex items-baseline gap-3">
                            <h2 className="text-7xl font-black tracking-tighter text-indigo-600">
                                {globalOccupancyPercent.toFixed(1)}%
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capacidad Total</span>
                        </div>
                    </div>

                    <div className="space-y-8 mt-10">
                        {/* Plaza Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Hotel Plaza</span>
                                <span className="text-sm font-black text-blue-600">{((data?.plaza?.rooms?.ocupadas / (data?.plaza?.rooms?.total || 1)) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-1 shadow-inner">
                                <div 
                                    className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all duration-1000 ease-out" 
                                    style={{ width: `${(data?.plaza?.rooms?.ocupadas / (data?.plaza?.rooms?.total || 1)) * 100}%` }} 
                                />
                            </div>
                        </div>

                        {/* Colonial Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Hotel Colonial</span>
                                <span className="text-sm font-black text-slate-600">{((data?.colonial?.rooms?.ocupadas / (data?.colonial?.rooms?.total || 1)) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-1 shadow-inner">
                                <div 
                                    className="h-full bg-slate-600 rounded-full shadow-[0_0_10px_rgba(71,85,105,0.3)] transition-all duration-1000 ease-out" 
                                    style={{ width: `${(data?.colonial?.rooms?.ocupadas / (data?.colonial?.rooms?.total || 1)) * 100}%` }} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Consolidado General (Restaurado) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Ingresos Globales */}
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Ingresos Globales</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black">${new Intl.NumberFormat().format(totalGlobalIngresos)}</h4>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                {/* 1b. Ventas Tienda Global */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Ventas Tienda Global</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black">${new Intl.NumberFormat().format(totalGlobalTienda)}</h4>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Zap size={24} />
                        </div>
                    </div>
                </div>

                {/* 2. Egresos Globales */}
                <div className="bg-gradient-to-br from-rose-600 to-rose-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-rose-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Egresos Globales</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-white">${new Intl.NumberFormat().format(totalGlobalEgresos)}</h4>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <ArrowDownRight size={24} />
                        </div>
                    </div>
                </div>

                {/* 3. Ganancia Global */}
                <div className={`p-8 rounded-[2.5rem] border shadow-sm ${totalGlobalMargen >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${totalGlobalMargen >= 0 ? 'text-emerald-600/60' : 'text-rose-600/60'}`}>Ganancia Global</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${totalGlobalMargen >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {globalMargenPercent.toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <h4 className={`text-3xl font-black ${totalGlobalMargen >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            ${new Intl.NumberFormat().format(totalGlobalMargen)}
                        </h4>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${totalGlobalMargen >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {totalGlobalMargen >= 0 ? <TrendingUp size={24} /> : <ArrowDownRight size={24} />}
                        </div>
                    </div>
                </div>

                {/* 4. Promedio Ingreso Diario */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Promedio Ingreso Diario</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black">${new Intl.NumberFormat().format(Math.round(globalDailyAvg))}</h4>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Activity size={24} />
                        </div>
                    </div>
                </div>

                {/* 5. Gasto Promedio Diario */}
                <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-orange-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Gasto Promedio Diario</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-white">${new Intl.NumberFormat().format(Math.round(globalExpensesAvg))}</h4>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <ArrowDownRight size={24} />
                        </div>
                    </div>
                </div>

                {/* 6. Ganancia Promedio Diario */}
                <div className={`p-8 rounded-[2.5rem] border shadow-sm ${globalProfitAvg >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${globalProfitAvg >= 0 ? 'text-indigo-600/60' : 'text-rose-600/60'}`}>Ganancia Promedio Diario</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <h4 className={`text-3xl font-black ${globalProfitAvg >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                            ${new Intl.NumberFormat().format(Math.round(globalProfitAvg))}
                        </h4>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${globalProfitAvg >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                            {globalProfitAvg >= 0 ? <TrendingUp size={24} /> : <ArrowDownRight size={24} />}
                        </div>
                    </div>
                </div>

                {/* Fila 2: Operativo */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hab. Libres Totales</p>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                            {globalFreePercent.toFixed(1)}% Disponibles
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-emerald-600">{globalDisponibles}</h4>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                            <Zap size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hab. Ocupadas Totales</p>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                            {globalOccupancyPercent.toFixed(1)}% Ocupación
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-rose-600">{globalOcupadas}</h4>
                        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hab. En Aseo Totales</p>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                            {globalAseoPercent.toFixed(1)}% En Aseo
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-amber-600">{globalAseo}</h4>
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                            <Brush size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN INTELIGENTE: PULSO DE LA CADENA --- */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pulso de la Cadena</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Análisis Comparativo Directo</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={16} /> Rendimiento de Ventas
                            </h4>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                    <div className="w-2 h-2 rounded-full bg-[#2563eb]" /> Plaza
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                    <div className="w-2 h-2 rounded-full bg-[#6366f1]" /> Colonial
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Total Ingresos', plaza: totalPlaza, colonial: totalColonial },
                                    { name: 'Ventas Tienda', plaza: shopPlaza, colonial: shopColonial },
                                    { name: 'Gastos', plaza: plazaExpenses, colonial: colonialExpenses }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val) => `$${new Intl.NumberFormat().format(val)}`}
                                    />
                                    <Bar dataKey="plaza" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={35} />
                                    <Bar dataKey="colonial" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={35} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-6">
                                <PieChartIcon size={16} /> Mix de Ingresos
                            </h4>
                            <div className="h-[200px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={incomeMixData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {incomeMixData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val) => `$${new Intl.NumberFormat().format(val)}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Ingresos</span>
                                    <span className="text-lg font-black text-slate-900 tracking-tighter">
                                        {((totalPlaza / (totalGlobalIngresos || 1)) * 100).toFixed(0)}% <span className="text-[9px] text-primary-600">PZ</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupación Plaza</span>
                                    <span className="text-sm font-black text-blue-600">{((data?.plaza?.rooms?.ocupadas / (data?.plaza?.rooms?.total || 1)) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(data?.plaza?.rooms?.ocupadas / (data?.plaza?.rooms?.total || 1)) * 100}%` }} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupación Colonial</span>
                                    <span className="text-sm font-black text-indigo-600">{((data?.colonial?.rooms?.ocupadas / (data?.colonial?.rooms?.total || 1)) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(data?.colonial?.rooms?.ocupadas / (data?.colonial?.rooms?.total || 1)) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <HotelCard 
                    hotelName="Hotel Balcón Plaza"
                    income={totalPlaza}
                    expenses={plazaExpenses}
                    dailyAvg={plazaDailyAvg}
                    expensesAvg={plazaExpensesAvg}
                    profitAvg={plazaProfitAvg}
                    shopSales={shopPlaza}
                    rooms={data?.plaza.rooms}
                    cash={data?.plaza.cash}
                    color="primary"
                />
                <HotelCard 
                    hotelName="Hotel Balcón Colonial"
                    income={totalColonial}
                    expenses={colonialExpenses}
                    dailyAvg={colonialDailyAvg}
                    expensesAvg={colonialExpensesAvg}
                    profitAvg={colonialProfitAvg}
                    shopSales={shopColonial}
                    rooms={data?.colonial.rooms}
                    cash={data?.colonial.cash}
                    color="slate"
                />
            </div>

            {/* Income Comparison Chart */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Comparativa de Ingresos</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Evolución de ingresos por hotel</p>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 10}}
                                tickFormatter={(val) => `$${new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(val)}`}
                            />
                            <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', padding: '16px' }}
                                formatter={(value) => [`$${new Intl.NumberFormat().format(value)}`, '']}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar name="Plaza" dataKey="plazaIngresos" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={25} />
                            <Bar name="Colonial" dataKey="colonialIngresos" fill="#64748b" radius={[6, 6, 0, 0]} barSize={25} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Profit Margin Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Plaza Profit Card */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Evolución de Margen (Plaza)</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Margen Neto por periodo</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen Total</p>
                            <p className="text-2xl font-black text-emerald-500">${new Intl.NumberFormat().format(totalPlaza - plazaExpenses)}</p>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPlazaMargen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10}}
                                    tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', padding: '16px' }}
                                    formatter={(value) => [`$${new Intl.NumberFormat().format(value)}`, 'Margen']}
                                />
                                <Area type="monotone" dataKey="plazaMargen" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorPlazaMargen)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Colonial Profit Card */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Evolución de Margen (Colonial)</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Margen Neto por periodo</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen Total</p>
                            <p className="text-2xl font-black text-indigo-500">${new Intl.NumberFormat().format(totalColonial - colonialExpenses)}</p>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorColonialMargen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10}}
                                    tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', padding: '16px' }}
                                    formatter={(value) => [`$${new Intl.NumberFormat().format(value)}`, 'Margen']}
                                />
                                <Area type="monotone" dataKey="colonialMargen" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorColonialMargen)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 4. Fidelidad de Clientes Consolidada */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] -rotate-12 translate-x-1/4">
                    <Heart size={200} />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-rose-50 text-rose-500 rounded-2xl">
                                <Heart size={24} />
                            </div>
                            Fidelidad de Clientes Consolidada
                        </h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Clientes con más visitas en ambas sedes</p>
                    </div>
                    <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                        Ver Todos los Clientes <Users size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {statsConsolidadas?.topClients?.slice(0, 5).map((client, idx) => (
                        <div key={idx} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:border-rose-200 hover:bg-white transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white rounded-2xl text-rose-500 shadow-sm group-hover:scale-110 transition-transform">
                                    <Crown size={20} />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitas</span>
                                    <p className="text-xl font-black text-slate-900 leading-none mt-1">{client.count}</p>
                                </div>
                            </div>
                            <h4 className="font-black text-slate-800 text-sm line-clamp-1 mb-1">{client.nombre}</h4>
                            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tighter">ID: {client.documento}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. Ranking de Procedencia (NUEVO) */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ranking de Procedencia</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">¿De dónde vienen nuestros clientes?</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsConsolidadas?.topOrigins?.slice(0, 8).map((origin, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                #{idx + 1}
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ciudad/Municipio</p>
                                <p className="text-sm font-black text-slate-800">{origin.nombre}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{origin.count} <span className="text-[9px]">Visitas</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fila de Módulos Inteligentes Consolidados */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 1. Panel de Alertas Globales */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Bell size={20} className="text-rose-500 animate-pulse" />
                                Alertas Globales
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Operatividad y Stock</p>
                        </div>
                        <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1 rounded-full border border-rose-100">
                            {(statsConsolidadas?.alerts || []).filter(a => a.type !== 'PRICE' && a.type !== 'TIME').length} ACTIVAS
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {(statsConsolidadas?.alerts || []).filter(a => a.type !== 'PRICE' && a.type !== 'TIME').length > 0 ? (
                            (statsConsolidadas?.alerts || []).filter(a => a.type !== 'PRICE' && a.type !== 'TIME').map((alert, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group">
                                    <div className={`p-2 rounded-xl shrink-0 ${
                                        alert.type === 'STOCK' ? 'bg-amber-100 text-amber-600' : 
                                        alert.type === 'PAGO' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {alert.type === 'STOCK' ? <Zap size={16} /> : alert.type === 'PAGO' ? <DollarSign size={16} /> : <Info size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{alert.hotel}</span>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase">Ahora</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 mt-0.5 line-clamp-2">{alert.message || alert.msg}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-2">
                                <Sparkles size={40} className="opacity-20" />
                                <p className="text-xs font-black uppercase tracking-widest">Sin alertas operativas</p>
                            </div>
                        )}
                    </div>
                </div>
                {/* 2. Pronóstico de Ingresos */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <Target size={120} />
                    </div>
                    
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="p-3 bg-white/20 rounded-2xl w-fit mb-6 backdrop-blur-md">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="text-xl font-black tracking-tight">Pronóstico de Ingresos</h3>
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Próximos 7 días (Reservas + Saldos)</p>
                        </div>

                        <div>
                            <div className="text-4xl font-black tracking-tighter mb-2">
                                ${new Intl.NumberFormat().format(statsConsolidadas?.forecast || 0)}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                                <TrendingUp size={12} />
                                ESTIMACIÓN BASADA EN DATOS
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Ranking Habitaciones Estrella */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Trophy size={20} className="text-amber-500" />
                                Habitaciones Estrella
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Top 5 más rentables</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        {statsConsolidadas?.rankingHabs?.slice(0, 5).map((hab, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                                    idx === 0 ? 'bg-amber-100 text-amber-600' : 
                                    idx === 1 ? 'bg-slate-100 text-slate-600' : 
                                    idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-black text-slate-700">Hab #{hab.numero} <span className="text-[9px] text-slate-400">({hab.hotel})</span></span>
                                        <span className="text-xs font-black text-emerald-600">${new Intl.NumberFormat().format(hab.income)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                hab.hotel === 'Plaza' ? 'bg-primary-500' : 'bg-slate-700'
                                            }`} 
                                            style={{ width: `${(hab.income / (statsConsolidadas?.rankingHabs?.[0]?.income || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sección de Auditoría de Tiempos (Check-outs Vencidos) */}
            <div className="mt-8 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-2xl">
                                <Clock size={24} />
                            </div>
                            Auditoría de Tiempos (Check-outs Vencidos)
                        </h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Huéspedes que han superado su hora de salida programada</p>
                    </div>
                    <div className="px-4 py-2 bg-rose-50 rounded-2xl border border-rose-100 text-right">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Vencimientos Hoy</p>
                        <p className="text-xl font-black text-rose-600">{(statsConsolidadas?.alerts || []).filter(a => a.type === 'TIME').length}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Hotel</th>
                                <th className="px-6 py-4">Check-out Programado</th>
                                <th className="px-6 py-4">Hab</th>
                                <th className="px-6 py-4">Huésped</th>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(statsConsolidadas?.alerts || []).filter(a => a.type === 'TIME').length > 0 ? (
                                (statsConsolidadas?.alerts || []).filter(a => a.type === 'TIME').map((alert, idx) => {
                                    const details = alert.details || {};
                                    return (
                                        <tr key={idx} className="bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group rounded-2xl">
                                            <td className="px-6 py-4 first:rounded-l-2xl">
                                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black text-white ${alert.hotel.includes('Plaza') ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-700 shadow-lg shadow-slate-100'}`}>
                                                    {alert.hotel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg w-fit">
                                                        {details.fechaSalidaProgramada ? format(parseISO(details.fechaSalidaProgramada), 'dd/MM/yyyy HH:mm') : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-black text-slate-900 text-sm">#{details.habitacion}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-black text-slate-700 text-xs uppercase tracking-tight">{details.huespedTitular}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {details.nombreEmpresa ? (
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                                        {details.nombreEmpresa}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 italic text-[10px] font-bold">Particular</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right last:rounded-r-2xl">
                                                <button 
                                                    onClick={() => {
                                                        const currentHost = window.location.hostname;
                                                        const targetIsPlaza = alert.hotel.includes('Plaza');
                                                        const isPlazaHost = currentHost.includes('plaza') || currentHost === 'localhost';
                                                        if (targetIsPlaza === isPlazaHost) {
                                                            navigate(`/mapa-habitaciones?search=${details.id}`);
                                                        } else {
                                                            const baseUrl = targetIsPlaza ? 'https://hotelbalconplaza.com' : 'https://hotelbalconcolonial.com';
                                                            window.location.href = `${baseUrl}/mapa-habitaciones?search=${details.id}`;
                                                        }
                                                    }}
                                                    className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all group-hover:scale-110 shadow-sm"
                                                    title="Ver en Mapa"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300 space-y-3">
                                            <CheckCircle size={48} className="opacity-20 text-emerald-500" />
                                            <p className="text-sm font-black uppercase tracking-widest">Todos los check-outs están al día</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Nueva Sección de Anomalías de Precio - Pantalla Completa abajo */}
            <div className="mt-8 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-2xl">
                                <AlertTriangle size={24} />
                            </div>
                            Auditoría de Anomalías de Precio
                        </h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Reporte detallado de desviaciones vs precios base recomendados</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-orange-50 rounded-2xl border border-orange-100">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">Casos Detectados</p>
                            <p className="text-xl font-black text-orange-600">{(statsConsolidadas?.alerts || []).filter(a => a.type === 'PRICE').length}</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Hotel</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Hab</th>
                                <th className="px-6 py-4">Huésped</th>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-6 py-4 text-right">Referencia</th>
                                <th className="px-6 py-4 text-right">Cobrado</th>
                                <th className="px-6 py-4 text-center">Desviación</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(statsConsolidadas?.alerts || []).filter(a => a.type === 'PRICE').length > 0 ? (
                                (statsConsolidadas?.alerts || []).filter(a => a.type === 'PRICE').map((alert, idx) => {
                                    const details = alert.details || {};
                                    return (
                                        <tr key={idx} className="bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group rounded-2xl">
                                            <td className="px-6 py-4 first:rounded-l-2xl">
                                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black text-white ${alert.hotel.includes('Plaza') ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-700 shadow-lg shadow-slate-100'}`}>
                                                    {alert.hotel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-500 text-xs">
                                                {details.fecha ? format(parseISO(details.fecha), 'dd/MM/yyyy HH:mm') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-black text-slate-900 text-sm">#{details.habitacion}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-700 text-xs uppercase tracking-tight">{details.huespedTitular}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{details.huespedes} personas</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {details.nombreEmpresa ? (
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                                        {details.nombreEmpresa}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 italic text-[10px] font-bold">Particular</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-slate-400 text-sm">${new Intl.NumberFormat().format(details.precioRecomendado || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-slate-900 text-sm">${new Intl.NumberFormat().format(details.precioCobrado || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-xl text-xs font-black shadow-sm">
                                                    -{details.diferenciaPct}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right last:rounded-r-2xl">
                                                <button 
                                                    onClick={() => {
                                                        const currentHost = window.location.hostname;
                                                        const targetIsPlaza = alert.hotel.includes('Plaza');
                                                        const isPlazaHost = currentHost.includes('plaza') || currentHost === 'localhost';
                                                        
                                                        // Si estamos en el mismo hotel, usamos navegación interna (SPA)
                                                        // De lo contrario, usamos URL absoluta
                                                        if (targetIsPlaza === isPlazaHost) {
                                                            navigate(`/mapa-habitaciones?search=${details.id}`);
                                                        } else {
                                                            const baseUrl = targetIsPlaza ? 'https://hotelbalconplaza.com' : 'https://hotelbalconcolonial.com';
                                                            window.location.href = `${baseUrl}/mapa-habitaciones?search=${details.id}`;
                                                        }
                                                    }}
                                                    className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all group-hover:scale-110 shadow-sm"
                                                    title="Ver en Mapa"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300 space-y-3">
                                            <ShieldCheck size={48} className="opacity-20" />
                                            <p className="text-sm font-black uppercase tracking-widest">No se han detectado anomalías de precio en este periodo</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


        </div>
    );
};

const HotelCard = ({ hotelName, income, expenses, dailyAvg, expensesAvg, profitAvg, shopSales, rooms, cash, color }) => {
    const margin = income - expenses;
    const marginPercent = income > 0 ? (margin / income) * 100 : 0;
    const themeColor = color === 'primary' ? 'blue' : 'slate';

    return (
        <div className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden`}>
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${themeColor}-50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 bg-${themeColor}-50 text-${themeColor}-600 rounded-2xl`}>
                            <Hotel size={28} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{hotelName}</h2>
                    </div>
                    
                    {/* Ocupación Badge */}
                    <div className="flex gap-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <div className="flex flex-col items-center px-2.5 border-r border-slate-200">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Libres</span>
                            <span className="text-xs font-black text-emerald-600 leading-none mt-1">{rooms?.disponibles || 0}</span>
                        </div>
                        <div className="flex flex-col items-center px-2.5 border-r border-slate-200">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Ocupadas</span>
                            <span className="text-xs font-black text-rose-600 leading-none mt-1">{rooms?.ocupadas || 0}</span>
                        </div>
                        <div className="flex flex-col items-center px-2.5">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Aseo</span>
                            <span className="text-xs font-black text-amber-600 leading-none mt-1">{rooms?.aseo || 0}</span>
                        </div>
                    </div>
                </div>

                {/* New Cash Summary Section in Card */}
                <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col items-center flex-1 border-r border-slate-200">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Efectivo</span>
                        <span className="text-xs font-black text-emerald-600">${new Intl.NumberFormat().format(cash?.efectivo || 0)}</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 border-r border-slate-200">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Nequi</span>
                        <span className="text-xs font-black text-indigo-600">${new Intl.NumberFormat().format(cash?.nequi || 0)}</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Bancolombia</span>
                        <span className="text-xs font-black text-blue-600">${new Intl.NumberFormat().format(cash?.bancolombia || 0)}</span>
                    </div>
                </div>

                {/* Total en Caja (+Base) Individual */}
                <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-white rounded-[2.5rem] border-2 border-indigo-100 flex items-center justify-between shadow-sm hover:border-indigo-200 transition-colors">
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total en Caja (+Base)</p>
                        <h4 className="text-3xl font-black text-indigo-600 tracking-tighter">
                            ${new Intl.NumberFormat().format((cash?.efectivo || 0) + (cash?.base || 0))}
                        </h4>
                    </div>
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Lock size={22} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos Totales</p>
                        <p className="text-3xl font-black text-slate-900">${new Intl.NumberFormat().format(income)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Egresos Totales</p>
                        <p className="text-3xl font-black text-slate-600">${new Intl.NumberFormat().format(expenses)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio Ingreso</p>
                        <p className="text-3xl font-black text-primary-600">${new Intl.NumberFormat().format(Math.round(dailyAvg))}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio Gasto</p>
                        <p className="text-3xl font-black text-orange-600">${new Intl.NumberFormat().format(Math.round(expensesAvg))}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Tienda</p>
                        <p className="text-3xl font-black text-indigo-600">${new Intl.NumberFormat().format(shopSales)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio Ganancia</p>
                        <p className={`text-3xl font-black ${profitAvg >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                            ${new Intl.NumberFormat().format(Math.round(profitAvg))}
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen Neto</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-black ${margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                ${new Intl.NumberFormat().format(margin)}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${margin >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {marginPercent.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className={`p-3 rounded-2xl ${margin >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        {margin >= 0 ? <TrendingUp size={24} /> : <ArrowDownRight size={24} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparativaHoteles;
