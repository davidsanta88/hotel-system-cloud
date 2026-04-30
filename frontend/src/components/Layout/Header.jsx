import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { User, Menu, ExternalLink } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const Header = ({ setSidebarOpen }) => {
    const { user, hotelConfig } = useContext(AuthContext);

    // Determinar a qué hotel redirigir en el botón de cambio
    const isColonial = hotelConfig?.nombre?.toLowerCase()?.includes('colonial');
    const switchHotelLabel = isColonial ? 'Ir al Plaza' : 'Ir al Colonial';
    const switchHotelUrl = isColonial ? 'https://www.hotelbalconplaza.com/login' : 'https://www.hotelbalconcolonial.com/login';

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 w-full relative print:hidden">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="mr-2 lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                    <Menu size={24} />
                </button>
                
                {/* Identidad del Hotel */}
                <div className="flex items-center gap-3 sm:gap-4 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all hover:shadow-md">
                    <img src={hotelConfig?.logoUrl || "/logo.jpg"} alt="Logo Hotel" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-sm border border-slate-100" />
                    <div className="flex flex-col">
                        <h2 className="text-sm sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-none uppercase">
                            {hotelConfig?.nombre || 'Hotel Balcón Plaza'}
                        </h2>
                    </div>
                </div>
 
                {/* Botón de Cambio de Hotel */}
                <a 
                    href={switchHotelUrl}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] sm:text-xs font-black hover:bg-amber-100 transition-all shadow-sm"
                    title={switchHotelLabel}
                >
                    <ExternalLink size={14} className="text-amber-500" />
                    <span className="uppercase tracking-widest">{switchHotelLabel}</span>
                </a>
            </div>

            {/* Buscador Global Agil */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <GlobalSearch />
            </div>

            <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-800">{user?.nombre}</p>
                    <p className="text-xs text-gray-500">{user?.rol_id === 1 || user?.rol_nombre === 'Admin' || user?.nombre === 'Administrador' ? 'Administrador' : 'Empleado'}</p>
                </div>
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 shrink-0">
                    <User size={20} />
                </div>
            </div>
        </header>
    );
};

export default Header;
