import { useMemo } from 'react';
import {
    studentNavigation,
    visitorNavigation,
    teacherNavigation,
    adminNavigation,
    publicRoutes,
    gameRoutes,
    teacherResourceRoutes,
    adminAuthRoute,
    sidebarConfig
} from '../config/navigation';
import Roles from '../utils/roles';

/**
 * Hook para gestionar la navegación basada en roles.
 * Retorna las rutas autorizadas para el rol del usuario proporcionado,
 * así como la configuración del sidebar correspondiente.
 *
 * @param {string} userRole - El rol del usuario actual (ej. Roles.STUDENT)
 * @returns {Object} { authorizedSidebarRoutes, allAuthorizedRoutes, sidebarConfig, roleLabel, accentColor, homePath }
 */
export const useNavigation = (userRole) => {
    return useMemo(() => {
        // Todas las rutas del sistema combinadas (solo para propósitos de filtrado general si se requiere)
        const allRoutes = [
            ...studentNavigation,
            ...visitorNavigation,
            ...teacherNavigation,
            ...adminNavigation,
            ...publicRoutes,
            ...gameRoutes,
            ...teacherResourceRoutes,
            adminAuthRoute
        ];

        // Filtra todas las rutas a las que este rol tiene acceso
        const allAuthorizedRoutes = allRoutes.filter(route =>
            route.roles && route.roles.includes(userRole)
        );

        // Obtener la configuración específica del sidebar para este rol
        const userSidebarConfig = sidebarConfig[userRole] || {
            menuItems: [],
            roleLabel: 'Usuario',
            accentColor: 'primary',
            homePath: '/'
        };

        return {
            // Rutas específicas para renderizar en el Navbar/Sidebar
            authorizedSidebarRoutes: userSidebarConfig.menuItems,

            // Configuración visual del Sidebar
            roleLabel: userSidebarConfig.roleLabel,
            accentColor: userSidebarConfig.accentColor,
            homePath: userSidebarConfig.homePath,

            // Todas las rutas a las que tiene acceso (útil para guardias de rutas)
            allAuthorizedRoutes
        };
    }, [userRole]);
};

export default useNavigation;
