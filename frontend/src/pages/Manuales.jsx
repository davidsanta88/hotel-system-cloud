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
    Zap
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
import 'jspdf-autotable';

const Manuales = () => {
    const [activeTab, setActiveTab] = useState('usuario');
    const [expandedStep, setExpandedStep] = useState(0);

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

    const downloadPDF = () => {
        const doc = new jsPDF();
        let pageNum = 1;

        const addHeader = (title, subtitle) => {
            doc.setFillColor(15, 23, 42); 
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 20, 20);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(subtitle, 20, 30);
            
            // Page Number
            doc.setTextColor(150, 150, 150);
            doc.text(`Página ${pageNum}`, 180, 30);
        };

        const checkPage = (currentY, needed) => {
            if (currentY + needed > 270) {
                doc.addPage();
                pageNum++;
                addHeader(activeTab === 'usuario' ? 'MANUAL DE USUARIO INTEGRAL' : 'DOCUMENTACIÓN TÉCNICA', 'Continuación - Hotel Balcón Plaza');
                return 50;
            }
            return currentY;
        };

        if (activeTab === 'usuario') {
            addHeader('MANUAL DE USUARIO INTEGRAL', 'Guía Maestra de Operaciones y Administración - Hotel Balcón Plaza');
            
            let y = 55;

            // --- INTRODUCCIÓN ---
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(16); doc.setFont('helvetica', 'bold');
            doc.text('I. INTRODUCCIÓN AL SISTEMA', 20, y); y += 10;
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            const introText = 'Este documento constituye la guía oficial para el uso del Sistema de Gestión Hotelera Balcón Plaza. El software está diseñado para centralizar la operación, desde la recepción hasta el análisis financiero consolidado.';
            const splitIntro = doc.splitTextToSize(introText, 170);
            doc.text(splitIntro, 20, y); y += (splitIntro.length * 6) + 10;

            // --- TABLA DE CONTENIDOS (RESUMIDA) ---
            doc.setFont('helvetica', 'bold');
            doc.text('ESTRUCTURA DEL MANUAL:', 20, y); y += 8;
            doc.setFont('helvetica', 'normal');
            doc.text('1. Recepción y Operaciones Diarias', 25, y); y += 5;
            doc.text('2. Administración, Tesorería y Caja', 25, y); y += 5;
            doc.text('3. Gestión Multi-Hotel y Consolidados', 25, y); y += 5;
            doc.text('4. Configuraciones y Personalización', 25, y); y += 15;

            // --- GRUPO 1: RECEPCIÓN Y OPERACIONES ---
            y = checkPage(y, 20);
            doc.setFillColor(241, 245, 249); doc.rect(15, y - 5, 180, 10, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
            doc.text('1. RECEPCIÓN Y OPERACIONES', 20, y + 2); y += 15;

            const items1 = [
                { n: 'Mapa de Habitaciones', d: 'Vista gráfica en tiempo real. Permite ver estados (Libre, Ocupada, Reservada, Sucia). Clic para Check-in, ver folio de pagos o Check-out.' },
                { n: 'Dashboard de Inicio', d: 'Métricas rápidas del día: ocupación actual, ingresos proyectados y alertas de mantenimiento pendientes.' },
                { n: 'Tienda / POS', d: 'Punto de venta para productos adicionales. Permite cargar el costo a la habitación del huésped o cobrar de inmediato.' },
                { n: 'Reservas a Futuro', d: 'Gestión de preventas. Permite bloquear habitaciones para fechas específicas y capturar abonos iniciales.' },
                { n: 'Solicitudes de Reserva', d: 'Bandeja de entrada para solicitudes externas (página web o digital) que deben ser confirmadas por recepción.' },
                { n: 'Aseo y Mantenimiento', d: 'Control de limpieza diaria y reporte de daños técnicos. Bloquea habitaciones si el estado impide su uso comercial.' }
            ];

            items1.forEach(item => {
                y = checkPage(y, 15);
                doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
                doc.text(`• ${item.n}:`, 20, y);
                doc.setFont('helvetica', 'normal');
                const splitD = doc.splitTextToSize(item.d, 160);
                doc.text(splitD, 45, y);
                y += (splitD.length * 5) + 3;
            });
            y += 5;

            // --- GRUPO 2: ADMINISTRACIÓN Y TESORERÍA ---
            y = checkPage(y, 20);
            doc.setFillColor(241, 245, 249); doc.rect(15, y - 5, 180, 10, 'F');
            doc.setFont('helvetica', 'bold'); doc.text('2. ADMINISTRACIÓN Y TESORERÍA', 20, y + 2); y += 15;

            const items2 = [
                { n: 'Cuadre de Caja', d: 'Proceso de cierre de turno. El recepcionista rinde cuentas del efectivo, transferencias y tarjetas recibidas.' },
                { n: 'Reporte de Ingresos', d: 'Listado detallado de todas las transacciones financieras filtrado por fechas y medios de pago.' },
                { n: 'Calendario de Flujo', d: 'Visualización mensual de ingresos vs gastos para identificar tendencias de liquidez.' },
                { n: 'Rentabilidad', d: 'Análisis de qué habitaciones generan más beneficios y cuáles tienen mayor rotación.' },
                { n: 'Cotizaciones', d: 'Emisión de documentos formales de precio para grupos o eventos antes de realizar la reserva.' }
            ];

            items2.forEach(item => {
                y = checkPage(y, 15);
                doc.setFont('helvetica', 'bold'); doc.text(`• ${item.n}:`, 20, y);
                doc.setFont('helvetica', 'normal');
                const splitD = doc.splitTextToSize(item.d, 160);
                doc.text(splitD, 45, y);
                y += (splitD.length * 5) + 3;
            });

            // --- GRUPO 3: GESTIÓN MULTI-HOTEL ---
            y = checkPage(y, 20);
            doc.setFillColor(241, 245, 249); doc.rect(15, y - 5, 180, 10, 'F');
            doc.setFont('helvetica', 'bold'); doc.text('3. GESTIÓN MULTI-HOTEL (CONSOLIDADOS)', 20, y + 2); y += 15;
            
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
            const multiText = 'Esta sección es exclusiva para administradores generales. Permite ver el Mapa de Habitaciones de todas las sedes (Plaza y Colonial) simultáneamente, así como el flujo de caja total del grupo empresarial.';
            const splitMulti = doc.splitTextToSize(multiText, 170);
            doc.text(splitMulti, 20, y); y += (splitMulti.length * 5) + 10;

            // --- GRUPO 4: CONFIGURACIONES ---
            y = checkPage(y, 20);
            doc.setFillColor(241, 245, 249); doc.rect(15, y - 5, 180, 10, 'F');
            doc.setFont('helvetica', 'bold'); doc.text('4. CONFIGURACIONES DEL SISTEMA', 20, y + 2); y += 15;

            const items4 = [
                { n: 'Usuarios y Roles', d: 'Creación de cuentas de empleado y definición exacta de sus permisos (Ver, Editar, Eliminar).' },
                { n: 'Zonas y Hab.', d: 'Creación y edición de la planta física. Permite añadir nuevas habitaciones o cambiar sus descripciones.' },
                { n: 'Cat. Productos', d: 'Organización del inventario de la tienda en categorías lógicas para facilitar la búsqueda.' },
                { n: 'Info Hotel', d: 'Configuración de datos legales, NIT, dirección y logo que aparecerán en los comprobantes.' }
            ];

            items4.forEach(item => {
                y = checkPage(y, 15);
                doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
                doc.text(`• ${item.n}:`, 20, y);
                doc.setFont('helvetica', 'normal');
                const splitD = doc.splitTextToSize(item.d, 160);
                doc.text(splitD, 45, y);
                y += (splitD.length * 5) + 3;
            });

        } else {
            // MANUAL TÉCNICO COMPLETO
            addHeader('DOCUMENTACIÓN TÉCNICA AVANZADA', 'Especificaciones de Ingeniería y Arquitectura - Hotel System');
            let y = 55;
            
            const techItems = [
                { t: 'Stack de Desarrollo', c: 'Frontend basado en React 18 con motor de compilación Vite. Backend Node.js utilizando el framework Express v4. Base de datos MongoDB Atlas (Cluster NoSQL).' },
                { t: 'Seguridad y Auth', c: 'Implementación de JSON Web Tokens (JWT) con expiración configurable. Contraseñas hasheadas mediante BCrypt. Middlewares de protección CORS y Rate-Limiting.' },
                { t: 'Gestión de Estados', c: 'Uso de Context API para el estado global de autenticación y permisos. Hook personalizado usePermissions para control de acceso en componentes de UI.' },
                { t: 'Despliegue y CI/CD', c: 'Despliegue automatizado mediante Git hooks. El frontend se sirve como archivos estáticos optimizados. El backend se ejecuta en un entorno escalable con Node.js.' },
                { t: 'Integraciones Media', c: 'Utilización de Cloudinary para el almacenamiento persistente de imágenes de productos y habitaciones, optimizando el ancho de banda del servidor.' }
            ];

            techItems.forEach(item => {
                y = checkPage(y, 20);
                doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
                doc.setTextColor(37, 99, 235);
                doc.text(item.t, 20, y); y += 6;
                doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
                doc.setTextColor(15, 23, 42);
                const splitC = doc.splitTextToSize(item.c, 170);
                doc.text(splitC, 20, y);
                y += (splitC.length * 5) + 10;
            });
        }

        doc.save(`Manual_Elite_Balcon_${activeTab.toUpperCase()}.pdf`);
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
                                <Zap size={14} /> Guía Elite del Administrador v2.5
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                                Centro de <span className="text-primary-500">Documentación</span> Profesional.
                            </h1>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-lg">
                                Manuales exhaustivos que cubren cada menú, opción y funcionalidad técnica del ecosistema Balcón Plaza.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <button 
                                    onClick={downloadPDF}
                                    className="flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                                >
                                    <Download size={20} /> Descargar Manual Elite
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
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Guía de Operación: Check-in Maestro</h2>
                                    <p className="text-slate-500 font-medium italic">El proceso fundamental de recepción explicado paso a paso.</p>
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
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analítica y Toma de Decisiones</h3>
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Interpretación de Dashboard</p>
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
                                            Las gráficas del manual se basan en datos reales de ocupación. Los picos de ingresos te permiten planificar el stock de tienda con anticipación.
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
                                        <p className="text-white/80 text-xs font-medium leading-relaxed">Gestione ventas cruzadas de snacks y bebidas. Los cargos se anexan al folio de habitación automáticamente.</p>
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
                                        <h4 className="text-xl font-black">Logística y Stock</h4>
                                        <p className="text-white/60 text-xs font-medium leading-relaxed">Control total sobre inventarios. Reciba notificaciones cuando el stock de productos críticos esté bajo.</p>
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
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Flujo de Caja Ininterrumpido</h4>
                                        <p className="text-slate-500 text-sm font-medium">
                                            Cada movimiento de dinero queda trazado por usuario y medio de pago, garantizando un cierre de caja transparente cada día.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Tech Specs Table */}
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Cpu size={24} /></div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Arquitectura de Alta Disponibilidad</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Ecosistema Frontend</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> React 18.2 (Virtual DOM)</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Vite (Hot Module Replace)</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Tailwind CSS 3.4</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Ecosistema Backend</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Node.js / Express</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> MongoDB Atlas (NoSQL)</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Cloudinary Storage</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Cloud & DevOps</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> Vercel PaaS</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> GitHub Actions CI/CD</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> SSL/TLS Encrypted</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Ciberseguridad</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> JWT Stateless Auth</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Helmet Protection</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> RBAC granular control</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* DB Schema Illustration (Visual) */}
                        <div className="bg-slate-900 p-12 rounded-[3rem] text-white space-y-12">
                            <div className="text-center space-y-4 max-w-2xl mx-auto">
                                <h3 className="text-4xl font-black tracking-tight">Estructura de Documentos</h3>
                                <p className="text-slate-400 font-medium">Modelado de datos flexible para una respuesta en milisegundos.</p>
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
  pagado: Number,
  estado: "ACTIVO"
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
    cant: Number,
    precio: Number
  }],
  total: Number,
  pago: Ref(MedioPago)
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
    v: true,
    e: false
  }],
  lastLogin: Date
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
                            <p className="text-slate-500 font-medium">Esta documentación se actualiza automáticamente. Última actualización: 27/04/2026 16:40</p>
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
