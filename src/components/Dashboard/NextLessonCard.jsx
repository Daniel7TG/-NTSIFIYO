import React from 'react';
import { Link } from 'react-router-dom';
import ActivityTypes from '../../config/activityConfig';

/**
 * Tarjeta de la próxima lección con preview (actividades pendientes)
 */
const NextLessonCard = ({ pendingActivities }) => {

    if (!pendingActivities || pendingActivities.length === 0) {
        return (
            <div className="kid-card-green p-6 text-center py-10">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-500 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">task_alt</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">¡Todo al día!</h3>
                <p className="text-gray-500">No tienes actividades pendientes por el momento. ¡Buen trabajo!</p>
            </div>
        );
    }

    // Tomar la primera actividad pendiente
    const nextGame = pendingActivities[0];
    const isMemory = nextGame.gameType === ActivityTypes.fastMemory?.value || nextGame.gameType === ActivityTypes.memoryGame?.value;

    return (
        <div className="kid-card-green p-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Lesson Image Placeholder */}
                <div className="relative w-full md:w-48 h-40 md:h-auto flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: '4rem' }}>
                        {isMemory ? 'style' : 'quiz'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-xl"></div>
                </div>

                {/* Lesson Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded-md">
                                Próxima Actividad Pendiente
                            </span>
                            <span className="text-xs text-gray-400 font-medium">Asignada</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{nextGame.title || 'Actividad Sin Título'}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                            Continúa con tu aprendizaje resolviendo este reto que tu profesor te ha preparado.
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm font-medium text-gray-500">
                            {pendingActivities.length > 1 && `+ ${pendingActivities.length - 1} pendientes`}
                        </div>

                        {/* Resume Button */}
                        <Link
                            to={`/games/${isMemory ? 'memorama' : 'quiz'}/jugar/${nextGame.gameId}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF9800] border-2 border-[#E65100] text-white font-bold rounded-2xl shadow-[0_4px_0_#C2410C] hover:shadow-[0_6px_0_#C2410C] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_#C2410C] transition-all duration-150"
                        >
                            <span>Comenzar</span>
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NextLessonCard;
