import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Sidebar de navegación para el dashboard del maestro
 * Textos en español con traducciones en mazahua
 */
const TeacherSidebar = ({ user }) => {
    const location = useLocation();

    const navItems = [
        { id: 'groups', label: 'Mis Grupos', mazahua: "Nu'u jñatjo", icon: 'groups', path: '/maestro/dashboard' },
        { id: 'students', label: 'Estudiantes', mazahua: "Yomu", icon: 'school', path: '/maestro/estudiantes' },
        { id: 'assignments', label: 'Asignaciones', mazahua: "Nts'ede", icon: 'assignment', path: '/maestro/asignaciones' },
        { id: 'resources', label: 'Recursos', mazahua: "Jña'a", icon: 'library_books', path: '/maestro/recursos' },
        { id: 'settings', label: 'Configuración', mazahua: "Ts'ike", icon: 'settings', path: '/maestro/configuracion' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 flex flex-col z-30">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <div className="flex flex-col gap-0.5">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-4 h-0.5 bg-white rounded-full"></div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-gray-800">NTS'I FÍYO</span>
                        <span className="text-xs text-gray-500">Panel del Maestro</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.id}>
                            <Link
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path)
                                    ? 'bg-green-50 text-green-600 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${isActive(item.path) ? 'text-green-600' : 'text-gray-400'
                                    }`}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* User Profile Card at Bottom */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <img
                        src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher"}
                        alt="Avatar del maestro"
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">
                            {user?.name || 'Maria Gonzalez'}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                            {user?.email || 'maria.g@school.edu'}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default TeacherSidebar;
