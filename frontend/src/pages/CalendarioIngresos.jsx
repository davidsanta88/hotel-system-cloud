import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    TrendingUp, 
    TrendingDown, 
    DollarSign,
    Activity,
    Building2,
    RefreshCw
} from 'lucide-react';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    startOfWeek, 
    endOfWeek, 
    isSameMonth, 
    isSameDay, 
    addMonths, 
    subMonths,
    getDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../utils/format';

const CalendarioIngresos = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [dailyData, setDailyData] = useState({});
    const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'consolidated'

    useEffect(() => {
        fetchData();
    }, [currentDate, viewMode]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const mes = format(currentDate, 'M');
            const anio = format(currentDate, 'yyyy');
            const endpoint = viewMode === 'individual' 
                ? `/reportes/ingresos-calendario?anio=${anio}&mes=${mes}`
                : `/reportes/ingresos-calendario-consolidado?anio=${anio}&mes=${mes}`;
            
            const res = await api.get(endpoint);
            if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
                setDailyData(res.data);
            } else {
                setDailyData({});
            }
        } catch (error) {
            console.error('Error fetching calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Stats calculation for the summary cards
    const stats = Object.values(dailyData).reduce((acc, curr) => {
        const val = curr.balance || curr.total || 0;
        acc.totalMes += val;
        if (val > acc.mejorDia) acc.mejorDia = val;
        if (curr.egresos && curr.egresos > acc.mayorGasto) acc.mayorGasto = curr.egresos;
        if (val > 0) acc.diasGanancia += 1;
        else if (val < 0) acc.diasPerdida += 1;
        return acc;
    }, { totalMes: 0, mejorDia: 0, mayorGasto: 0, diasGanancia: 0, diasPerdida: 0 });

    const totalDiasConMovimiento = stats.diasGanancia + stats.diasPerdida;
    const pctGanancia = totalDiasConMovimiento > 0 ? Math.round((stats.diasGanancia / totalDiasConMovimiento) * 100) : 0;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <CalendarIcon size={24} />
                        </div>
                        Calendario de Rendimiento
                    </h1>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider italic">Monitoreo diario de flujo de caja</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                        <button 
                            onClick={() => setViewMode('individual')}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'individual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            ESTE HOTEL
                        </button>
                        <button 
                            onClick={() => setViewMode('consolidated')}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'consolidated' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            CONSOLIDADO
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-4 text-sm font-black text-gray-800 uppercase min-w-[140px] text-center">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    
                    <button onClick={fetchData} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Summary Cards (Moved to Top) */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <TrendingUp className="text-emerald-400" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60">Mejor Día</p>
                            <p className="text-lg font-black">{formatCurrency(stats.mejorDia)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <TrendingDown className="text-rose-400" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60">Mayor Gasto</p>
                            <p className="text-lg font-black">{formatCurrency(stats.mayorGasto)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <DollarSign className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60">Total Mes</p>
                            <p className={`text-lg font-black ${stats.totalMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(stats.totalMes)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                            <span className="text-emerald-400 text-lg font-black">{stats.diasGanancia}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60">Días Ganancia</p>
                            <p className="text-[10px] text-emerald-400 font-bold">{pctGanancia}% del periodo</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-500/20 rounded-xl">
                            <span className="text-rose-400 text-lg font-black">{stats.diasPerdida}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60">Días Pérdida</p>
                            <div className="mt-1 h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pctGanancia}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Day Names */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-gray-100">
                    {dayNames.map(day => (
                        <div key={day} className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 auto-rows-fr">
                    {days.map((day, idx) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const data = dailyData[dateKey];
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div 
                                key={idx} 
                                className={`min-h-[120px] p-2 border-r border-b border-gray-50 flex flex-col transition-all hover:bg-slate-50/50 group ${!isCurrentMonth ? 'bg-gray-50/30' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg ${
                                        isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 
                                        isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                                    }`}>
                                        {format(day, 'd')}
                                    </span>
                                    {data && (
                                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${data.balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {data.balance >= 0 ? '↑ Ganancia' : '↓ Pérdida'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-1 mt-auto">
                                    {loading ? (
                                        <div className="space-y-1 animate-pulse">
                                            <div className="h-3 bg-gray-100 rounded w-full"></div>
                                            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                                        </div>
                                    ) : data ? (
                                        <>
                                            {viewMode === 'individual' ? (
                                                <>
                                                    <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Ing</span>
                                                        <span className="text-[10px] font-black text-emerald-600">+{formatCurrency(data.ingresos)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Egr</span>
                                                        <span className="text-[10px] font-black text-rose-500">-{formatCurrency(data.egresos)}</span>
                                                    </div>
                                                    <div className="mt-1 pt-1 border-t border-gray-100 flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Neto</span>
                                                        <span className={`text-xs font-black ${data.balance >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
                                                            {formatCurrency(data.balance)}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Plaza</span>
                                                        <span className="text-[10px] font-black text-indigo-600">{formatCurrency(data.plaza)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Colonial</span>
                                                        <span className="text-[10px] font-black text-orange-500">{formatCurrency(data.colonial)}</span>
                                                    </div>
                                                    <div className="mt-1 pt-1 border-t border-gray-100 flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total</span>
                                                        <span className="text-xs font-black text-slate-900">{formatCurrency(data.total)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : isCurrentMonth ? (
                                        <div className="h-full flex items-center justify-center opacity-10 grayscale">
                                            <Activity size={24} className="text-gray-300" />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarioIngresos;
