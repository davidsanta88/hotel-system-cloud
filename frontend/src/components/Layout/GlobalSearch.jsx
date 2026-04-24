import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Hotel, FileText, X, Loader2 } from 'lucide-react';
import api from '../../services/api';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 2) {
                performSearch();
            } else {
                setResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/search?q=${query}`);
            setResults(response.data);
            setShowDropdown(true);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (result) => {
        setQuery('');
        setShowDropdown(false);
        navigate(result.link);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'cliente': return <User size={16} className="text-blue-500" />;
            case 'habitacion': return <Hotel size={16} className="text-emerald-500" />;
            case 'registro': return <FileText size={16} className="text-amber-500" />;
            default: return <Search size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="relative w-full max-w-md group" ref={dropdownRef}>
            <div className={`relative flex items-center transition-all duration-300 ${showDropdown ? 'scale-[1.02]' : ''}`}>
                <Search className={`absolute left-4 transition-colors ${loading ? 'text-primary-500' : 'text-slate-400 group-focus-within:text-primary-500'}`} size={18} />
                <input
                    type="text"
                    placeholder="Buscar por cliente, habitación, documento..."
                    className="w-full pl-12 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowDropdown(true)}
                />
                {query && (
                    <button 
                        onClick={() => setQuery('')}
                        className="absolute right-4 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown de Resultados */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading && results.length === 0 ? (
                            <div className="flex items-center justify-center p-8 text-slate-400">
                                <Loader2 className="animate-spin mr-2" size={20} />
                                <span className="text-xs font-bold uppercase tracking-widest">Buscando...</span>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-1">
                                {results.map((result) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelect(result)}
                                        className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all group/item text-left"
                                    >
                                        <div className="p-2 bg-slate-100 rounded-xl group-hover/item:bg-white transition-colors">
                                            {getIcon(result.type)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{result.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{result.subtitle}</p>
                                        </div>
                                        <div className="ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <div className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-lg uppercase">
                                                Ir
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto mb-3">
                                    <Search size={24} className="text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No se encontraron resultados</p>
                            </div>
                        )}
                    </div>
                    {results.length > 0 && (
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Presiona ENTER para ver más</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
