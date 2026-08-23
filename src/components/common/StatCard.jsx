import React from 'react';

/**
 * StatCard — Tarjeta de estadística unificada para Student, Visitor y Teacher dashboards.
 *
 * Props:
 *   id           {string}   — Identificador (ej. "level", "streak", "xp", "finished")
 *   label        {string}   — Etiqueta descriptiva (ej. "Nivel Actual")
 *   value        {string|number} — Valor principal a mostrar
 *   subText      {string}   — Texto secundario debajo del valor
 *   icon         {string}   — Nombre del Material Symbol (ej. "verified")
 *   iconBg       {string}   — Clase Tailwind para el fondo del ícono (ej. "bg-green-50")
 *   iconColor    {string}   — Clase Tailwind para el color del ícono (ej. "text-green-500")
 *   accentColor  {string}   — Clase Tailwind para el color de acento del subText
 *   gradient     {string}   — Clases Tailwind del gradiente para la barra superior (ej. "from-emerald-500 to-teal-600")
 *                             Si se omite, no se muestra la barra de gradiente.
 *   animDelay    {number}   — Delay de animación en ms para el stagger del grid (default: 0)
 */
const StatCard = ({
    id,
    label,
    value,
    subText,
    icon,
    iconBg = 'bg-gray-100',
    iconColor = 'text-gray-500',
    accentColor = 'text-gray-500',
    gradient,
    animDelay = 0,
}) => {
    // Determinar estilo animado 3D e infantil si es una estadística de estudiante/visitante
    const getKidCardStyle = () => {
        switch (id) {
            case 'level':
                return 'border-4 border-emerald-200 shadow-[0_6px_0_#10B981] hover:shadow-[0_10px_0_#10B981] active:shadow-[0_3px_0_#10B981] hover:border-emerald-300';
            case 'streak':
                return 'border-4 border-orange-200 shadow-[0_6px_0_#F97316] hover:shadow-[0_10px_0_#F97316] active:shadow-[0_3px_0_#F97316] hover:border-orange-300';
            case 'xp':
                return 'border-4 border-amber-200 shadow-[0_6px_0_#F59E0B] hover:shadow-[0_10px_0_#F59E0B] active:shadow-[0_3px_0_#F59E0B] hover:border-amber-300';
            case 'finished':
                return 'border-4 border-violet-200 shadow-[0_6px_0_#8B5CF6] hover:shadow-[0_10px_0_#8B5CF6] active:shadow-[0_3px_0_#8B5CF6] hover:border-violet-300';
            default:
                return null;
        }
    };

    const kidCardStyle = getKidCardStyle();
    const cardClass = kidCardStyle
        ? `relative bg-white rounded-[24px] p-5 ${kidCardStyle} hover:-translate-y-1 active:translate-y-0.5 transition-all duration-150 group overflow-hidden`
        : `relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden`;

    return (
        <div
            className={cardClass}
            style={animDelay ? { animationDelay: `${animDelay}ms` } : undefined}
        >
            {/* Barra decorativa de gradiente superior (solo para tarjetas no infantiles) */}
            {gradient && !kidCardStyle && (
                <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} rounded-t-2xl opacity-80 group-hover:opacity-100 transition-opacity`}
                />
            )}

            <div className="flex items-start justify-between">
                {/* Texto */}
                <div>
                    <p className="text-sm text-gray-500 font-bold">{label}</p>
                    <h3 className="text-2xl font-black text-gray-800 mt-1">{value}</h3>
                    {subText && (
                        <p className="text-xs mt-2">
                            <span className={`font-extrabold ${accentColor}`}>{subText}</span>
                        </p>
                    )}
                </div>

                {/* Ícono */}
                <div
                    className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0`}
                >
                    <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
