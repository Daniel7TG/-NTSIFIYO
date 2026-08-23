import React from 'react';
import { useNavigate } from 'react-router-dom';
import IconWarning from '../../assets/svgs/warning.svg';

/**
 * ErrorState — Estado de error normalizado para todas las vistas.
 *
 * Props:
 *   message      {string}    — Mensaje de error a mostrar
 *   onRetry      {function}  — Callback al presionar "Reintentar". Si se omite, no aparece el botón.
 *   dashboardPath {string}   — Ruta del dashboard al que volver (default: '/dashboard').
 *                              Si se pasa null explícitamente, no muestra el botón de regreso.
 */
const ErrorState = ({ message, onRetry, dashboardPath = '/dashboard' }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-red-100 max-w-2xl mx-auto mt-6">
            <img src={IconWarning} alt="Error" className="w-20 h-20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Ocurrió un problema</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">{message}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {/* Botón Reintentar (opcional) */}
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">refresh</span>
                        Reintentar
                    </button>
                )}

                {/* Botón Volver al Dashboard (opcional) */}
                {dashboardPath !== null && (
                    <button
                        onClick={() => navigate(dashboardPath)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Volver al Dashboard
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorState;
