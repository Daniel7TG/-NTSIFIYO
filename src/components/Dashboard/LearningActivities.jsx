import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Sección de actividades de aprendizaje
 */
const LearningActivities = ({ activities }) => {
    const defaultActivities = [
        {
            id: 'pronunciation',
            title: 'Pronunciación',
            subtitle: 'Domina el saltillo',
            icon: 'mic',
            iconBg: 'bg-pink-100',
            iconColor: 'text-pink-500',
            progress: 60,
            progressColor: 'bg-pink-400'
        },
        {
            id: 'grammar',
            title: 'Gramática',
            subtitle: 'Conjugaciones verbales',
            icon: 'auto_stories',
            iconBg: 'bg-teal-100',
            iconColor: 'text-teal-500',
            progress: 25,
            progressColor: 'bg-teal-400'
        },
        {
            id: 'vocabulary',
            title: 'Vocabulario',
            subtitle: 'Miembros de la familia',
            icon: 'group',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-500',
            progress: 45,
            progressColor: 'bg-orange-400'
        }
    ];

    const data = activities || defaultActivities;

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800">Actividades de Aprendizaje</h3>
                <Link to="/estudiante/actividades" className="text-sm font-medium text-amber-500 hover:text-amber-600">
                    Ver todas
                </Link>
            </div>

            {/* Activity Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.map((activity) => (
                    <Link
                        key={activity.id}
                        to={`/games/${activity.id === 'vocabulary' ? 'memorama' : 'quiz'}`}
                        className="group p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all"
                    >
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl ${activity.iconBg} flex items-center justify-center mb-4`}>
                            <span className={`material-symbols-outlined ${activity.iconColor}`}>
                                {activity.icon}
                            </span>
                        </div>

                        {/* Text */}
                        <h4 className="font-semibold text-gray-800">{activity.title}</h4>
                        <p className="text-sm text-gray-400">{activity.subtitle}</p>

                        {/* Progress Bar */}
                        <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${activity.progressColor} rounded-full transition-all duration-500`}
                                style={{ width: `${activity.progress}%` }}
                            ></div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default LearningActivities;
