import React from 'react';
import { Link } from 'react-router-dom';
import ProgressRing from '../common/ProgressRing';

/**
 * Componente de progreso actual con anillo circular.
 * Usa el componente ProgressRing unificado.
 */
const CurrentProgress = ({ experience = 0, level = 1 }) => {
    // Cada nivel requiere 1000 XP (lógica temporal hasta que el backend provea nextLevelExp)
    const xpPerLevel = 1000;
    const currentLevelXP = experience % xpPerLevel;
    const percentage = Math.round((currentLevelXP / xpPerLevel) * 100) || 0;
    const lessonsRemaining = Math.max(1, Math.round((100 - percentage) / 10));

    const levelName = `Nivel ${level}`;
    const message = `¡Estás progresando muy bien! Obtén más XP o completa ~${lessonsRemaining} lecciones para superar el nivel actual.`;

    const centerLabel = (
        <>
            <span className="text-3xl font-bold text-gray-800">{percentage}%</span>
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider mt-0.5">
                Completado
            </span>
        </>
    );

    return (
        <div className="kid-card-amber p-6">
            <h3 className="font-bold text-gray-800 mb-6">Progreso Actual</h3>

            {/* Progress Ring */}
            <div className="flex justify-center mb-6">
                <ProgressRing
                    value={currentLevelXP}
                    max={xpPerLevel}
                    size={150}
                    strokeWidth={12}
                    color="#f59e0b"
                    centerLabel={centerLabel}
                />
            </div>

            {/* Level Info */}
            <div className="text-center">
                <h4 className="font-semibold text-gray-800 mb-2">{levelName}</h4>
                <p className="text-sm text-gray-500 mb-4">{message}</p>

                <Link
                    to="/estudiante/progreso"
                    className="inline-block w-full py-3 border-3 border-gray-200 text-gray-700 font-bold rounded-2xl shadow-[0_4px_0_#cbd5e1] hover:shadow-[0_6px_0_#cbd5e1] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_#cbd5e1] transition-all duration-150 bg-white"
                >
                    Ver Ruta Completa
                </Link>
            </div>
        </div>
    );
};

export default CurrentProgress;
