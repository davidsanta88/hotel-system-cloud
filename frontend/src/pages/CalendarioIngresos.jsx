import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    TrendingUp, 
    TrendingDown, 
    DollarSign,
    Activity,
    RefreshCw,
    X,
    ArrowUpRight,
    ArrowDownRight,
    Coffee,
    Home,
    PlusCircle
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
    parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../utils/format';

const CalendarioIngresos = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [dailyData, setDailyData] = useState({});
    const [searchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState(searchParams.get('mode') === 'consolidated' ? 'consolidated' : 'individual');
    
    // Modal State
    const [selectedDay, setSelectedDay] = useState(null);
    const [dayDetails, setDayDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'consolidated') {
            setViewMode('consolidated');
        } else if (mode === 'individual') {
            setViewMode('individual');
        }
    }, [searchParams]);

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

    const handleDayClick = async (dateKey, dayData) => {
        if (!dayData || viewMode === 'consolidated') return;
        
        setSelectedDay(dateKey);
        setLoadingDetails(true);
        try {
            const res = await api.get(`/reportes/detalle-dia-calendario?fecha=${dateKey}`);
            setDayDetails(res.data);
        } catch (error) {
            console.error('Error fetching day details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const getDayValue = (d) => {
        if (!d) return null;
        return viewMode === 'individual' ? (d.balance ?? 0) : (d.total ?? 0);
    };

    // Global Stats for current month
    const stats = Object.entries(dailyData).reduce((acc, [key, curr]) => {
        const dayDate = parseISO(key);
        if (!isSameMonth(dayDate, currentDate)) return acc;

        const val = getDayValue(curr);
        acc.totalMes += val;
        if (val > acc.mejorDia) acc.mejorDia = val;

        if (viewMode === 'individual') {
            if (curr.egresos && curr.egresos > acc.mayorGasto) acc.mayorGasto = curr.egresos;
            acc.hospedaje += curr.fuentes?.hospedaje || 0;
            acc.ventas += curr.fuentes?.ventas || 0;
            acc.otros += curr.fuentes?.otros || 0;
        } else {
            const absNeg = val < 0 ? Math.abs(val) : 0;
            if (absNeg > acc.mayorGasto) acc.mayorGasto = absNeg;
        }

        if (val > 0) acc.diasGanancia += 1;
        else if (val < 0) acc.diasPerdida += 1;
        return acc;
    }, { totalMes: 0, mejorDia: 0, mayorGasto: 0, diasGanancia: 0, diasPerdida: 0, hospedaje: 0, ventas: 0, otros: 0 });

    const totalIngresosMes = stats.hospedaje + stats.ventas + stats.otros;
    const totalDiasConMovimiento = stats.diasGanancia + stats.diasPerdida;
    const pctGanancia = totalDiasConMovimiento > 0 ? Math.round((stats.diasGanancia / totalDiasConMovimiento) * 100) : 0;

    // Heatmap intensity calculator
    const getIntensityClass = (value, isPositive) => {
        if (value === null) return '';
        const absVal = Math.abs(value);
        const threshold = isPositive ? stats.mejorDia / 2 : stats.mayorGasto / 2;
        
        if (isPositive) {
            if (absVal > threshold) return 'bg-emerald-100 border-emerald-200';
            return 'bg-emerald-50 border-emerald-100';
        } else {
            if (absVal > threshold) return 'bg-rose-100 border-rose-200';
            return 'bg-rose-50 border-rose-100';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <CalendarIcon size={24} />
                        </div>
                        Calendario de Flujo
                    </h1>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider italic">Análisis de rendimiento diario</p>
                </div>

                {/* Sources Breakdown (Only individual) */}
                {viewMode === 'individual' && totalIngresosMes > 0 && (
                    <div className="hidden lg:flex items-center gap-6 px-6 border-x border-gray-100">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase">Origen de Ingresos</p>
                            <div className="flex gap-1 mt-1 h-2 w-48 bg-gray-100 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full" style={{ width: `${(stats.hospedaje/totalIngresosMes)*100}%` }} title="Hospedaje"></div>
                                <div className="bg-amber-500 h-full" style={{ width: `${(stats.ventas/totalIngresosMes)*100}%` }} title="Ventas POS"></div>
                                <div className="bg-emerald-500 h-full" style={{ width: `${(stats.otros/totalIngresosMes)*100}%` }} title="Otros"></div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] font-bold text-gray-600 uppercase">Hosp.</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span className="text-[10px] font-bold text-gray-600 uppercase">Tienda</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 w-full md:w-auto">
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

            {/* Summary Cards */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <TrendingUp className="text-emerald-400" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60">Mejor Día</p>
                            <p className="text-lg font-black text-emerald-400">{formatCurrency(stats.mejorDia)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-500/10 rounded-xl">
                            <TrendingDown className="text-rose-400" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60">Mayor Gasto</p>
                            <p className="text-lg font-black text-rose-400">{formatCurrency(stats.mayorGasto)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <DollarSign className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60">Flujo Neto Mes</p>
                            <p className={`text-xl font-black ${stats.totalMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(stats.totalMes)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/20 rounded-xl min-w-[48px] flex justify-center border border-emerald-500/30">
                            <span className="text-emerald-400 text-lg font-black">{stats.diasGanancia}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60">Días Ganancia</p>
                            <p className="text-[10px] text-emerald-400 font-bold">{pctGanancia}% del periodo</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-500/20 rounded-xl min-w-[48px] flex justify-center border border-rose-500/30">
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

                        const dayValue = getDayValue(data);
                        const isPositive = dayValue !== null && dayValue > 0;
                        const isNegative = dayValue !== null && dayValue < 0;

                        const intensityClass = isCurrentMonth ? getIntensityClass(dayValue, isPositive || !isNegative) : '';

                        return (
                            <div 
                                key={idx} 
                                onClick={() => handleDayClick(dateKey, data)}
                                className={`min-h-[130px] p-2 border-r border-b flex flex-col transition-all group relative cursor-pointer ${
                                    !isCurrentMonth
                                        ? 'bg-gray-50/40 border-gray-100'
                                        : intensityClass || 'bg-white border-gray-50 hover:bg-slate-50/50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${
                                        isToday
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                            : isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                                    }`}>
                                        {format(day, 'd')}
                                    </span>
                                    {data && dayValue !== null && (
                                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase shadow-sm ${
                                            isPositive
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-rose-500 text-white'
                                        }`}>
                                            {isPositive ? '↑ Ganancia' : '↓ Pérdida'}
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
                                                <div className="p-1.5 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50">
                                                    <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                                        <span className="text-[9px] font-bold text-gray-500 uppercase">Ing</span>
                                                        <span className="text-[10px] font-black text-emerald-700">+{formatCurrency(data.ingresos)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                                        <span className="text-[9px] font-bold text-gray-500 uppercase">Egr</span>
                                                        <span className="text-[10px] font-black text-rose-600">-{formatCurrency(data.egresos)}</span>
                                                    </div>
                                                    <div className="mt-1 pt-1 border-t border-black/5 flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-tighter italic">Neto</span>
                                                        <span className={`text-xs font-black ${isPositive ? 'text-emerald-800' : 'text-rose-800'}`}>
                                                            {formatCurrency(data.balance)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-1.5 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50">
                                                    <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                                        <span className="text-[9px] font-bold text-gray-500 uppercase">Plaza</span>
                                                        <span className={`text-[10px] font-black ${(data.plaza ?? 0) >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                                                            {formatCurrency(data.plaza)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                                        <span className="text-[9px] font-bold text-gray-500 uppercase">Colonial</span>
                                                        <span className={`text-[10px] font-black ${(data.colonial ?? 0) >= 0 ? 'text-orange-600' : 'text-rose-700'}`}>
                                                            {formatCurrency(data.colonial)}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 pt-1 border-t border-black/5 flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">Total</span>
                                                        <span className={`text-xs font-black ${isPositive ? 'text-emerald-800' : 'text-rose-800'}`}>
                                                            {formatCurrency(data.total)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : isCurrentMonth ? (
                                        <div className="h-full flex items-center justify-center opacity-10 grayscale group-hover:opacity-30 transition-opacity">
                                            <Activity size={24} className="text-gray-300" />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Day Detail Modal */}
            {selectedDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100">
                        {/* Modal Header */}
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">Detalle de Operación</h2>
                                <p className="text-indigo-300 text-sm font-bold mt-1">
                                    {format(parseISO(selectedDay), 'EEEE, d de MMMM yyyy', { locale: es })}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedDay(null)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                            {loadingDetails ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Analizando transacciones...</p>
                                </div>
                            ) : dayDetails.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <Activity size={48} className="mx-auto text-gray-200 mb-4" />
                                    <p className="text-gray-400 font-bold">No hubo movimientos registrados en esta fecha.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {dayDetails.map((item, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow group">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${
                                                    item.monto > 0 
                                                        ? 'bg-emerald-50 text-emerald-600' 
                                                        : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {item.tipo === 'HOSPEDAJE' && <Home size={20} />}
                                                    {item.tipo === 'VENTA' && <Coffee size={20} />}
                                                    {item.tipo === 'RESERVA' && <CalendarIcon size={20} />}
                                                    {item.tipo === 'INGRESO' && <PlusCircle size={20} />}
                                                    {item.tipo === 'GASTO' && <ArrowDownRight size={20} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                                                            {item.tipo}
                                                        </span>
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase italic">
                                                            {item.medio}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-black text-gray-800 mt-0.5">{item.descripcion}</p>
                                                </div>
                                            </div>
                                            <div className={`text-lg font-black shrink-0 ${
                                                item.monto > 0 ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                                {item.monto > 0 ? '+' : ''}{formatCurrency(item.monto)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Total Ingresos</p>
                                    <p className="text-emerald-600 font-black text-sm">+{formatCurrency(dayDetails.filter(i => i.monto > 0).reduce((s, i) => s + i.monto, 0))}</p>
                                </div>
                                <div className="text-center border-l pl-4">
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Total Egresos</p>
                                    <p className="text-rose-600 font-black text-sm">-{formatCurrency(Math.abs(dayDetails.filter(i => i.monto < 0).reduce((s, i) => s + i.monto, 0)))}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedDay(null)}
                                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarioIngresos;
