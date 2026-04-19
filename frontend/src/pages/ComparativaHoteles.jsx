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
    PieChart as PieIcon
} from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';

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
        ...(data?.plaza.map(p => p.label) || []),
        ...(data?.colonial.map(c => c.label) || [])
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
        const p = data?.plaza.find(x => x.label === label) || { ingresos: 0, egresos: 0, margen: 0 };
        const c = data?.colonial.find(x => x.label === label) || { ingresos: 0, egresos: 0, margen: 0 };
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

    const totalPlaza = data?.plaza.reduce((acc, curr) => acc + curr.ingresos, 0) || 0;
    const totalColonial = data?.colonial.reduce((acc, curr) => acc + curr.ingresos, 0) || 0;
    const plazaExpenses = data?.plaza.reduce((acc, curr) => acc + curr.egresos, 0) || 0;
    const colonialExpenses = data?.colonial.reduce((acc, curr) => acc + curr.egresos, 0) || 0;

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

            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <HotelCard 
                    hotelName="Hotel Balcón Plaza"
                    income={totalPlaza}
                    expenses={plazaExpenses}
                    color="primary"
                />
                <HotelCard 
                    hotelName="Hotel Balcón Colonial"
                    income={totalColonial}
                    expenses={colonialExpenses}
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
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Margen de Ganancia (Plaza)</h3>
                    <div className="flex-1 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                <Bar dataKey="plazaMargen" name="Margen Netto" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Margen de Ganancia (Colonial)</h3>
                    <div className="flex-1 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                <Bar dataKey="colonialMargen" name="Margen Netto" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HotelCard = ({ hotelName, income, expenses, color }) => {
    const margin = income - expenses;
    const marginPercent = income > 0 ? (margin / income) * 100 : 0;
    const themeColor = color === 'primary' ? 'blue' : 'slate';

    return (
        <div className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden`}>
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${themeColor}-50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-4 bg-${themeColor}-50 text-${themeColor}-600 rounded-2xl`}>
                        <Hotel size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{hotelName}</h2>
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
