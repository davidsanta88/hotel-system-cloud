import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Bed, UserCheck, CalendarDays, DollarSign, XCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const Dashboard = () => {
    const [stats, setStats] = useState({
        habitacionesDisponibles: 0,
        habitacionesOcupadas: 0,
        registrosHoy: 0,
        ventasHoy: 0,
        ingresosHoy: 0,
        egresosHoy: 0,
        recientes: {
            registros: [],
            ventas: []
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await api.get('/reportes/resumen');
                setStats({
                    habitacionesDisponibles: data.hab_disponibles || 0,
                    habitacionesOcupadas: data.hab_ocupadas || 0,
                    registrosHoy: data.registros_hoy || 0,
                    ventasHoy: data.ventas_hoy || 0,
                    ingresosHoy: data.ingresos_hoy || 0,
                    egresosHoy: data.egresos_hoy || 0,
                    recientes: data.recientes || { registros: [], ventas: [] }
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 animate-pulse text-lg">Cargando estadísticas del hotel...</div>
        </div>
    );

    const cards = [
        { title: 'Hab. Disponibles', value: stats.habitacionesDisponibles, icon: <Bed size={32} />, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Hab. Ocupadas', value: stats.habitacionesOcupadas, icon: <UserCheck size={32} />, color: 'text-red-600', bg: 'bg-red-100' },
        { title: 'Registros (Día)', value: stats.registrosHoy, icon: <CalendarDays size={32} />, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Ingresos (Hoy)', value: `$${formatCurrency(stats.ingresosHoy)}`, icon: <DollarSign size={32} />, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { title: 'Egresos (Hoy)', value: `$${formatCurrency(stats.egresosHoy)}`, icon: <XCircle size={32} />, color: 'text-orange-600', bg: 'bg-orange-100' },
        { title: 'Ventas Tienda', value: `$${formatCurrency(stats.ventasHoy)}`, icon: <DollarSign size={32} />, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Resumen general del hotel</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {cards.map((card, idx) => (
                    <div key={idx} className="card p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <div className={`p-4 rounded-full ${card.bg} ${card.color}`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                        <span>Llegadas Recientes</span>
                        <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">Últimos 5</span>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 border-b border-gray-50">
                                    <th className="pb-2 font-medium">Huésped</th>
                                    <th className="pb-2 font-medium">Hab</th>
                                    <th className="pb-2 font-medium">Fecha</th>
                                    <th className="pb-2 font-medium">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.recientes.registros.length > 0 ? (
                                    stats.recientes.registros.map(r => (
                                        <tr key={r.id}>
                                            <td className="py-3 font-medium text-gray-700">{r.cliente}</td>
                                            <td className="py-3 text-gray-600">{r.habitacion}</td>
                                            <td className="py-3 text-gray-500 text-xs">
                                                {new Date(r.fecha).toLocaleDateString()}
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                                    r.estado === 'CHECK-IN' || r.estado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {r.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="py-4 text-center text-gray-400">No hay registros recientes</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                        <span>Ventas Recientes</span>
                        <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded">Últimos 5</span>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 border-b border-gray-50">
                                    <th className="pb-2 font-medium">Empleado</th>
                                    <th className="pb-2 font-medium">Total</th>
                                    <th className="pb-2 font-medium">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.recientes.ventas.length > 0 ? (
                                    stats.recientes.ventas.map(v => (
                                        <tr key={v.id}>
                                            <td className="py-3 font-medium text-gray-700">{v.empleado}</td>
                                            <td className="py-3 font-bold text-gray-900">${formatCurrency(v.total)}</td>
                                            <td className="py-3 text-gray-500 text-xs text-right whitespace-nowrap">
                                                {new Date(v.fecha).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="py-4 text-center text-gray-400">No hay ventas recientes</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
