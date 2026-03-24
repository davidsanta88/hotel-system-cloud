import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard'); // Ajustamos al nuevo dashboard path
        } catch {
            setError('Correo o contraseña incorrectos. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" 
             style={{ 
                 fontFamily: "'Inter', sans-serif",
                 background: 'linear-gradient(135deg, #1c0f05 0%, #2d1a09 100%)' 
             }}>
            
            {/* Fondo con imagen de hotel desenfocada */}
            <div className="absolute inset-0 opacity-40">
                <img src="/hotel_noche.jpg" alt="Background" className="w-full h-full object-cover blur-sm" />
                <div className="absolute inset-0 bg-black/60" />
            </div>

            {/* Card de Login */}
            <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
                
                {/* Botón Volver */}
                <Link to="/" className="absolute -top-12 left-6 text-white/50 hover:text-accent-400 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Volver al Inicio
                </Link>

                <div className="bg-black/40 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    
                    {/* Logo y Título */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-primary-500/30 mb-4 shadow-2xl">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-white text-3xl font-black tracking-tight">Iniciar Sesión</h1>
                        <p className="text-accent-400/60 text-xs font-bold uppercase tracking-[0.2em] mt-2">Panel Administrativo</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm text-center font-medium animate-pulse">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-white/40 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Correo Electrónico</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all text-sm"
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-white/40 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Contraseña</label>
                            <input
                                type={showPass ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all text-sm"
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 bottom-4 text-white/20 hover:text-primary-400 transition-colors">
                                {showPass 
                                    ? <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                }
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 text-white font-black text-xs tracking-widest uppercase shadow-lg hover:shadow-primary-900/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Verificando...' : 'Acceder al Sistema'}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-white/20 text-[10px] font-bold tracking-widest uppercase">
                            © {new Date().getFullYear()} HOTEL BALCÓN PLAZA
                        </p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </div>
    );
};

export default Login;
