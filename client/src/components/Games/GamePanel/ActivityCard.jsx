import React from 'react';
import { getGameTypeInfo } from '../../../config/activityConfig';
import { darken } from '../../../utils/colorUtils';

function getDifficultyMeta(difficulty) {
    const map = {
        EASY: { label: 'Fácil', color: '#22c55e' },
        MEDIUM: { label: 'Medio', color: '#f59e0b' },
        HARD: { label: 'Difícil', color: '#ef4444' },
    };
    return map[difficulty] || { label: difficulty || 'General', color: '#6b7280' };
}

/**
 * ActivityCard — Tarjeta de actividad con el estilo "kid-card" 3D y color de acento.
 *
 * Props:
 *   activity  — datos de la actividad
 *   userRole  — 'teacher' | 'student'
 *   cardIcon  — nodo del ícono
 *   onEdit    — callback (solo maestro)
 *   onPlay    — callback al jugar
 *   color     — color de acento (si no se pasa, se deriva del tipo de juego)
 *   disabled  — deshabilita el botón de jugar y muestra "Cargando..."
 */
function ActivityCard({
    activity,
    userRole,
    cardIcon,
    onEdit,
    onPlay,
    color,
    disabled = false,
}) {
    const accent = color || getGameTypeInfo(activity.gameType || activity.type).color || '#6b7280';
    const accentBorder = darken(accent, 0.15);
    const accentShadow = darken(accent, 0.32);
    const cardShadow = darken(accent, 0.2);
    const diff = getDifficultyMeta(activity.difficult);
    const teacher = activity.teacherDTO || activity.teacher;

    return (
        <div
            className="group kid-card-dynamic flex flex-col h-full overflow-hidden"
            style={{ '--card-color': accent, '--card-shadow': cardShadow }}
        >
            {/* Botón editar (solo maestro) */}
            {userRole === 'teacher' && onEdit && (
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(activity.id); }}
                    title="Editar"
                    className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border-2 border-slate-100 text-gray-500 hover:text-primary hover:border-primary/30 shadow-sm transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
            )}

            {/* Cabecera con ícono */}
            <div
                className="p-5 flex items-start gap-3 border-b-2 border-slate-100"
                style={{ backgroundColor: accent + '10' }}
            >
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center overflow-hidden p-1 group-hover:scale-110 transition-transform duration-300">
                    {cardIcon}
                </div>
                <div className="min-w-0 flex-1 pr-6">
                    <h3 className="font-black leading-tight truncate" style={{ color: accent }}>
                        {activity.title}
                    </h3>
                    <span
                        className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ backgroundColor: diff.color + '20', color: diff.color }}
                    >
                        {diff.label}
                    </span>
                </div>
            </div>

            {/* Cuerpo */}
            <div className="p-5 flex-1 flex flex-col">
                <p className="text-sm text-gray-600 font-medium leading-relaxed grow">
                    {activity.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-around my-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-lg leading-none">⭐</span>
                        <span className="text-xs font-bold text-gray-500">{(activity.experience || 0) + ' XP'}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-lg leading-none">🎯</span>
                        <span className="text-xs font-bold text-gray-500">{(activity.totalQuestions || 0) + ' items'}</span>
                    </div>
                    {teacher && (
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-lg leading-none">👤</span>
                            <span className="text-xs font-bold text-gray-500 truncate max-w-[70px]">{teacher.firstName}</span>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <button
                    onClick={() => onPlay(activity.id)}
                    disabled={disabled}
                    className="w-full py-3 flex items-center justify-center gap-2 text-white font-black rounded-2xl border-2 transition-all hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{ backgroundColor: accent, borderColor: accentBorder, boxShadow: `0 4px 0 ${accentShadow}` }}
                >
                    <span className="material-symbols-outlined text-lg" style={{ color: 'inherit' }}>play_arrow</span>
                    {disabled ? 'Cargando...' : '¡Jugar Ahora!'}
                </button>
            </div>
        </div>
    );
}

export default ActivityCard;
