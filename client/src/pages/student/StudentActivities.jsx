import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../../components/common/SectionHeader';
import PageShell from '../../components/common/PageShell';
import LeaderboardModal from '../../components/common/LeaderboardModal';
import { getActivitiesList } from '../../config/activityConfig';

/**
 * Página de actividades de aprendizaje
 * Muestra una tarjeta por cada tipo de juego: Memorama y Quiz
 */
const StudentActivities = () => {
    const [isBoardOpen, setBoardOpen] = useState(false);

    // Datos del usuario desde localStorage
    const userData = (() => {
        try {
            return JSON.parse(localStorage.getItem('appUser')) || {};
        } catch { return {}; }
    })();

    // Actividades generales (obtenidas desde la configuración centralizada)
    const games = getActivitiesList();

    return (
        <PageShell>
            <SectionHeader
                        title="Actividades de Aprendizaje"
                        subtitle="Selecciona una actividad para practicar y ganar XP."
                    />

                    {/* Game Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {games.map((game) => (
                            <Link
                                key={game.id}
                                to={game.basePath}
                                className="group kid-card-dynamic overflow-hidden flex flex-col h-full"
                                style={{ '--card-color': game.color }}
                            >
                                {/* Icon Header */}
                                <div className="p-8 flex flex-col items-center justify-center shrink-0 border-b-2 border-slate-100" style={{ backgroundColor: game.color + '10' }}>
                                    <div className="w-24 h-24 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        {typeof game.icon === 'string' ? (
                                            <span className="text-7xl">{game.icon}</span>
                                        ) : (
                                            game.icon
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-black" style={{ color: game.color }}>{game.title}</h2>
                                    <p className="text-sm text-gray-500 font-bold mt-1">{game.subtitle}</p>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <p className="text-sm text-gray-600 mb-5 leading-relaxed font-medium grow">
                                        {game.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center justify-around mb-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl shrink-0">
                                        {game.stats.map((stat, idx) => (
                                            <div key={idx} className="flex flex-col items-center gap-1">
                                                <span className="material-symbols-outlined text-lg font-bold" style={{ color: game.color }}>
                                                    {stat.icon}
                                                </span>
                                                <span className="text-xs text-gray-500 font-bold min-w-[60px] text-center">{stat.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <div 
                                        className="w-full py-3 flex items-center justify-center gap-2 text-white font-black rounded-2xl transition-all shrink-0 border-2" 
                                        style={{ 
                                            backgroundColor: game.color,
                                            borderColor: 'rgba(0,0,0,0.15)',
                                            boxShadow: `0 4px 0 rgba(0,0,0,0.15)`
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-lg font-bold">play_arrow</span>
                                        <span>Entrar</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Challenge Banner */}
                    <div className="mt-8 kid-card-amber p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <span className="text-2xl">🏆</span>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-800">¿Listo para un desafío?</h3>
                                <p className="text-sm text-gray-500 font-bold">¡Completa actividades para mantener tu racha y ganar XP!</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setBoardOpen(true)}
                            className="px-6 py-3 bg-[#FF9800] border-2 border-[#E65100] text-white font-black rounded-2xl shadow-[0_4px_0_#C2410C] hover:shadow-[0_6px_0_#C2410C] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_#C2410C] transition-all duration-150 whitespace-nowrap"
                        >
                            Ver puntuaciones
                        </button>
                    </div>

                    <LeaderboardModal
                        isOpen={isBoardOpen}
                        onClose={() => setBoardOpen(false)}
                        currentUsername={userData?.username}
                    />
        </PageShell>
    );
};

export default StudentActivities;
