import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingCart,
    Calendar, Lightbulb, BarChart3, PieChart as PieIcon,
    RefreshCw, Package, Bed
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';

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

    // Datos
    const [ventasDiarias, setVentasDiarias] = useState([]);
    const [gastosDiarios, setGastosDiarios] = useState([]);
    const [hospedajeDiario, setHospedajeDiario] = useState([]);
    const [gastosCat, setGastosCat] = useState([]);
    const [ventasMensuales, setVentasMensuales] = useState([]);
    const [productosTop, setProductosTop] = useState([]);
    const [resumen, setResumen] = useState(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const q = `inicio=${dates.inicio}&fin=${dates.fin}`;
            const [rVentas, rGastos, rHosp, rCat, rMensual, rTop, rResumen] = await Promise.all([
                api.get(`/reportes/ventas?${q}`),
                api.get(`/reportes/gastos-periodo?${q}`),
                api.get(`/reportes/ingresos-hospedaje?${q}`),
                api.get(`/reportes/gastos-categoria?${q}`),
                api.get('/reportes/ventas-mensuales'),
                api.get('/reportes/productos-mas-vendidos'),
                api.get('/reportes/resumen'),
            ]);
            setVentasDiarias(rVentas.data);
            setGastosDiarios(rGastos.data);
            setHospedajeDiario(rHosp.data);
            setGastosCat(rCat.data);
            setVentasMensuales(rMensual.data);
            setProductosTop(rTop.data.slice(0, 8));
            setResumen(rResumen.data);
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
            map[key].ventas = parseFloat(d.gran_total) || 0;
        });
        gastosDiarios.forEach(d => {
            const key = d.fecha?.slice(0, 10);
            if (!map[key]) map[key] = { fecha: key, ventas: 0, gastos: 0, hospedaje: 0 };
            map[key].gastos = parseFloat(d.total_gastos) || 0;
        });
        hospedajeDiario.forEach(d => {
            const key = d.fecha?.slice(0, 10);
            if (!map[key]) map[key] = { fecha: key, ventas: 0, gastos: 0, hospedaje: 0 };
            map[key].hospedaje = parseFloat(d.total_hospedaje) || 0;
        });
        return Object.values(map).sort((a, b) => a.fecha.localeCompare(b.fecha));
    })();

    // KPIs
    const totalVentas = ventasDiarias.reduce((s, d) => s + (parseFloat(d.gran_total) || 0), 0);
    const totalGastos = gastosDiarios.reduce((s, d) => s + (parseFloat(d.total_gastos) || 0), 0);
    const totalHospedaje = hospedajeDiario.reduce((s, d) => s + (parseFloat(d.total_hospedaje) || 0), 0);
    const totalIngresos = totalVentas + totalHospedaje;
    const utilidadNeta = totalIngresos - totalGastos;
    const numVentas = ventasDiarias.reduce((s, d) => s + (parseInt(d.num_ventas) || 0), 0);

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
                            title="Ingresos Totales"
                            value={`$${formatCurrency(totalIngresos)}`}
                            sub="Ventas + Hospedaje"
                            icon={<DollarSign size={22} />}
                            color="primary"
                            trend={totalIngresos > 0}
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
                            sub={utilidadNeta >= 0 ? '✅ Positiva' : '⚠️ Negativa'}
                            icon={utilidadNeta >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                            color={utilidadNeta >= 0 ? 'green' : 'red'}
                            trend={utilidadNeta >= 0}
                        />
                        <KpiCard
                            title="Ventas Tienda"
                            value={`${numVentas}`}
                            sub={`$${formatCurrency(totalVentas)} recaudado`}
                            icon={<ShoppingCart size={22} />}
                            color="purple"
                            trend={totalVentas > 0}
                        />
                    </div>

                    {/* KPIs secundarios */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <h2 className="font-black text-gray-800 mb-1 flex items-center gap-2">
                            <TrendingUp size={18} className="text-indigo-500" /> Ingresos vs Gastos — Período seleccionado
                        </h2>
                        <p className="text-xs text-gray-400 mb-5">Comparación diaria entre todas las fuentes de ingreso y los gastos</p>
                        {lineData.length === 0 ? (
                            <div className="text-center py-16 text-gray-300 italic">No hay datos en este período</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
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

                        {/* Gastos por Categoría - PieChart */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-black text-gray-800 mb-1 flex items-center gap-2">
                                <PieIcon size={18} className="text-amber-500" /> Gastos por Categoría
                            </h2>
                            <p className="text-xs text-gray-400 mb-4">Distribución de gastos en el período seleccionado</p>
                            {gastosCat.length === 0 ? (
                                <div className="text-center py-16 text-gray-300 italic">No hay gastos registrados en este período</div>
                            ) : (
                                <div className="flex items-center gap-4">
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
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-700 truncate">{g.categoria}</p>
                                                    <p className="text-[10px] text-gray-400">${formatCurrency(g.total)} · {g.cantidad} reg.</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
