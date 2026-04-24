import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, AreaChart, Area
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
    PieChart as PieIcon,
    Users,
    Zap,
    Brush,
    Activity
} from 'lucide-react';
import { format, subDays, startOfMonth, differenceInDays, parseISO } from 'date-fns';

const PERIODOS = [
    { label: 'Hoy', getDates: () => ({ inicio: format(new Date(), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '7 días', getDates: () => ({ inicio: format(subDays(new Date(), 6), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '30 días', getDates: () => ({ inicio: format(subDays(new Date(), 29), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: 'Este mes', getDates: () => ({ inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '90 días', getDates: () => ({ inicio: format(subDays(new Date(), 89), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
];

const ComparativaHoteles = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dates, setDates] = useState(PERIODOS[2].getDates()); // 30 días por defecto
    const [periodoActivo, setPeriodoActivo] = useState(2);

    useEffect(() => {
        fetchComparativeData();
    }, [dates]);

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

    // Prepare chart data by merging labels from both hotels
    const allLabels = Array.from(new Set([
        ...(data?.plaza?.history?.map(p => p.label) || []),
        ...(data?.colonial?.history?.map(c => c.label) || [])
    ])).sort((a, b) => {
        // Sort labels correctly (DD/MM or Month names)
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        if (months.includes(a) && months.includes(b)) {
            return months.indexOf(a) - months.indexOf(b);
        }
        
        // DD/MM sorting
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
    const plazaExpenses = data?.plaza?.history?.reduce((acc, curr) => acc + curr.egresos, 0) || 0;
    const colonialExpenses = data?.colonial?.history?.reduce((acc, curr) => acc + curr.egresos, 0) || 0;

    // Totales Consolidados
    const totalGlobalIngresos = totalPlaza + totalColonial;
    const totalGlobalEgresos = plazaExpenses + colonialExpenses;
    const globalDisponibles = (data?.plaza?.rooms?.disponibles || 0) + (data?.colonial?.rooms?.disponibles || 0);
    const globalOcupadas = (data?.plaza?.rooms?.ocupadas || 0) + (data?.colonial?.rooms?.ocupadas || 0);
    const globalAseo = (data?.plaza?.rooms?.aseo || 0) + (data?.colonial?.rooms?.aseo || 0);

    const totalGlobalMargen = totalGlobalIngresos - totalGlobalEgresos;
    const globalMargenPercent = totalGlobalIngresos > 0 ? (totalGlobalMargen / totalGlobalIngresos) * 100 : 0;
    
    // Cálculo de Promedio Diario
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

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
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
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Períodos rápidos */}
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
                        {/* Fechas personalizadas */}
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

            {/* Consolidado General */}
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

            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <HotelCard 
                    hotelName="Hotel Balcón Plaza"
                    income={totalPlaza}
                    expenses={plazaExpenses}
                    dailyAvg={plazaDailyAvg}
                    expensesAvg={plazaExpensesAvg}
                    profitAvg={plazaProfitAvg}
                    rooms={data?.plaza.rooms}
                    color="primary"
                />
                <HotelCard 
                    hotelName="Hotel Balcón Colonial"
                    income={totalColonial}
                    expenses={colonialExpenses}
                    dailyAvg={colonialDailyAvg}
                    expensesAvg={colonialExpensesAvg}
                    profitAvg={colonialProfitAvg}
                    rooms={data?.colonial.rooms}
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
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPlaza" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorColonial" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
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
                                tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', padding: '16px' }}
                                formatter={(value) => [`$${new Intl.NumberFormat().format(value)}`, '']}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Area name="Plaza" type="monotone" dataKey="plazaIngresos" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorPlaza)" />
                            <Area name="Colonial" type="monotone" dataKey="colonialIngresos" stroke="#64748b" strokeWidth={4} fillOpacity={1} fill="url(#colorColonial)" />
                        </AreaChart>
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
        </div>
    );
};

const HotelCard = ({ hotelName, income, expenses, dailyAvg, expensesAvg, profitAvg, rooms, color }) => {
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
