import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MessageSquare, MapPin, Car, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const SLIDES = [
    {
        img: '/hotel_noche.jpg',
        title: 'Hotel Balcón Plaza',
        sub: 'Tu hogar en Belalcázar, Caldas',
    },
    {
        img: '/hotel_globos1.jpg',
        title: 'Sorpresas Inolvidables',
        sub: 'Decoramos tu habitación para cumpleaños y fechas especiales',
    },
    {
        img: '/cristo_belalcazar.png',
        title: 'Cristo de Belalcázar',
        sub: 'El monumento más icónico de la región, visible desde nuestro hotel',
    },
    {
        img: '/hotel_hab1.jpg',
        title: 'Hermosas Habitaciones',
        sub: 'Confort y descanso con el mejor estilo cafetero',
    },
    {
        img: '/hotel_hab5.jpg',
        title: 'Espacios Románticos',
        sub: 'Detalles que enamoran en cada rincón',
    },
    {
        img: '/mapa_region.png',
        title: 'Ubicación Estratégica',
        sub: 'Carrera 4 #11-03, 2do Piso (Plaza Córdoba) | Tel: 321 805 1869',
    },
    {
        img: '/hotel_studio.jpg',
        title: 'Servicio de Spa y Uñas',
        sub: 'Relájate y consiéntete en nuestro espacio exclusivo',
    },
    {
        img: '/hotel_globos2.jpg',
        title: 'Celebra con Nosotros',
        sub: 'Hacemos de tu estadía un momento mágico',
    },
    {
        img: '/hotel_hab3.jpg',
        title: 'Despierta en el Paraíso',
        sub: 'Habitaciones con balcón y vistas inolvidables',
    },
    {
        img: '/hotel_aniversario.jpg',
        title: 'Cenas Románticas',
        sub: 'Creamos ambientes únicos para parejas',
    },
    {
        img: '/hotel_hab6.jpg',
        title: 'Tradición y Confort',
        sub: 'Habitaciones amplias para toda la familia',
    },
    {
        img: '/casa_colonial.png',
        title: 'Tradición Cafetera',
        sub: 'Arquitectura colonial y el icónico Willys Jeepao dándole vida a nuestras calles',
    },
    {
        img: '/finca_cafetera.png',
        title: 'Tierra de Café, Plátano, Aguacate y otros',
        sub: 'Descubre la esencia de Belalcázar, un vibrante pueblo de tradición agrícola',
    },
    {
        img: '/hotel_dia.jpg',
        title: 'Belalcázar nos espera',
        sub: 'Ubicación privilegiada frente a la Plaza Córdoba',
    },
];

const Landing = () => {
    const [slide, setSlide] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ nombre: '', celular: '', correo: '', huespedes: 1, fecha: '', notas: '' });
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    // Auto-slide (más rápido - 3s)
    useEffect(() => {
        const t = setInterval(() => setSlide(p => (p + 1) % SLIDES.length), 3000);
        return () => clearInterval(t);
    }, []);

    const handleSumbit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/solicitudes', {
                nombre: formData.nombre,
                celular: formData.celular,
                correo: formData.correo,
                num_huespedes: formData.huespedes,
                fecha_llegada: formData.fecha,
                notas: formData.notas
            });
            setSent(true);
            setTimeout(() => { 
                setShowModal(false); 
                setSent(false); 
                setFormData({ nombre: '', celular: '', correo: '', huespedes: 1, fecha: '', notas: '' }); 
            }, 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-y-auto overflow-x-hidden bg-black selection:bg-accent-500 selection:text-black" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* ─── Slideshow de Fondo ────────────────────────────────────────── */}
            <div className="absolute inset-0">
                {SLIDES.map((s, i) => (
                    <div
                        key={i}
                        className="absolute inset-0 transition-opacity duration-1500"
                        style={{ opacity: i === slide ? 1 : 0 }}
                    >
                        <img src={s.img} alt={s.title} className="w-full h-full object-cover scale-105" 
                             style={{ filter: 'brightness(0.65)' }} />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                    </div>
                ))}
            </div>

            {/* ─── Contenido Centrado ─────────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6">
                
                {/* Header / Logo (Top Left) */}
                <div className="absolute top-6 lg:top-8 left-6 lg:left-8 flex items-center gap-3 lg:gap-4 group z-[60]">
                    <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full overflow-hidden ring-2 ring-accent-400/50 shadow-2xl transition-transform group-hover:scale-110 duration-500">
                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                        <p className="text-white font-black text-lg lg:text-xl leading-tight tracking-wider drop-shadow-md">HOTEL BALCÓN PLAZA</p>
                        <p className="text-accent-500 text-[8px] lg:text-[10px] font-black tracking-[0.3em] uppercase drop-shadow-sm">Belalcázar, Caldas</p>
                    </div>
                </div>



                {/* Texto Principal */}
                <div className="max-w-4xl space-y-6">
                    {SLIDES.map((s, i) => (
                        <div key={i} className={`transition-all duration-1000 ${i === slide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute inset-x-0'}`}>
                            {i === slide && (
                                <>
                                    <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                                        {s.title}
                                    </h1>
                                    <p className="text-white/80 text-base sm:text-lg md:text-xl lg:text-2xl font-medium mt-4 max-w-2xl mx-auto drop-shadow-lg px-4 sm:px-0">
                                        {s.sub}
                                    </p>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Botones de Acción */}
                <div className="mt-8 lg:mt-12 flex flex-col items-center gap-6 w-full">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-8 py-4 lg:px-12 lg:py-5 rounded-full bg-gradient-to-r from-accent-500 to-accent-700 text-black font-black text-lg lg:text-xl tracking-widest uppercase shadow-[0_0_40px_rgba(253,185,19,0.3)] hover:shadow-[0_0_60px_rgba(253,185,19,0.5)] hover:scale-105 transition-all duration-300 active:scale-95"
                    >
                        🛎️ Reservar Ahora
                    </button>
                    
                    <div className="flex flex-wrap justify-center gap-2 lg:gap-4 px-4">
                        {['⛪ Turismo', '☕ Café', '💆 Spa', '🛌 Habitaciones'].map(tag => (
                            <span key={tag} className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl bg-white/10 backdrop-blur-md text-white/70 text-[10px] lg:text-sm font-semibold border border-white/10">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ─── Botones de Contacto Flotantes (Persistentes) ────────── */}
                <div className="fixed bottom-24 right-8 z-[60] flex flex-col items-end gap-3">
                    
                    {/* Botón de WhatsApp */}
                    <a href="https://wa.me/573218051869" target="_blank" rel="noreferrer" 
                       className="flex items-center gap-3 bg-emerald-500 text-black px-6 py-3.5 rounded-full font-black shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:scale-110 hover:shadow-[0_15px_40px_rgba(16,185,129,0.6)] transition-all duration-300 group">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="text-sm font-black tracking-tighter">321 805 1869</span>
                    </a>

                    {/* Redes Sociales e Email */}
                    <div className="flex gap-2 pr-1">
                        <a href="https://www.facebook.com/share/1EUGiqa6xF/" target="_blank" rel="noreferrer" 
                           className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full border border-white/20 backdrop-blur-md transition-all duration-300 hover:scale-110">
                            <Facebook className="w-5 h-5 text-white" />
                        </a>
                        <a href="https://www.instagram.com/hotelbalconplaza?igsh=MXE1NGF6OG81eDV3Ng==" target="_blank" rel="noreferrer" 
                           className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full border border-white/20 backdrop-blur-md transition-all duration-300 hover:scale-110">
                            <Instagram className="w-5 h-5 text-white" />
                        </a>
                        <a href="mailto:hotelbalconplaza60@gmail.com" 
                           className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full border border-white/20 backdrop-blur-md transition-all duration-300 hover:scale-110">
                            <Mail className="w-5 h-5 text-white" />
                        </a>
                    </div>
                </div>


                {/* Footer del Hero / Créditos */}
                <div className="mt-auto py-10 lg:absolute lg:bottom-10 lg:inset-x-0 lg:py-0 flex flex-col items-center gap-4">
                    <div className="flex gap-3">
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${i === slide ? 'bg-accent-400 w-12' : 'bg-white/30 w-3 hover:bg-white/50'}`}
                            />
                        ))}
                    </div>
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em] text-center px-4">
                        CRA 4 #11-03 2DO PISO (PLAZA CÓRDOBA) - BELALCÁZAR, CALDAS
                    </p>
                </div>
            </div>


            {/* Modal de Reserva */}

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowModal(false)} />
                    <div className="relative bg-[#1c0f05] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-fade-in overflow-hidden">
                        
                        {/* Decoración */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 blur-[80px] rounded-full" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-500/10 blur-[80px] rounded-full" />

                        <div className="relative">
                            <h3 className="text-2xl font-black text-white mb-1">Solicita tu Reserva</h3>
                            <p className="text-white/50 text-xs mb-6">Déjanos tus datos y nos pondremos en contacto contigo para confirmar tu estadía.</p>

                            {sent ? (
                                <div className="py-12 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                    </div>
                                    <h4 className="text-lg font-bold text-white">¡Reserva finalizada!</h4>
                                    <p className="text-white/40 text-[10px]">Lo estaremos contactando lo más pronto posible. Gracias por elegirnos.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSumbit} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 ml-1">Nombre Completo</label>
                                            <input type="text" required placeholder="Ej: Juan Pérez" 
                                                   value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                                                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-accent-500/50 transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 ml-1">Celular / WhatsApp</label>
                                            <input type="tel" required placeholder="+57 ---" 
                                                   value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})}
                                                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-accent-500/50 transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 ml-1">Correo (Opcional)</label>
                                            <input type="email" placeholder="tu@correo.com" 
                                                   value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})}
                                                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-accent-500/50 transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 ml-1">Huéspedes</label>
                                            <input type="number" min="1" max="10" required 
                                                   value={formData.huespedes} onChange={e => setFormData({...formData, huespedes: e.target.value})}
                                                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-accent-500/50 transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 ml-1">Fecha de Llegada</label>
                                            <input type="date" required 
                                                   value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})}
                                                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-accent-500/50 transition-all text-sm [color-scheme:dark]" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 ml-1">Observación</label>
                                            <textarea rows="2" placeholder="Ej: Me gustaría una habitación con vista al parque..." 
                                                   value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})}
                                                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-accent-500/50 transition-all text-sm resize-none" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-2">
                                        <button 
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 bg-white/10 text-white font-black uppercase tracking-[0.2em] py-3 rounded-xl hover:bg-white/20 transition-all duration-300 text-xs"
                                        >
                                            Regresar
                                        </button>
                                        <button 
                                            disabled={loading} 
                                            type="submit" 
                                            className="flex-[2] bg-white text-black font-black uppercase tracking-[0.1em] py-3 rounded-xl hover:bg-accent-500 transition-all duration-300 disabled:opacity-50 text-xs"
                                        >
                                            {loading ? 'Enviando...' : 'Confirmar'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Animación Custom en CSS inline */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
            `}} />
        </div>
    );
};

export default Landing;
