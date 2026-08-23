import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Roles from '../../utils/roles';
import { useBreadcrumb } from '../../context/BreadcrumbContext';

const Breadcrumb = () => {
    const { user } = useAuth();
    const location = useLocation();
    const { breadcrumbs } = useBreadcrumb();

    // Si no estamos en rutas autenticadas o es la landing, no mostrar
    if (!user || location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/registro') {
        return null;
    }

    let rootLabel = 'Panel';
    let rootPath = '/dashboard';

    if (user.userType === Roles.ADMIN) rootLabel = 'Panel Administrador';
    else if (user.userType === Roles.TEACHER) rootLabel = 'Panel Maestro';
    else if (user.userType === Roles.STUDENT || user.userType === Roles.VISITOR) rootLabel = 'Panel Estudiante';

    // Determinar la sección base a partir de la URL
    let baseSection = null;
    const path = location.pathname;

    const sections = {
        '/estudiante/actividades': 'Actividades',
        '/estudiante/asignaciones': 'Asignaciones',
        '/estudiante/contenido': 'Contenido',
        '/estudiante/diccionario': 'Diccionario',
        '/maestro/estudiantes': 'Estudiantes',
        '/maestro/asignaciones': 'Asignaciones',
        '/maestro/recursos': 'Recursos',
        '/maestro/contenido': 'Contenido',
        '/maestro/diccionario': 'Diccionario',
        '/admin/grupos': 'Grupos',
        '/admin/estudiantes': 'Estudiantes',
        '/admin/maestros': 'Maestros',
        '/admin/palabras': 'Palabras',
        '/admin/actividades': 'Actividades',
        '/admin/contenido': 'Contenido',
    };

    // Find the longest matching prefix section
    const matchingPath = Object.keys(sections).find(key => path === key || path.startsWith(key + '/'));
    if (matchingPath) {
        baseSection = { label: sections[matchingPath], path: matchingPath };
    }

    // Generic fallback for game routes
    if (!baseSection && path.startsWith('/games/')) {
        const isTeacher = user?.userType === Roles.TEACHER;
        baseSection = {
            label: isTeacher ? 'Mis Recursos' : 'Actividades',
            path: isTeacher ? '/maestro/recursos' : '/estudiante/actividades'
        };
    }

    // El breadcrumb completo será: Root -> Base Section -> ...breadcrumbs dinámicos
    const fullTrail = [];

    const isDashboard = path === '/dashboard' || path.endsWith('/dashboard');

    if (isDashboard) {
        // En el dashboard, la instrucción dice: "Nunca debes mostrar 'Panel Estudiante > Dashboard', sino unicamente 'Panel Estudiante'"
        return (
            <nav className="text-sm text-gray-500 flex items-center gap-2">
                <span className="text-gray-800 font-bold">{rootLabel}</span>
            </nav>
        );
    }

    // Insert Root
    fullTrail.push({ label: rootLabel, path: rootPath });

    // Insert Base Section
    if (baseSection) {
        fullTrail.push(baseSection);
    }

    // Append dynamic breadcrumbs
    if (breadcrumbs && breadcrumbs.length > 0) {
        breadcrumbs.forEach(b => {
            // Avoid duplicating the base section if the component manually adds it
            const baseIndex = fullTrail.findIndex(i => baseSection && i.label === baseSection.label);
            if (baseIndex !== -1 && b.label === baseSection.label) {
                fullTrail[baseIndex] = { ...fullTrail[baseIndex], ...b };
            } else {
                fullTrail.push(b);
            }
        });
    }

    return (
        <nav className="text-sm text-gray-500 flex items-center gap-2 flex-wrap pb-4">
            {fullTrail.map((item, index) => {
                const isLast = index === fullTrail.length - 1;
                return (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        )}
                        {isLast || (!item.path && !item.onClick) ? (
                            <span className="text-gray-800 font-bold">{item.label}</span>
                        ) : (
                            <Link
                                to={item.path || '#'}
                                onClick={(e) => {
                                    if (item.onClick) {
                                        e.preventDefault();
                                        item.onClick();
                                    }
                                }}
                                className="hover:text-primary transition-colors font-medium">
                                {item.label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumb;
