import React from 'react';

/**
 * LoadingState — Spinner de carga estandarizado para dashboards y paneles.
 *
 * Props:
 *   message {string} — Texto opcional debajo del spinner (default: "Cargando...")
 */
const LoadingState = ({ message = 'Cargando...' }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium tracking-wide">{message}</p>
        </div>
    );
};

export default LoadingState;
