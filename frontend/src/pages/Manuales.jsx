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
    Cpu
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Manuales = () => {
    const [activeTab, setActiveTab] = useState('usuario');

    const downloadPDF = () => {
        const doc = new jsPDF();
        const primaryColor = '#0f172a';
        const secondaryColor = '#3b82f6';

        // Helper for titles
        const addHeader = (title, subtitle) => {
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 20, 20);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(subtitle, 20, 30);
        };

        if (activeTab === 'usuario') {
            addHeader('Manual de Usuario', 'Sistema de Gestión Hotelera - Hotel Balcón Plaza');
            
            let y = 50;
            const sections = [
                { title: '1. Introducción', content: 'Bienvenido al Sistema de Gestión Hotelera Balcón Plaza. Este manual le guiará a través de las funciones principales para optimizar la operación de su establecimiento.' },
                { title: '2. Mapa de Habitaciones (Centro de Control)', content: 'Es la pantalla principal donde verá el estado de todas las habitaciones. \n- Verde (Disponible): Haga clic para iniciar un Check-in.\n- Rojo (Ocupada): Muestra el huésped actual y saldo. Haga clic para ver detalles, pagos o realizar Check-out.\n- Amarillo (Reservada): Indica que hay una reserva para hoy.\n- Azul (Por Asear): La habitación ha sido liberada y requiere limpieza.\n\nControles rápidos: Use el icono de la escoba para cambiar entre Sucia/Limpia sin abrir detalles.' },
                { title: '3. Reservas y Recepción', content: 'El módulo de Reservas permite agendar estancias futuras. Puede buscar disponibilidad por fecha y tipo de habitación. Al llegar el huésped, puede convertir la reserva en un Registro activo con un solo clic.' },
                { title: '4. Tienda (POS) e Inventario', content: 'Gestione las ventas adicionales. Seleccione productos de la tienda y cárguelos a la cuenta del huésped (Folio) o realice ventas directas por mostrador. El sistema descontará automáticamente el stock de su inventario.' },
                { title: '5. Caja y Tesorería', content: '- Cuadre de Caja: Realice el cierre diario de sus ingresos y egresos.\n- Reporte de Ingresos: Vea el flujo de caja detallado por medios de pago.\n- Gastos: Registre compras a proveedores o pagos operativos para mantener su balance actualizado.' },
                { title: '6. Reportes y Estadísticas', content: 'Acceda a análisis avanzados de ocupación, rentabilidad por habitación y comparativas entre los hoteles del grupo (Plaza y Colonial).' },
                { title: '7. Personal y Roles', content: 'Administre sus usuarios y defina permisos granulares. Esto asegura que cada empleado (Recepcionista, Camarera, Admin) solo acceda a lo que le corresponde.' }
            ];

            sections.forEach(s => {
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(s.title, 20, y);
                y += 10;
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                const splitContent = doc.splitTextToSize(s.content, 170);
                doc.text(splitContent, 20, y);
                y += (splitContent.length * 6) + 10;

                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });

        } else {
            addHeader('Manual Técnico', 'Arquitectura y Desarrollo - Hotel System');
            
            let y = 50;
            const sections = [
                { title: '1. Stack Tecnológico', content: 'Arquitectura moderna de 3 capas:\n- Frontend: Single Page Application (SPA) desarrollada con React 18 y Vite.\n- Backend: API RESTful sobre Node.js y Express.\n- Persistence: MongoDB Atlas (Database as a Service) para almacenamiento flexible de documentos NoSQL.' },
                { title: '2. Arquitectura del Sistema', content: 'El sistema utiliza un middleware de autenticación basado en JWT. \n- Las peticiones son validadas por el servidor antes de acceder a controladores específicos.\n- El frontend maneja el estado global mediante Context API (AuthContext).' },
                { title: '3. Modelado de Datos', content: 'Entidades principales:\n- Habitacion: Define zona, tipo y estado visual.\n- Registro: Vincula huésped, habitación, fechas y estado financiero.\n- Venta/Consumo: Almacena transacciones de productos vinculadas a registros.\n- CierreCaja: Captura snapshots diarios de movimientos financieros.' },
                { title: '4. Integraciones y Media', content: 'El sistema integra Cloudinary para el manejo eficiente de imágenes, permitiendo cargar fotos de habitaciones y productos sin sobrecargar el servidor de aplicaciones.' },
                { title: '5. Seguridad y Permisos (RBAC)', content: 'Control de acceso basado en roles. Los permisos se estructuran en objetos JSON que definen privilegios de Ver (v), Crear (c), Editar (e), Eliminar (d) y Exportar (x) para cada código de módulo.' }
            ];

            sections.forEach(s => {
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(s.title, 20, y);
                y += 10;
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                const splitContent = doc.splitTextToSize(s.content, 170);
                doc.text(splitContent, 20, y);
                y += (splitContent.length * 6) + 10;

                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
        }

        doc.save(`Manual_${activeTab === 'usuario' ? 'Usuario' : 'Tecnico'}_Hotel.pdf`);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 -m-6 p-6 md:p-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-primary-600 font-black uppercase tracking-[0.2em] text-xs">
                            <Book size={16} /> Centro de Documentación
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manuales del Sistema</h1>
                        <p className="text-slate-500 font-medium">Todo lo que necesitas saber para operar y mantener la plataforma.</p>
                    </div>
                    
                    <button 
                        onClick={downloadPDF}
                        className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-slate-200"
                    >
                        <Download size={20} />
                        Descargar PDF
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-fit border border-slate-200">
                    <button 
                        onClick={() => setActiveTab('usuario')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'usuario' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText size={18} /> Manual de Usuario
                    </button>
                    <button 
                        onClick={() => setActiveTab('tecnico')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'tecnico' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Settings size={18} /> Manual Técnico
                    </button>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Sidebar / Quick Nav */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Capítulos</h3>
                            <div className="space-y-1">
                                {activeTab === 'usuario' ? (
                                    <>
                                        <div className="p-3 bg-slate-50 rounded-xl text-slate-900 font-bold text-sm flex items-center gap-3"><Hotel size={16} className="text-primary-500" /> Operaciones</div>
                                        <div className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors cursor-pointer"><Calendar size={16} /> Reservas</div>
                                        <div className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors cursor-pointer"><ShoppingBag size={16} /> Ventas y POS</div>
                                        <div className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors cursor-pointer"><PieChart size={16} /> Reportes</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 bg-slate-50 rounded-xl text-slate-900 font-bold text-sm flex items-center gap-3"><Code size={16} className="text-primary-500" /> Arquitectura</div>
                                        <div className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors cursor-pointer"><Database size={16} /> Base de Datos</div>
                                        <div className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors cursor-pointer"><Server size={16} /> API Endpoints</div>
                                        <div className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors cursor-pointer"><Shield size={16} /> Seguridad</div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500">
                                <Book size={120} />
                            </div>
                            <h4 className="text-lg font-black leading-tight relative z-10">¿Necesitas soporte técnico?</h4>
                            <p className="text-white/80 text-xs font-medium mt-2 relative z-10">Contacta con el equipo de desarrollo para asistencia personalizada.</p>
                            <button className="mt-4 flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-colors relative z-10">
                                Contactar <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content Body */}
                    <div className="lg:col-span-9 space-y-6">
                        {activeTab === 'usuario' ? (
                            <div className="space-y-8">
                                {/* Intro Card */}
                                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                                        <Smartphone size={32} />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-3xl font-black text-slate-900">Operación Diaria: Paso a Paso</h2>
                                        <p className="text-slate-600 leading-relaxed text-lg font-medium">
                                            El sistema está optimizado para dispositivos táctiles y computadoras de escritorio. Toda la información se sincroniza en tiempo real entre los empleados de recepción y camareras.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                                        <div className="p-6 bg-slate-50 rounded-[2rem] space-y-3">
                                            <div className="font-black text-slate-900 flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500"/> Check-in</div>
                                            <p className="text-slate-500 text-sm font-medium">Identifica una habitación verde, haz clic y completa los datos del huésped. No olvides los acompañantes.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-[2rem] space-y-3">
                                            <div className="font-black text-slate-900 flex items-center gap-2"><PieChart size={18} className="text-blue-500"/> Consumos</div>
                                            <p className="text-slate-500 text-sm font-medium">Registra compras de la tienda vinculándolas a la habitación. El saldo se actualizará automáticamente.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-[2rem] space-y-3">
                                            <div className="font-black text-slate-900 flex items-center gap-2"><LogOut size={18} className="text-red-500"/> Check-out</div>
                                            <p className="text-slate-500 text-sm font-medium">Valida el saldo pendiente antes de dar salida. Al finalizar, la habitación pasará a estado "Sucia" para aseo.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Deep Dive Section */}
                                <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Layers size={300} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/10 p-4 rounded-2xl"><Users size={24} /></div>
                                        <h3 className="text-2xl font-black tracking-tight">Gestión de Roles y Seguridad</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <p className="text-white/70 font-medium leading-relaxed">
                                                Cada empleado tiene un usuario único. Como administrador, puedes restringir qué módulos ven o editan. Por ejemplo:
                                            </p>
                                            <ul className="space-y-3">
                                                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div> Camareras: Solo ven Aseo y Mantenimiento.</li>
                                                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div> Recepción: Gestionan mapa, clientes y ventas.</li>
                                                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div> Admin: Acceso total y reportes de rentabilidad.</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-6">
                                            <h4 className="font-black text-primary-400 uppercase tracking-widest text-xs">Tip Pro</h4>
                                            <div className="flex items-start gap-4">
                                                <Info className="text-primary-400 shrink-0 mt-1" />
                                                <p className="text-sm font-medium italic opacity-80">
                                                    "Usa el botón de 'Actualizar' en el mapa visual frecuentemente si tienes varios recepcionistas trabajando al mismo tiempo."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Architecture Card */}
                                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><Activity size={24} /></div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Arquitectura del Sistema</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center space-y-4">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-700"><Layout size={32} /></div>
                                            <h4 className="font-black text-slate-900">Frontend</h4>
                                            <p className="text-xs text-slate-500 font-medium">React 18 + Vite. SPA con routing dinámico y Lazy Loading. Estilos con Tailwind CSS.</p>
                                        </div>
                                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center space-y-4">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-700"><Cpu size={32} /></div>
                                            <h4 className="font-black text-slate-900">Backend</h4>
                                            <p className="text-xs text-slate-500 font-medium">Node.js + Express. Arquitectura RESTful. Middleware de autenticación con JWT.</p>
                                        </div>
                                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center space-y-4">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-700"><Database size={32} /></div>
                                            <h4 className="font-black text-slate-900">Database</h4>
                                            <p className="text-xs text-slate-500 font-medium">MongoDB Atlas. Modelado NoSQL con Mongoose para escalabilidad y flexibilidad.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-slate-50">
                                        <h3 className="font-black text-slate-900 text-xl">Puntos Críticos de Integración</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                Sincronización Consolidada: Los reportes cruzan datos de múltiples hoteles usando prefijos de ID.
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold text-sm">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                Gestión de Medios: Integración con Cloudinary para fotos de productos y habitaciones.
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-purple-50 text-purple-700 rounded-2xl font-bold text-sm">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                Websockets / Pooling: Refresco automático de mapa de habitaciones cada 60 segundos.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Manuales;
