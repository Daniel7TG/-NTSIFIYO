import React from 'react';
import StatCard from '../common/StatCard';

/**
 * Tarjetas de estadísticas del estudiante.
 * Usa el componente StatCard normalizado.
 */
const StatsCards = ({ level, experience, inrow, finished }) => {
    const cards = [
        {
            id: 'level',
            label: 'Nivel Actual',
            value: level || 1,
            subText: 'Rango actual',
            icon: 'verified',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-500',
            accentColor: 'text-emerald-500',
            gradient: 'from-emerald-500 to-teal-600',
        },
        {
            id: 'streak',
            label: 'Racha de Días',
            value: `${inrow || 0} Días`,
            subText: inrow > 0 ? '¡En racha!' : 'Vuelve mañana',
            icon: 'local_fire_department',
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-500',
            accentColor: 'text-orange-500',
            gradient: 'from-orange-500 to-red-500',
        },
        {
            id: 'xp',
            label: 'Total XP',
            value: (experience || 0).toLocaleString(),
            subText: 'Puntos globales',
            icon: 'emoji_events',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            accentColor: 'text-amber-500',
            gradient: 'from-amber-500 to-yellow-500',
        },
        {
            id: 'finished',
            label: 'Actividades',
            value: finished || 0,
            subText: 'Completadas',
            icon: 'fact_check',
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-500',
            accentColor: 'text-violet-500',
            gradient: 'from-violet-500 to-purple-600',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => (
                <StatCard key={card.id} {...card} animDelay={i * 80} />
            ))}
        </div>
    );
};

export default StatsCards;
