import React, { useState } from 'react';
import LeaderboardModal from '../common/LeaderboardModal';
import AvatarCard from '../common/AvatarCard';

/**
 * Componente de tabla de líderes (top 5 del dashboard).
 * "Ver puntuaciones" abre el popup paginado con la tabla completa.
 */
const TopLearners = ({ learners, currentUserName }) => {
    const [isBoardOpen, setBoardOpen] = useState(false);

    const data = learners && learners.length > 0 ? learners : [];

    const getPositionStyle = (position, isCurrentUser) => {
        if (isCurrentUser) {
            return 'text-amber-500 font-bold';
        }
        switch (position) {
            case 1: return 'text-amber-500';
            case 2: return 'text-gray-400';
            case 3: return 'text-amber-600';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="kid-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Mejores Estudiantes</h3>
                <button
                    onClick={() => setBoardOpen(true)}
                    className="text-sm font-medium text-amber-500 hover:text-amber-600 flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[16px]">leaderboard</span>
                    Ver puntuaciones
                </button>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-3">
                {data.length > 0 ? (
                    data.slice(0, 5).map((learner, index) => {
                        const isCurrentUser = learner.username
                            ? learner.username === currentUserName
                            : learner.name === currentUserName;
                        return (
                            <div
                                key={learner.username || index}
                                className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isCurrentUser ? 'bg-amber-50' : 'hover:bg-gray-50'
                                    }`}
                            >
                                {/* Position */}
                                <span className={`w-6 text-center font-bold ${getPositionStyle(learner.rank || index + 1, isCurrentUser)}`}>
                                    {learner.rank || index + 1}
                                </span>

                                {/* Avatar */}
                                <AvatarCard avatarId={learner.avatarId} alt={learner.name} size="sm" />

                                {/* Name */}
                                <span className={`flex-1 font-medium truncate ${isCurrentUser ? 'text-gray-800' : 'text-gray-600'}`}>
                                    {learner.name}
                                    {isCurrentUser && <span className="text-xs ml-1 text-gray-400">(Tú)</span>}
                                </span>

                                {/* XP */}
                                <span className="text-sm font-bold text-amber-500">
                                    {(learner.experience || 0).toLocaleString()} XP
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-gray-500 text-sm text-center py-4">Aún no hay compañeros registrados.</div>
                )}
            </div>

            <LeaderboardModal
                isOpen={isBoardOpen}
                onClose={() => setBoardOpen(false)}
                currentUsername={currentUserName}
            />
        </div>
    );
};

export default TopLearners;
