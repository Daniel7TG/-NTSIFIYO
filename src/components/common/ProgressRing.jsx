import React from 'react';

/**
 * ProgressRing — Anillo de progreso SVG unificado.
 * Basado en el diseño de GameSummary (viewBox 100×100, r=40, circumference≈251).
 *
 * Props:
 *   value        {number}  — Valor actual (ej. correctAnswers, currentXP)
 *   max          {number}  — Valor máximo (ej. totalQuestions, xpPerLevel)
 *   size         {number}  — Tamaño del SVG en px (default: 150)
 *   strokeWidth  {number}  — Grosor del trazo (default: 12)
 *   centerLabel  {React.ReactNode} — Contenido del centro (default: porcentaje)
 *   showTier     {boolean} — Si true, usa colores de tier (low/medium/high/perfect) como GameSummary
 *   color        {string}  — Color hexadecimal del trazo (si showTier=false). Default: '#f59e0b'
 *   className    {string}  — Clases extras para el contenedor
 */
const ProgressRing = ({
    value = 0,
    max = 100,
    size = 150,
    strokeWidth = 12,
    centerLabel,
    showTier = false,
    color = '#f59e0b',
    className = '',
}) => {
    const safeMax = max > 0 ? max : 1;
    const safeValue = Math.min(value, safeMax);
    const percentage = Math.round((safeValue / safeMax) * 100);

    // SVG geometry — viewBox 100×100, r=40 → circumference ≈ 251
    const r = 40;
    const cx = 50;
    const cy = 50;
    const circumference = 2 * Math.PI * r; // ≈ 251.33

    const offset = circumference - (percentage / 100) * circumference;

    // Tier colours (same as GameSummary CSS)
    const getTierColor = (pct) => {
        if (pct >= 100) return '#fbbf24'; // perfect — amber-400
        if (pct >= 70)  return '#22c55e'; // high    — green-500
        if (pct >= 40)  return '#f59e0b'; // medium  — amber-500
        return '#ef4444';                  // low     — red-500
    };

    const strokeColor = showTier ? getTierColor(percentage) : color;

    const defaultCenter = (
        <>
            <span className="text-3xl font-bold text-gray-800">{percentage}%</span>
        </>
    );

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 100 100"
                className="transform -rotate-90"
                style={{ width: size, height: size }}
            >
                {/* Background track */}
                <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            {/* Centre label — rendered on top, not rotated */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                {centerLabel !== undefined ? centerLabel : defaultCenter}
            </div>
        </div>
    );
};

export default ProgressRing;
