import React, { useState } from 'react';
import { 
    Book, 
    Settings, 
    Download, 
    FileText, 
    Code, 
    Database, 
    Server, 
    Layout, 
    Shield, 
    Smartphone, 
    Users, 
    Hotel, 
    Calendar, 
    ShoppingBag, 
    PieChart, 
    ArrowRight,
    CheckCircle,
    Info,
    Layers,
    Activity,
    Cpu,
    LogOut,
    MousePointer2,
    DollarSign,
    Box,
    Clock,
    Zap,
    Loader2
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

const Manuales = () => {
    const [activeTab, setActiveTab] = useState('usuario');
    const [expandedStep, setExpandedStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    const dummyData = [
        { name: 'Lun', ingresos: 4000, gastos: 2400 },
        { name: 'Mar', ingresos: 3000, gastos: 1398 },
        { name: 'Mie', ingresos: 2000, gastos: 9800 },
        { name: 'Jue', ingresos: 2780, gastos: 3908 },
        { name: 'Vie', ingresos: 1890, gastos: 4800 },
        { name: 'Sab', ingresos: 2390, gastos: 3800 },
        { name: 'Dom', ingresos: 3490, gastos: 4300 },
    ];

    const checkinSteps = [
        {
            title: 'Selección de Habitación',
            desc: 'En el Mapa Visual, localice una habitación en color VERDE (Disponible) y haga clic sobre ella.',
            icon: <MousePointer2 className="text-blue-500" />
        },
        {
            title: 'Datos del Huésped',
            desc: 'Complete el formulario con el documento del titular. Si el cliente ya existe, sus datos se cargarán automáticamente.',
            icon: <Users className="text-purple-500" />
        },
        {
            title: 'Configuración de Estancia',
            desc: 'Defina la fecha de salida estimada y el valor por noche. Agregue acompañantes si es necesario.',
            icon: <Calendar className="text-orange-500" />
        },
        {
            title: 'Confirmación y Llaves',
            desc: 'Haga clic en "Guardar Registro". La habitación cambiará a ROJO (Ocupada) y podrá imprimir el comprobante.',
            icon: <Zap className="text-emerald-500" />
        }
    ];

    const downloadPDF = async () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF();
            const primaryColor = [15, 23, 42];
            let currentY = 45;

            const getBase64ImageFromURL = (url) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.setAttribute('crossOrigin', 'anonymous');
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            const dataURL = canvas.toDataURL('image/png');
                            resolve(dataURL);
                        } catch (e) {
                            console.warn("Canvas export failed (CORS?):", e);
                            resolve(null);
                        }
                    };
                    img.onerror = () => {
                        console.warn(`Could not load image at ${url}`);
                        resolve(null);
                    };
                    img.src = url;
                    setTimeout(() => resolve(null), 4000);
                });
            };

            const addHeader = (title, subtitle) => {
                doc.setFillColor(...primaryColor); 
                doc.rect(0, 0, 210, 35, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text(title, 15, 18);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(subtitle, 15, 26);
            };

            if (activeTab === 'usuario') {
                addHeader('MANUAL INTEGRAL DE USUARIO', 'Sistema de Gestión Balcón Plaza v3.5 - Operación y Administración');
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(14); doc.setFont('helvetica', 'bold');
                doc.text('I. VISUALIZACIÓN GENERAL Y MAPA', 15, currentY);
                currentY += 5;
                
                const roomMapImg = await getBase64ImageFromURL(window.location.origin + '/manual/room_map.png');
                if (roomMapImg) {
                    try {
                        doc.addImage(roomMapImg, 'PNG', 15, currentY, 180, 70);
                        currentY += 75;
                    } catch (e) {
                        console.warn("doc.addImage failed:", e);
                        currentY += 10;
                    }
                } else {
                    currentY += 10;
                }

                autoTable(doc, {
                    startY: currentY,
                    head: [['ESTADO', 'SIGNIFICADO Y ACCIÓN']],
                    body: [
                        ['VERDE (Disponible)', 'Habitación libre. Haga clic para registrar un nuevo huésped.'],
                        ['ROJO (Ocupada)', 'Habitación con huésped. Haga clic para ver saldo, pagos o hacer Check-out.'],
                        ['AMARILLO (Reservada)', 'Bloqueada por una reserva que ingresa el día de hoy.'],
                        ['AZUL (Por Asear)', 'Check-out realizado. Requiere limpieza para volver a estar disponible.'],
                    ],
                    theme: 'striped',
                    headStyles: { fillColor: [0, 163, 255] }
                });

                doc.addPage();
                addHeader('GESTIÓN MULTI-HOTEL Y ANALÍTICA', 'Control Centralizado de la Cadena');
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12); doc.setFont('helvetica', 'bold');
                doc.text('1. Comparativa de Hoteles (Business Intelligence)', 15, 45);
                
                doc.setFontSize(9); doc.setFont('helvetica', 'normal');
                const biText = 'Este módulo permite comparar el rendimiento de Hotel Plaza vs Hotel Colonial en tiempo real. Incluye gráficas de "Pulso de la Cadena", Mix de Ingresos y Velocímetros de Ocupación.';
                doc.text(doc.splitTextToSize(biText, 180), 15, 52);

                autoTable(doc, {
                    startY: 65,
                    head: [['MÉTRICA', 'DESCRIPCIÓN', 'VALOR ESTRATÉGICO']],
                    body: [
                        ['Liquidez Maestra', 'Suma total de efectivo y bases de ambos hoteles.', 'Control de flujo de caja global.'],
                        ['Mix de Ingresos', 'Distribución porcentual de ventas por sede.', 'Identificación de la sede líder.'],
                        ['Pulso de Ventas', 'Comparativa directa de Ingresos vs Egresos.', 'Detección de desviaciones financieras.'],
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [79, 70, 229] }
                });

                doc.text('2. Consolidado de Reservas', 15, doc.lastAutoTable.finalY + 15);
                const resText = 'Centraliza todas las reservas futuras. Use el filtro de "Estado" para gestionar confirmaciones y el indicador de "Deuda" para asegurar cobros antes del Check-in.';
                doc.text(doc.splitTextToSize(resText, 180), 15, doc.lastAutoTable.finalY + 22);

                doc.addPage();
                addHeader('PROCESO PASO A PASO: CHECK-IN', 'Guía Detallada para Recepción');
                
                autoTable(doc, {
                    startY: 45,
                    head: [['PASO', 'ACTIVIDAD', 'DETALLE OPERATIVO']],
                    body: [
                        ['1', 'Selección', 'Ubique una habitación verde en el mapa y presione el botón principal.'],
                        ['2', 'Huésped', 'Ingrese el documento. El sistema autocompleta si ya existe en la base de datos.'],
                        ['3', 'Fechas', 'Indique la fecha de salida. El sistema calculará el total automáticamente.'],
                        ['4', 'Pagos', 'Registre cualquier abono inicial en la pestaña de Pagos para que el saldo sea correcto.'],
                        ['5', 'Finalizar', 'Presione "Guardar". La habitación pasará a estado OCUPADA.'],
                    ],
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [59, 130, 246] }
                });

                let nextY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 15 : 150;
                
                doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(0,0,0);
                doc.text('II. ESTRUCTURA DE MENÚS Y OPCIONES', 15, nextY);

                autoTable(doc, {
                    startY: nextY + 5,
                    head: [['GRUPO', 'MÓDULO', 'FUNCIONALIDAD PRINCIPAL']],
                    body: [
                        ['Operaciones', 'Tienda / POS', 'Venta de productos y cargos directos a la habitación.'],
                        ['Operaciones', 'Reservas', 'Gestión de preventas y bloqueos de calendario a futuro.'],
                        ['Operaciones', 'Mantenimiento', 'Reporte de daños y bloqueos técnicos de habitaciones.'],
                        ['Finanzas', 'Cuadre de Caja', 'Rendición de cuentas diaria por turno y medio de pago.'],
                        ['Finanzas', 'Reporte Ingresos', 'Auditoría detallada de todo el dinero recibido.'],
                        ['Finanzas', 'Rentabilidad', 'Análisis de ocupación y ganancias por cada habitación.'],
                        ['Multi-Hotel', 'Liquidez Cadena', 'Vista financiera total (Efectivo+Base) de todas las sedes.'],
                        ['Multi-Hotel', 'Comparativa', 'Análisis BI Plaza vs Colonial con gráficas avanzadas.'],
                        ['Multi-Hotel', 'Consolidado Res.', 'Gestión centralizada de reservas y control de abonos.'],
                        ['Configuración', 'Documentos', 'Almacenamiento digital de contratos, RUT y certificados.'],
                    ],
                    theme: 'striped',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [15, 23, 42] }
                });

                doc.addPage();
                addHeader('INTERPRETACIÓN DE ANALÍTICA', 'Entendiendo los Gráficos de Gestión');
                
                const analyticsImg = await getBase64ImageFromURL(window.location.origin + '/manual/analytics.png');
                if (analyticsImg) {
                    try {
                        doc.addImage(analyticsImg, 'PNG', 15, 45, 180, 80);
                    } catch (e) {
                        console.warn("doc.addImage failed:", e);
                    }
                }

                doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(50,50,50);
                const analText = 'Las gráficas muestran el balance entre ingresos y gastos. En la nueva sección "Comparativa", el Mix de Ingresos ayuda a entender la dependencia de la cadena sobre una sede específica.';
                doc.text(doc.splitTextToSize(analText, 180), 15, analyticsImg ? 135 : 50);

            } else {
                addHeader('DOCUMENTACIÓN TÉCNICA MAESTRA', 'Ingeniería de Software y Arquitectura de Sistemas');
                
                autoTable(doc, {
                    startY: 45,
                    head: [['COMPONENTE', 'TECNOLOGÍA', 'DESCRIPCIÓN']],
                    body: [
                        ['Frontend', 'React + Vite', 'Single Page Application con renderizado eficiente y Tailwind CSS.'],
                        ['Backend', 'Node.js + Express', 'API RESTful con autenticación JWT y middleware de seguridad.'],
                        ['Database', 'MongoDB Atlas', 'Base de datos NoSQL escalable orientada a documentos.'],
                        ['Media', 'Cloudinary', 'Servicio cloud para optimización y entrega de imágenes.'],
                        ['Seguridad', 'BCrypt + Helmet', 'Protección de datos sensibles y encabezados de seguridad HTTP.'],
                    ],
                    theme: 'striped',
                    headStyles: { fillColor: [37, 99, 235] }
                });
            }

            doc.save(`Manual_Elite_Pro_Balcon_${activeTab.toUpperCase()}.pdf`);
            Swal.fire({
                icon: 'success',
                title: 'Descarga Iniciada',
                text: 'El manual se ha generado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error al generar PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de Generación',
                html: `<b>Detalle:</b> ${error.message || 'Error desconocido'}<br/><br/><p style="font-size: 12px; color: #666">Por favor, presiona Ctrl+F5 para asegurar que estás usando la versión V3.0</p>`
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 -m-6 p-6 md:p-10 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Visual Hero Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                        <Layers size={400} className="transform translate-x-20 -translate-y-20 rotate-12" />
                    </div>
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-full font-black text-[10px] uppercase tracking-widest border border-primary-500/30">
                                <Zap size={14} /> Guía Elite PRO v3.0
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                                Centro de <span className="text-primary-500">Manuales</span> Profesionales.
                            </h1>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-lg">
                                Manuales con imágenes integradas, tablas estructuradas y guías paso a paso para la mejor operación hotelera.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <button 
                                    onClick={downloadPDF}
                                    disabled={isGenerating}
                                    className="flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                                    {isGenerating ? 'Generando...' : 'Descargar Manual PRO'}
                                </button>
                                <div className="flex p-1 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                    <button 
                                        onClick={() => setActiveTab('usuario')}
                                        className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'usuario' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white'}`}
                                    >
                                        Usuario
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('tecnico')}
                                        className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'tecnico' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white'}`}
                                    >
                                        Técnico
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="hidden lg:block relative group">
                            <div className="absolute inset-0 bg-primary-500/20 blur-[100px] rounded-full group-hover:bg-primary-500/30 transition-all duration-1000"></div>
                            <img 
                                src={activeTab === 'usuario' ? "/manual/room_map.png" : "/manual/analytics.png"} 
                                alt="Dashboard Mockup" 
                                className="relative z-10 w-full rounded-[2rem] shadow-2xl border border-white/10 transform group-hover:-rotate-1 transition-transform duration-700"
                            />
                        </div>
                    </div>
                </div>

                {activeTab === 'usuario' ? (
                    <div className="space-y-16">
                        
                        {/* Step by Step Interactive Section */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary-500 text-white p-3 rounded-2xl shadow-lg shadow-primary-200"><Activity size={24}/></div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manual Operativo: Check-in Maestro</h2>
                                    <p className="text-slate-500 font-medium italic">Sigue este flujo paso a paso en la aplicación.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {checkinSteps.map((step, idx) => (
                                    <div 
                                        key={idx}
                                        onMouseEnter={() => setExpandedStep(idx)}
                                        className={`p-8 rounded-[2.5rem] transition-all duration-500 cursor-pointer border-2 ${expandedStep === idx ? 'bg-white border-primary-500 shadow-2xl shadow-primary-100 -translate-y-2' : 'bg-white/50 border-slate-100 grayscale opacity-70'}`}
                                    >
                                        <div className="flex flex-col gap-6">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-100">
                                                {step.icon}
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Paso {idx + 1}</span>
                                                <h4 className="font-black text-slate-900 leading-tight">{step.title}</h4>
                                                {expandedStep === idx && (
                                                    <p className="text-slate-500 text-xs font-medium leading-relaxed animate-in slide-in-from-top-2 duration-300">
                                                        {step.desc}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual Modules Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Analytics Explanation */}
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Análisis de Resultados</h3>
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Dashboard Financiero</p>
                                    </div>
                                    <PieChart className="text-blue-500" size={32} />
                                </div>
                                
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dummyData}>
                                            <defs>
                                                <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                            <Tooltip 
                                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                                            />
                                            <Area type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIng)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl">
                                        <Info className="text-blue-500 shrink-0 mt-1" size={18} />
                                        <p className="text-sm text-blue-900 font-medium">
                                            Las métricas te permiten visualizar la rentabilidad neta diaria. El manual PDF explica cómo leer cada una de estas gráficas en detalle.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Features Showcase */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 flex flex-col justify-between group overflow-hidden relative">
                                    <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        <ShoppingBag size={150} />
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <div className="bg-white/20 p-3 rounded-xl w-fit"><DollarSign size={24} /></div>
                                        <h4 className="text-xl font-black">POS y Tienda</h4>
                                        <p className="text-white/80 text-xs font-medium leading-relaxed">Cargue consumos al folio del huésped de forma instantánea. Ideal para minibar y snacks.</p>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mt-6 group-hover:gap-4 transition-all relative z-10">
                                        Ver guía <ArrowRight size={14} />
                                    </button>
                                </div>

                                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 flex flex-col justify-between group overflow-hidden relative">
                                    <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        <Box size={150} />
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <div className="bg-white/10 p-3 rounded-xl w-fit"><Box size={24} /></div>
                                        <h4 className="text-xl font-black">Stock Inteligente</h4>
                                        <p className="text-white/60 text-xs font-medium leading-relaxed">Alertas de stock bajo para productos de alta rotación. Nunca te quedes sin suministros.</p>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mt-6 group-hover:gap-4 transition-all relative z-10 text-primary-400">
                                        Explorar <ArrowRight size={14} />
                                    </button>
                                </div>

                                <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-8">
                                    <div className="hidden md:flex w-24 h-24 bg-orange-50 rounded-full items-center justify-center text-orange-500 shrink-0">
                                        <Clock size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Rendición de Cuentas Diaria</h4>
                                        <p className="text-slate-500 text-sm font-medium">
                                            El cierre de caja es ahora automático. El sistema suma ingresos por tarjeta, efectivo y transferencias por separado.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="space-y-12">
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Cpu size={24} /></div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ecosistema de Desarrollo</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Frontend Core</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> React 18 / Vite</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Tailwind CSS</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Recharts Analytics</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Backend Core</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Node.js / Express</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> MongoDB Atlas</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> JWT Security</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">DevOps</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> Vercel PaaS</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> GitHub Actions</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> SSL Encryption</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Almacenamiento</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Cloudinary Media</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Local Auth Storage</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> JSON Doc Storage</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-12 rounded-[3rem] text-white space-y-12">
                            <div className="text-center space-y-4 max-w-2xl mx-auto">
                                <h3 className="text-4xl font-black tracking-tight">Esquemas de Datos</h3>
                                <p className="text-slate-400 font-medium">Modelos optimizados para alta concurrencia.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-6">
                                    <div className="flex items-center gap-3 text-primary-400 font-black uppercase tracking-widest text-xs">
                                        <Database size={16} /> Colección: Registros
                                    </div>
                                    <div className="font-mono text-[10px] text-slate-400 bg-black/30 p-4 rounded-xl overflow-hidden">
                                        {`{
  _id: ObjectId,
  habitacion: Ref(Habitacion),
  huesped: Ref(Cliente),
  entrada: Date,
  salida: Date,
  total: Number,
  pagado: Number
}`}
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-6">
                                    <div className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-widest text-xs">
                                        <Database size={16} /> Colección: Ventas
                                    </div>
                                    <div className="font-mono text-[10px] text-slate-400 bg-black/30 p-4 rounded-xl overflow-hidden">
                                        {`{
  _id: ObjectId,
  registro: Ref(Registro),
  productos: [{
    prod: Ref(Producto),
    cant: Number
  }],
  total: Number
}`}
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-6">
                                    <div className="flex items-center gap-3 text-orange-400 font-black uppercase tracking-widest text-xs">
                                        <Database size={16} /> Colección: Users
                                    </div>
                                    <div className="font-mono text-[10px] text-slate-400 bg-black/30 p-4 rounded-xl overflow-hidden">
                                        {`{
  _id: ObjectId,
  nombre: String,
  rol: Ref(Rol),
  permisos: [{
    p: "manuales",
    v: true
  }]
}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Documentation Help */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                            <Book size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">¿Alguna duda adicional?</h4>
                            <p className="text-slate-500 font-medium">Esta documentación se actualiza automáticamente. Última actualización: 27/04/2026 17:00</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all">Soporte Técnico</button>
                        <button className="px-8 py-4 border-2 border-slate-200 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all">Vídeos Tutoriales</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Manuales;
