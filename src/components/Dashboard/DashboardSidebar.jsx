import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Sidebar de navegación para el dashboard del estudiante
 */
const DashboardSidebar = ({ user }) => {
    const location = useLocation();

    const navItems = [
        { id: 'courses', label: 'Mis Cursos', icon: 'menu_book', path: '/estudiante/dashboard' },
        { id: 'activities', label: 'Actividades', icon: 'sports_esports', path: '/estudiante/actividades' },
        { id: 'progress', label: 'Progreso', icon: 'trending_up', path: '/estudiante/progreso' },
        { id: 'settings', label: 'Configuración', icon: 'settings', path: '/estudiante/configuracion' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-40">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">文</span>
                    </div>
                    <span className="font-bold text-lg text-gray-800">NTS'I FÍYO</span>
                </Link>
            </div>

            {/* User Profile Card */}
            <div className="p-4">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria"}
                                alt="Avatar"
                                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">{user?.name || 'Maria Gonzalez'}</h3>
                            <span className="text-xs font-medium text-primary px-2 py-0.5 bg-orange-100 rounded-full">
                                Nivel A1 Estudiante
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.id}>
                            <Link
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path)
                                    ? 'bg-amber-50 text-primary font-semibold'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${isActive(item.path) ? 'text-primary' : 'text-gray-400'
                                    }`}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Cerrar Sesión */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default DashboardSidebar;
