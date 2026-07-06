import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente de tabla de líderes
 */
const TopLearners = ({ learners, currentUserName }) => {

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
                <Link to="/estudiante/leaderboard" className="text-sm font-medium text-amber-500 hover:text-amber-600">
                    Ver todos
                </Link>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-3">
                {data.length > 0 ? (
                    data.slice(0, 5).map((learner, index) => {
                        const isCurrentUser = learner.name === currentUserName;
                        return (
                            <div
                                key={index}
                                className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isCurrentUser ? 'bg-amber-50' : 'hover:bg-gray-50'
                                    }`}
                            >
                                {/* Position */}
                                <span className={`w-6 text-center font-bold ${getPositionStyle(index + 1, isCurrentUser)}`}>
                                    {index + 1}
                                </span>

                                {/* Avatar */}
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${learner.name}`}
                                    alt={learner.name}
                                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-white"
                                />

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
        </div>
    );
};

export default TopLearners;
