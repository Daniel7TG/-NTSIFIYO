import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Componente para proteger rutas basadas en permisos.
 * @param {boolean} isAllowed - Condición de autorización.
 * @param {string} redirectPath - Ruta a redireccionar si no está autorizado.
 * @param {ReactNode} children - Componente hijo (opcional, por defecto usa Outlet).
 */
const ProtectedRoute = ({ isAllowed, redirectPath = '/auth', children }) => {
    if (!isAllowed) {
        return <Navigate to={redirectPath} replace />;
    }
    return children ? children : <Outlet />;
};

export default ProtectedRoute;
