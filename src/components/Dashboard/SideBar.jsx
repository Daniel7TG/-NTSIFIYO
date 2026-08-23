import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useNavigation from '../../hooks/useNavigation';
import AvatarPicker from '../common/AvatarPicker';
import Roles from '../../utils/roles';

/**
 * Sidebar de navegación reutilizable para todos los roles.
 *
 * Props:
 * - role: string       — El rol del usuario desde el enum Roles (ej. Roles.STUDENT)
 * - userName: string   — nombre del usuario
 */
const SideBar = ({ role, userName = '', isOpen, onClose }) => {
    const { authorizedSidebarRoutes: menuItems, roleLabel, accentColor, homePath } = useNavigation(role);
    const location = useLocation();

    // Determinar si un item está activo
    const isActive = (path) => location.pathname === path;

    // Mapas de colores para variantes dinámicas
    const colorMap = {
        primary: {
            gradient: 'from-primary to-primary-dark',
            activeBg: 'bg-primary/10',
            activeText: 'text-primary',
            activeIcon: 'text-primary',
            roleText: 'text-secondary',
        },
        green: {
            gradient: 'from-green-500 to-green-600',
            activeBg: 'bg-green-50',
            activeText: 'text-green-600',
            activeIcon: 'text-green-600',
            roleText: 'text-gray-500',
        },
        amber: {
            gradient: 'from-amber-400 to-orange-500',
            activeBg: 'bg-amber-50',
            activeText: 'text-primary',
            activeIcon: 'text-primary',
            roleText: 'text-primary',
        },
    };

    const colors = colorMap[accentColor] || colorMap.primary;

    // Icono del logo según rol
    const roleIconMap = {
        Administrador: 'admin_panel_settings',
        Maestro: 'school',
        Estudiante: 'person',
        Visitante: 'visibility',
    };
    const roleIcon = roleIconMap[roleLabel] || 'dashboard';

    // Solo estudiante y visitante tienen avatar; maestro y admin conservan el ícono de rol.
    const showAvatar = role === Roles.STUDENT || role === Roles.VISITOR;

    return (
        <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 flex flex-col z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            {/* Logo / Branding */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {/* El picker es un botón: va fuera del Link para no anidar interactivos. */}
                    {showAvatar ? (
                        <AvatarPicker size={56} />
                    ) : (
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0`}>
                            <span className="material-symbols-outlined text-white text-[28px]">{roleIcon}</span>
                        </div>
                    )}
                    <Link to={homePath} className="flex flex-col min-w-0" onClick={onClose}>
                        <span className="font-bold text-lg text-gray-800 truncate">NTS'I FÍYO</span>
                        <span className={`text-xs font-medium ${colors.roleText} truncate`}>
                            {showAvatar && userName ? userName : `Panel ${roleLabel}`}
                        </span>
                    </Link>
                </div>
                {/* Botón de cerrar en móvil */}
                <button
                    onClick={onClose}
                    className="lg:hidden text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg p-1.5 transition-colors flex items-center justify-center"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.id}>
                            <Link
                                to={item.path}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path)
                                    ? `${colors.activeBg} ${colors.activeText} font-semibold`
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span
                                    className={`material-symbols-outlined text-xl ${isActive(item.path) ? colors.activeIcon : 'text-gray-400'
                                        }`}
                                >
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default SideBar;
