import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingCart,
    Calendar, Lightbulb, BarChart3, PieChart as PieIcon,
    RefreshCw, Package, Bed, Globe, Monitor, Smartphone, MapPin, 
    Clock, User, ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { format, subDays, startOfMonth, subMonths, differenceInDays, parseISO } from 'date-fns';
import VisitorMap from '../components/VisitorMap';

// Paleta de colores corporativos del hotel
const COLORS = ['#0070bb', '#fdb913', '#00a651', '#ed1c24', '#662d91', '#00a3ff', '#e5a500', '#1c0f05'];
const COLOR_VENTAS = '#0070bb'; // Azul Balcón
const COLOR_GASTOS = '#ed1c24'; // Rojo Balcón
const COLOR_HOSPEDAJE = '#00a651'; // Verde Balcón

// Formateadores para tooltips
const tooltipFormatter = (value) => [`$${formatCurrency(value)}`, ''];
const labelFormatter = (label) => `Fecha: ${label}`;

// Tooltip personalizado
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-3 text-sm">
                <p className="font-bold text-gray-700 mb-1 text-xs">{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} style={{ color: entry.color }} className="font-semibold">
                        {entry.name}: <span className="text-gray-900">${formatCurrency(entry.value)}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Períodos rápidos
const PERIODOS = [
    { label: 'Hoy', getDates: () => ({ inicio: format(new Date(), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '7 días', getDates: () => ({ inicio: format(subDays(new Date(), 6), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '30 días', getDates: () => ({ inicio: format(subDays(new Date(), 29), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: 'Este mes', getDates: () => ({ inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '90 días', getDates: () => ({ inicio: format(subDays(new Date(), 89), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
];

const Reports = () => {
    const [dates, setDates] = useState(PERIODOS[2].getDates());
    const [periodoActivo, setPeriodoActivo] = useState(2);
    const [loading, setLoading] = useState(true);
    const [mainChartType, setMainChartType] = useState('bar');
    const [pieChartType, setPieChartType] = useState('pie');

    // Datos
    const [ventasDiarias, setVentasDiarias] = useState([]);
    const [gastosDiarios, setGastosDiarios] = useState([]);
    const [hospedajeDiario, setHospedajeDiario] = useState([]);
    const [manualIncomesDiarios, setManualIncomesDiarios] = useState([]);
    const [gastosCat, setGastosCat] = useState([]);
    const [ventasMensuales, setVentasMensuales] = useState([]);
    const [productosTop, setProductosTop] = useState([]);
    const [resumen, setResumen] = useState(null);
    const [analyticsStats, setAnalyticsStats] = useState(null);
    const [huespedesReport, setHuespedesReport] = useState(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const q = `inicio=${dates.inicio}&fin=${dates.fin}`;
        
        // Peticiones individuales para que una falla no bloquee a las demás
        const fetchItem = async (url) => {
            try {
                const res = await api.get(url);
                return res.data;
            } catch (err) {
                console.error(`Error en reporte ${url}:`, err);
                return Array.isArray(await api.defaults.baseURL) ? [] : null; // Fallback seguro
            }
        };

        try {
            const [rVentas, rGastos, rHosp, rCat, rMensual, rTop, rResumen, rManual, rAnalytics, rHuespedes] = await Promise.all([
                fetchItem(`/reportes/ventas?${q}`),
                fetchItem(`/reportes/gastos-periodo?${q}`),
                fetchItem(`/reportes/ingresos-hospedaje?${q}`),
                fetchItem(`/reportes/gastos-categoria?${q}`),
                fetchItem(`/reportes/ventas-mensuales`),
                fetchItem(`/reportes/productos-mas-vendidos`),
                fetchItem(`/reportes/resumen`),
                fetchItem(`/reportes/ingresos-manuales?${q}`),
                fetchItem(`/analytics/stats?${q}`),
                fetchItem(`/reportes/huespedes?${q}`),
            ]);

            setVentasDiarias(rVentas || []);
            setGastosDiarios(rGastos || []);
            setHospedajeDiario(rHosp || []);
            setManualIncomesDiarios(rManual || []);
            setGastosCat(rCat || []);
            setVentasMensuales(rMensual || []);
            setProductosTop((rTop || []).slice(0, 8));
            setResumen(rResumen);
            setAnalyticsStats(rAnalytics);
            setHuespedesReport(rHuespedes);
        } catch (e) {
            console.error('Error cargando analytics:', e);
        } finally {
            setLoading(false);
        }
    }, [dates]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Combinar datos de línea temporal
    const lineData = (() => {
        const map = {};
        ventasDiarias.forEach(d => {
            const key = d.fecha?.slice(0, 10);
            if (!map[key]) map[key] = { fecha: key, ventas: 0, gastos: 0, hospedaje: 0 };
            map[key].ventas += parseFloat(d.gran_total) || 0;
        });
        gastosDiarios.forEach(d => {
            const key = d.fecha?.slice(0, 10);
            if (!map[key]) map[key] = { fecha: key, ventas: 0, gastos: 0, hospedaje: 0 };
            map[key].gastos += parseFloat(d.total_gastos) || 0;
        });
        hospedajeDiario.forEach(d => {
            const key = d.fecha?.slice(0, 10);
            if (!map[key]) map[key] = { fecha: key, ventas: 0, gastos: 0, hospedaje: 0 };
            map[key].hospedaje += parseFloat(d.total_hospedaje) || 0;
        });
        manualIncomesDiarios.forEach(d => {
            const key = d.fecha?.slice(0, 10);
            if (!map[key]) map[key] = { fecha: key, ventas: 0, gastos: 0, hospedaje: 0 };
            map[key].hospedaje += parseFloat(d.total_ingresos) || 0;
        });
        return Object.values(map).sort((a, b) => a.fecha.localeCompare(b.fecha));
    })();

    // KPIs
    const totalVentas = ventasDiarias.reduce((s, d) => s + (parseFloat(d.gran_total) || 0), 0);
    const totalGastos = gastosDiarios.reduce((s, d) => s + (parseFloat(d.total_gastos) || 0), 0);
    const totalHospedaje = hospedajeDiario.reduce((s, d) => s + (parseFloat(d.total_hospedaje) || 0), 0);
    const totalManualIncomes = manualIncomesDiarios.reduce((s, d) => s + (parseFloat(d.total_ingresos) || 0), 0);
    const totalIngresos = totalVentas + totalHospedaje + totalManualIncomes;
    const utilidadNeta = totalIngresos - totalGastos;
    const numVentas = ventasDiarias.reduce((s, d) => s + (parseInt(d.num_ventas) || 0), 0);
    
    // Cálculo de promedios
    const numDias = differenceInDays(parseISO(dates.fin), parseISO(dates.inicio)) + 1;
    const ingresoPromedio = numDias > 0 ? totalIngresos / numDias : totalIngresos;

    // Insights
    const mejorDia = lineData.length > 0
        ? lineData.reduce((a, b) => (a.ventas + a.hospedaje) > (b.ventas + b.hospedaje) ? a : b, lineData[0])
        : null;
    const peorDia = lineData.length > 0
        ? lineData.reduce((a, b) => (a.ventas + a.hospedaje) < (b.ventas + b.hospedaje) ? a : b, lineData[0])
        : null;
    const alerta = utilidadNeta < 0;

    const seleccionarPeriodo = (idx) => {
        setPeriodoActivo(idx);
        setDates(PERIODOS[idx].getDates());
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header con filtro de fechas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <BarChart3 className="text-indigo-500" size={26} /> Analytics & Reportes
                        </h1>
                        <p className="text-gray-400 text-sm mt-0.5">Visualiza ventas, gastos y toma decisiones informadas</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Períodos rápidos */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                            {PERIODOS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => seleccionarPeriodo(i)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${periodoActivo === i ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {/* Fechas personalizadas */}
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                            <Calendar size={14} className="text-gray-400" />
                            <input type="date" className="bg-transparent text-xs border-none focus:ring-0 text-gray-700"
                                value={dates.inicio} onChange={e => { setDates({ ...dates, inicio: e.target.value }); setPeriodoActivo(-1); }} />
                            <span className="text-gray-300">→</span>
                            <input type="date" className="bg-transparent text-xs border-none focus:ring-0 text-gray-700"
                                value={dates.fin} onChange={e => { setDates({ ...dates, fin: e.target.value }); setPeriodoActivo(-1); }} />
                            <button onClick={fetchAll} className="text-indigo-600 hover:text-indigo-800 transition" title="Actualizar">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24 text-gray-400">
                    <RefreshCw size={32} className="animate-spin mr-3" /> Cargando datos...
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            title="Ventas Totales"
                            value={`$${formatCurrency(totalIngresos)}`}
                            sub="Consolidado de todas las fuentes"
                            icon={<DollarSign size={22} />}
                            color="primary"
                            trend={totalIngresos > 0}
                        />
                        <KpiCard
                            title="Ventas Tienda"
                            value={`$${formatCurrency(totalVentas)}`}
                            sub={`${numVentas} transacciones realizadas`}
                            icon={<ShoppingCart size={22} />}
                            color="indigo"
                            trend={totalVentas > 0}
                        />
                        <KpiCard
                            title="Total Gastos"
                            value={`$${formatCurrency(totalGastos)}`}
                            sub={`${gastosDiarios.reduce((s, d) => s + (parseInt(d.num_gastos) || 0), 0)} registros`}
                            icon={<TrendingDown size={22} />}
                            color="red"
                            trend={null}
                        />
                        <KpiCard
                            title="Utilidad Neta"
                            value={`$${formatCurrency(Math.abs(utilidadNeta))}`}
                            sub={utilidadNeta >= 0 ? '✅ Flujo Positivo' : '⚠️ Revisar Egresos'}
                            icon={utilidadNeta >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                            color={utilidadNeta >= 0 ? 'green' : 'red'}
                            trend={utilidadNeta >= 0}
                        />
                    </div>

                    {/* KPIs secundarios */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Ingreso Promedio</p>
                                <p className="text-lg font-black text-gray-900">${formatCurrency(ingresoPromedio)}<span className="text-[10px] text-gray-400 font-normal">/día</span></p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                <Bed size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Hospedaje</p>
                                <p className="text-lg font-black text-gray-900">${formatCurrency(totalHospedaje)}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Otros Ingresos</p>
                                <p className="text-lg font-black text-gray-900">${formatCurrency(totalManualIncomes)}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Total Huéspedes</p>
                                <p className="text-lg font-black text-gray-900">{huespedesReport?.totalHuespedes ?? '—'}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Promedio Huéspedes</p>
                                <p className="text-lg font-black text-gray-900">{huespedesReport?.promedioHuespedes?.toFixed(1) ?? '—'}<span className="text-[10px] text-gray-400 font-normal">/día</span></p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Hab. Ocupadas</p>
                                <p className="text-lg font-black text-gray-900">{resumen?.hab_ocupadas ?? '—'}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Alertas Stock</p>
                                <p className="text-lg font-black text-gray-900">{resumen?.alertas_stock ?? '—'}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alerta ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                <Lightbulb size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Margen</p>
                                <p className={`text-lg font-black ${alerta ? 'text-red-600' : 'text-gray-900'}`}>
                                    {totalIngresos > 0 ? `${((utilidadNeta / totalIngresos) * 100).toFixed(1)}%` : '—'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Gráfica principal: Línea temporal */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                            <div>
                                <h2 className="font-black text-gray-800 mb-1 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-indigo-500" /> Ingresos vs Gastos — Período seleccionado
                                </h2>
                                <p className="text-xs text-gray-400">Comparación diaria entre todas las fuentes de ingreso y los gastos</p>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                                <button onClick={() => setMainChartType('line')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mainChartType === 'line' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Líneas</button>
                                <button onClick={() => setMainChartType('bar')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mainChartType === 'bar' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Barras</button>
                            </div>
                        </div>

                        {lineData.length === 0 ? (
                            <div className="text-center py-16 text-gray-300 italic">No hay datos en este período</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                {mainChartType === 'line' ? (
                                    <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${formatCurrency(v)}`} width={80} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line type="monotone" dataKey="ventas" name="Ventas Tienda" stroke={COLOR_VENTAS} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                        <Line type="monotone" dataKey="hospedaje" name="Hospedaje" stroke={COLOR_HOSPEDAJE} strokeWidth={2.5} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="gastos" name="Gastos" stroke={COLOR_GASTOS} strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 3 }} />
                                    </LineChart>
                                ) : (
                                    <BarChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${formatCurrency(v)}`} width={80} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="ventas" name="Ventas Tienda" fill={COLOR_VENTAS} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="hospedaje" name="Hospedaje" fill={COLOR_HOSPEDAJE} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="gastos" name="Gastos" fill={COLOR_GASTOS} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Ventas mensuales - BarChart */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-black text-gray-800 mb-1 flex items-center gap-2">
                                <BarChart3 size={18} className="text-indigo-500" /> Ventas — Últimos 6 Meses
                            </h2>
                            <p className="text-xs text-gray-400 mb-5">Tendencia mensual de ingresos por tienda</p>
                            {ventasMensuales.length === 0 ? (
                                <div className="text-center py-16 text-gray-300 italic">Sin datos</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={ventasMensuales} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="mes_nombre" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${formatCurrency(v)}`} width={80} />
                                        <Tooltip formatter={(v) => [`$${formatCurrency(v)}`, 'Total Ventas']} />
                                        <Bar dataKey="total_ventas" name="Ventas" fill={COLOR_VENTAS} radius={[6, 6, 0, 0]}>
                                            {ventasMensuales.map((_, i) => (
                                                <Cell key={i} fill={i === ventasMensuales.length - 1 ? '#818cf8' : COLOR_VENTAS} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Gastos por Categoría */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                                <div>
                                    <h2 className="font-black text-gray-800 mb-1 flex items-center gap-2">
                                        <PieIcon size={18} className="text-amber-500" /> Gastos por Categoría
                                    </h2>
                                    <p className="text-xs text-gray-400">Distribución de gastos en el período</p>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto shrink-0">
                                    <button onClick={() => setPieChartType('pie')} className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${pieChartType === 'pie' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Torta</button>
                                    <button onClick={() => setPieChartType('bar')} className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${pieChartType === 'bar' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Barras</button>
                                </div>
                            </div>
                            
                            {gastosCat.length === 0 ? (
                                <div className="text-center py-16 text-gray-300 italic flex-1">No hay gastos registrados en este período</div>
                            ) : (
                                pieChartType === 'pie' ? (
                                    <div className="flex items-center gap-4 flex-1">
                                        <ResponsiveContainer width="55%" height={200}>
                                            <PieChart>
                                                <Pie data={gastosCat} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                                    dataKey="total" nameKey="categoria" paddingAngle={3}>
                                                    {gastosCat.map((_, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v) => [`$${formatCurrency(v)}`, 'Total']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[200px]">
                                            {gastosCat.map((g, i) => (
                                                <div key={i} className="flex items-center gap-2 border-b border-gray-50 pb-1 last:border-0">
                                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-gray-700 truncate" title={g.categoria}>{g.categoria}</p>
                                                        <p className="text-[10px] text-gray-400">${formatCurrency(g.total)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 mt-2">
                                        <ResponsiveContainer width="100%" height={230}>
                                            <BarChart data={gastosCat} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000)}k`} />
                                                <YAxis type="category" dataKey="categoria" width={100} tick={{ fontSize: 10 }} />
                                                <Tooltip formatter={(v) => [`$${formatCurrency(v)}`, 'Gasto']} />
                                                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                                    {gastosCat.map((_, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Top Productos */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-black text-gray-800 mb-1 flex items-center gap-2">
                            <Package size={18} className="text-orange-500" /> Top Productos Más Vendidos
                        </h2>
                        <p className="text-xs text-gray-400 mb-5">Tienda + Consumos de habitación combinados</p>
                        {productosTop.length === 0 ? (
                            <div className="text-center py-16 text-gray-300 italic">Sin datos</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={productosTop} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="nombre" width={160} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v, n) => [n === 'total_vendido' ? `${v} uds` : `$${formatCurrency(v)}`, n === 'total_vendido' ? 'Unidades' : 'Recaudado']} />
                                    <Legend />
                                    <Bar dataKey="total_vendido" name="Unidades vendidas" fill="#f59e0b" radius={[0, 6, 6, 0]}>
                                        {productosTop.map((_, i) => (
                                            <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Panel de Insights */}
                    <div className={`rounded-2xl border p-6 ${alerta ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-100'}`}>
                        <h2 className="font-black text-gray-800 mb-3 flex items-center gap-2">
                            <Lightbulb size={18} className={alerta ? 'text-red-500' : 'text-indigo-500'} /> Insights Automáticos
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {alerta && (
                                <div className="bg-red-100 border border-red-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-red-700 uppercase mb-1">⚠️ Alerta Financiera</p>
                                    <p className="text-sm text-red-800">Los gastos superan los ingresos en <strong>${formatCurrency(Math.abs(utilidadNeta))}</strong>. Revisa los egresos.</p>
                                </div>
                            )}
                            {mejorDia && (
                                <div className="bg-green-100 border border-green-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-green-700 uppercase mb-1">🚀 Mejor Día</p>
                                    <p className="text-sm text-green-900">
                                        <strong>{mejorDia.fecha}</strong> con ingresos de <strong>${formatCurrency(mejorDia.ventas + mejorDia.hospedaje)}</strong>
                                    </p>
                                </div>
                            )}
                            {peorDia && mejorDia?.fecha !== peorDia?.fecha && (
                                <div className="bg-yellow-100 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-yellow-700 uppercase mb-1">📉 Día Más Bajo</p>
                                    <p className="text-sm text-yellow-900">
                                        <strong>{peorDia.fecha}</strong> con ingresos de <strong>${formatCurrency(peorDia.ventas + peorDia.hospedaje)}</strong>
                                    </p>
                                </div>
                            )}
                            <div className="bg-white border border-gray-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">📊 Resumen Período</p>
                                <p className="text-sm text-gray-700">
                                    <strong>{numVentas}</strong> ventas en tienda · Margen neto:{' '}
                                    <strong className={utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {totalIngresos > 0 ? `${((utilidadNeta / totalIngresos) * 100).toFixed(1)}%` : '—'}
                                    </strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sección de Tráfico Web (Nueva) */}
                    <div className="border-t border-gray-100 pt-10 mt-10">
                        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                            <Globe className="text-blue-500" size={24} /> Tráfico de la Página Web
                        </h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Mapa de Visitas (Nuevo) */}
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                                <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Globe size={16} className="text-blue-500" /> Distribución Geográfica
                                </h3>
                                <p className="text-xs text-gray-400 mb-6">Visualización de tráfico global y local</p>
                                <div className="flex-1">
                                    <VisitorMap markers={analyticsStats?.topCities || []} />
                                </div>
                            </div>

                            {/* Gráfico de Ciudades */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <MapPin size={16} className="text-blue-500" /> Ciudades más activas
                                </h3>
                                <p className="text-xs text-gray-400 mb-6">Ranking de ubicaciones</p>
                                {analyticsStats?.topCities?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={analyticsStats.topCities} layout="vertical" margin={{ left: 20 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="nombre" width={100} tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Bar dataKey="valor" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="py-20 text-center text-gray-300 italic text-sm">Esperando registros de visitas...</div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {/* Columna Izquierda: KPIs y Dispositivos */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                                {/* Visitas Hoy */}
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-widest opacity-80">
                                                Visitas Hoy
                                            </h3>
                                            <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> En Vivo
                                            </span>
                                        </div>
                                        <p className="text-5xl font-black mb-1">{analyticsStats?.summary?.today || 0}</p>
                                        <p className="text-blue-100 text-xs font-medium">
                                            {analyticsStats?.summary?.yesterday > 0 
                                                ? `${(((analyticsStats.summary.today - analyticsStats.summary.yesterday) / analyticsStats.summary.yesterday) * 100).toFixed(1)}% vs ayer (${analyticsStats.summary.yesterday})`
                                                : 'Iniciando registros históricos'
                                            }
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Uso de Dispositivos */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <Monitor size={16} className="text-gray-400" /> Dispositivos
                                    </h3>
                                    <div className="space-y-4">
                                        {(analyticsStats?.devices?.length > 0) ? analyticsStats.devices.map((d, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.tipo === 'mobile' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    {d.tipo === 'mobile' ? <Smartphone size={16} /> : <Monitor size={16} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="capitalize font-bold text-gray-600">{d.tipo}</span>
                                                        <span className="text-gray-400 font-bold">{d.valor}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden border border-gray-100">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${d.tipo === 'mobile' ? 'bg-purple-500' : 'bg-blue-500'}`} 
                                                            style={{ width: `${(d.valor / (analyticsStats.summary?.total || 1) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-4 text-gray-300 italic text-xs">Sin datos capturados</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* TABLA DE VISITAS RECIENTES (NUEVA - PARA VALIDACIÓN DE IP/MUNICIPIO) */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <Clock size={16} className="text-indigo-500" /> Registro de Visitas Recientes
                                        </h3>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tight">Validación en tiempo real de IP y procedencia</p>
                                    </div>
                                    <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                        <ShieldCheck size={12} /> Datos Verificados
                                    </div>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                                    <table className="w-full text-left border-collapse sticky-header">
                                        <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10 shadow-sm">
                                            <tr>
                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">IP Detectada</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Municipio / Ciudad</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dispositivo</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ruta</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 uppercase tracking-tight">
                                            {analyticsStats?.recentVisits?.length > 0 ? analyticsStats.recentVisits.map((v, i) => {
                                                const isLocal = v.city === 'Localhost' || v.ip === '127.0.0.1';
                                                return (
                                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-gray-700">{v.timestamp ? format(new Date(v.timestamp), 'HH:mm:ss') : '--:--'}</span>
                                                                <span className="text-[10px] text-gray-400">{v.timestamp ? format(new Date(v.timestamp), 'dd MMM') : '---'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border ${isLocal ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                                {isLocal ? 'LOCALHOST' : (v.ip || '0.0.0.0')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[8px] ${isLocal ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-500'}`}>
                                                                    {v.countryCode || '??'}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-black text-gray-800">{v.city || 'Desconocida'}</span>
                                                                    <span className="text-[10px] text-gray-400 font-medium">{v.region || '—'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-xs text-gray-600 font-bold capitalize">
                                                                {v.device === 'mobile' ? <Smartphone size={14} className="text-purple-400" /> : <Monitor size={14} className="text-blue-400" />}
                                                                {v.device}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-[11px] text-indigo-500 font-bold lowercase">{v.path}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-300 italic text-sm">
                                                        No hay visitas registradas recientemente
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Componente KPI Card
const KpiCard = ({ title, value, sub, icon, color, trend }) => {
    const colors = {
        indigo: 'bg-primary-100 text-primary-600',
        primary: 'bg-primary-100 text-primary-600',
        red: 'bg-hotel-red/10 text-hotel-red',
        green: 'bg-hotel-green/10 text-hotel-green',
        purple: 'bg-hotel-purple/10 text-hotel-purple',
        accent: 'bg-accent-100 text-accent-700',
        amber: 'bg-accent-100 text-accent-700',
    };
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color] || colors.primary}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                <p className="text-xl font-black text-gray-900 truncate">{value}</p>
                {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
};

export default Reports;
