import React from 'react';

/**
 * PageShell — Contenedor raíz normalizado para todas las páginas dentro del layout principal.
 *
 * Nota: El min-height y el fondo (bg-gray-50 o gradiente) ya los gestiona MainLayout.
 * Este componente solo centra y limita el ancho del contenido.
 *
 * Props:
 *   children  React.ReactNode
 */
const PageShell = ({ children }) => {
    return (
        // <div className="w-full">
            <div className="max-w-6xl mx-auto p-8">
                {children}
            </div>
        // </div>
    );
};

export default PageShell;
