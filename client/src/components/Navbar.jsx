import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Roles from '../utils/roles';
import { useAuth } from '../context/AuthContext';
import GoogleAuthService from '../services/GoogleAuthService';
import { getAvatarUrl } from '../config/avatars';
import appIcon from '../assets/app-icon.webp';

/**
 * Componente de Navegación Principal.
 * Auto-hide: se oculta al hacer scroll down, reaparece al scroll up.
 * Transparente en el top (sobre el hero oscuro) en la ruta /.
 */
const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    // ── Auto-hide logic ──────────────────────────────────
    const [hidden, setHidden] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const lastScrollY = useRef(0);

    const isHome = location.pathname === '/';

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 50);
            // Only hide/show after passing a small threshold
            if (Math.abs(y - lastScrollY.current) < 8) return;
            // Keep navbar fixed when user is inside the dashboard
            if (!user) {
                setHidden(y > lastScrollY.current && y > 100);
            } else {
                setHidden(false);
            }
            lastScrollY.current = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [user]);

    const handleLogout = () => {
        logout();
        GoogleAuthService.disableAutoSelect();
        navigate('/');
    };

    // Obtener la inicial del nombre o username
    const getInitial = () => {
        if (!user) return '?';
        const name = user.name || user.username || '';
        return name.charAt(0).toUpperCase();
    };

    const getRouteAuthenticated = () => {
        switch (user.userType) {
            case "ADMIN": return "/admin/dashboard";
            case "TEACHER": return "/maestro/dashboard";
            case "STUDENT": return "/estudiante/dashboard";
            case "VISITOR": return "/visitante/dashboard";
            default: return "/";
        }
    }

    // Solo estudiante y visitante tienen avatar; los demás siguen con la inicial.
    const hasAvatar = user?.userType === Roles.STUDENT || user?.userType === Roles.VISITOR;

    // Color del badge según el rol
    const getRoleBadge = () => {
        if (!user) return null;
        const roleMap = {
            [Roles.TEACHER]: { label: 'Maestro', color: 'bg-green-100 text-green-700' },
            [Roles.STUDENT]: { label: 'Alumno', color: 'bg-blue-100 text-blue-700' },
            [Roles.VISITOR]: { label: 'Visitante', color: 'bg-purple-100 text-purple-700' },
            [Roles.ADMIN]: { label: 'Admin', color: 'bg-red-100 text-red-700' }
        };
        return roleMap[user.userType] || { label: user.userType, color: 'bg-gray-100 text-gray-700' };
    };

    // ── Dynamic styles ───────────────────────────────────
    const isTransparent = isHome && !scrolled;

    const headerClasses = [
        'fixed top-0 z-50 w-full transition-all duration-350 ease-in-out',
        hidden ? '-translate-y-full' : 'translate-y-0',
        isTransparent
            ? 'bg-transparent border-b border-transparent'
            : 'bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 shadow-sm',
    ].join(' ');

    const logoTextColor = isTransparent
        ? 'text-white'
        : 'text-text-main-light dark:text-text-main-dark';

    const linkTextColor = isTransparent
        ? 'text-white/80 hover:text-white'
        : 'text-text-sub-light hover:text-primary dark:text-text-sub-dark';

    return (
        <header className={headerClasses}>
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* Logo + Nav agrupados a la izquierda */}
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2">
                        <img
                            src={appIcon}
                            alt="NTS'I FÍYO"
                            width="36"
                            height="36"
                            className="h-9 w-9 object-contain drop-shadow-sm"
                        />
                        <h1 className={`text-xl font-bold tracking-tight ${logoTextColor}`}>
                            NTS'I FÍYO
                        </h1>
                    </Link>

                    {/* Menú de Navegación (Escritorio) */}
                    <nav className="hidden md:flex items-center gap-6">
                        <NavLink
                            to="/nosotros"
                            className={({ isActive }) =>
                                `text-sm font-semibold transition-colors px-2 py-1 rounded-md ${
                                    isActive
                                        ? (isTransparent ? 'text-white bg-white/15' : 'text-primary bg-primary/10')
                                        : linkTextColor
                                }`
                            }
                        >
                            Nosotros
                        </NavLink>
                    </nav>
                </div>

                {/* Acciones de Usuario */}
                <div className="flex items-center gap-3">
                    {user ? (
                        /* ===== USUARIO AUTENTICADO ===== */
                        <>
                            {/* Badge de rol */}
                            {getRoleBadge() && (
                                <span className={`hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleBadge().color}`}>
                                    {getRoleBadge().label}
                                </span>
                            )}

                            {/* Avatar + nombre */}
                            <Link
                                to={getRouteAuthenticated()}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${isTransparent ? 'hover:bg-white/10' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                {hasAvatar ? (
                                    <img
                                        src={getAvatarUrl(user.avatarId)}
                                        alt="Tu avatar"
                                        className="w-8 h-8 rounded-full object-cover border-2 border-primary bg-white"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                                        {getInitial()}
                                    </div>
                                )}
                                <span className={`hidden sm:block text-sm font-medium max-w-[120px] truncate ${logoTextColor}`}>
                                    {user.firstname}
                                </span>
                            </Link>

                            {/* Botón cerrar sesión */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center h-9 px-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Cerrar sesión"
                            >
                                <span className="material-symbols-outlined text-lg">logout</span>
                                <span className="hidden sm:inline ml-1">Salir</span>
                            </button>
                        </>
                    ) : (
                        /* ===== NO AUTENTICADO ===== */
                        <>
                            <Link
                                to="/auth"
                                state={{ mode: 'login' }}
                                className={`hidden sm:flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg transition-colors ${
                                    isTransparent
                                        ? 'text-white hover:bg-white/10'
                                        : 'text-text-main-light dark:text-text-main-dark hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                Iniciar Sesión
                            </Link>

                            <Link
                                to="/auth"
                                state={{ mode: 'register' }}
                                className="flex items-center justify-center h-9 px-4 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
                            >
                                Registrarse
                            </Link>
                        </>
                    )}

                    {/* Menú Móvil */}
                    <button
                        onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
                        className={`lg:hidden flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                            isTransparent
                                ? 'text-white hover:bg-white/10'
                                : 'text-text-main-light dark:text-text-main-dark hover:bg-gray-100'
                        }`}
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;