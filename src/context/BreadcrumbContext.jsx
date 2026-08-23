import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BreadcrumbContext = createContext();

export const useBreadcrumb = () => {
    return useContext(BreadcrumbContext) || { breadcrumbs: [], updateBreadcrumbs: () => { } };
};

export const BreadcrumbProvider = ({ children }) => {
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const location = useLocation();

    useEffect(() => {
        // Rutas base: Si el usuario navega directamente a una de estas, 
        // se asume un salto de menú y se limpia la pila dinámica.
        const baseRoutes = [
            '/',
            '/dashboard',
            '/estudiante/dashboard',
            '/estudiante/actividades',
            '/estudiante/asignaciones',
            '/estudiante/contenido',
            '/estudiante/diccionario',
            '/maestro/dashboard',
            '/maestro/estudiantes',
            '/maestro/asignaciones',
            '/maestro/recursos',
            '/maestro/diccionario',
            '/admin/dashboard',
            '/admin/grupos',
            '/admin/estudiantes',
            '/admin/maestros',
            '/admin/palabras',
            '/admin/actividades',
            '/admin/contenido'
        ];

        if (baseRoutes.includes(location.pathname)) {
            setBreadcrumbs([]);
        }
    }, [location.pathname]);

    const updateBreadcrumbs = useCallback((newBreadcrumbs) => {
        setBreadcrumbs(newBreadcrumbs);
    }, []);

    return (
        <BreadcrumbContext.Provider value={{ breadcrumbs, updateBreadcrumbs }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};
