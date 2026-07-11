import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import PageShell from '../../components/common/PageShell';
import StatCard from '../../components/common/StatCard';
import ProgressRing from '../../components/common/ProgressRing';
import SectionHeader from '../../components/common/SectionHeader';
import LeaderboardModal from '../../components/common/LeaderboardModal';
import AvatarCard from '../../components/common/AvatarCard';
import { useAuth } from '../../context/AuthContext';
import { useVisitorDashboardQuery, useVisitorInvalidate } from '../../hooks/useVisitorQueries';
import { ACTIVITY_CONFIG, ActivityTypes } from '../../config/activityConfig';
import { GAME_TOPICS } from '../../utils/gameCategories';

/* ──────────────────────────────────────────────────────────────────────────────
   Helper: map gameType string from the API to ActivityTypes enum
   ──────────────────────────────────────────────────────────────────────────── */
const GAME_TYPE_MAP = {
    QUESTIONNAIRE: ActivityTypes.QUESTIONNAIRE,
    FAST_MEMORY: ActivityTypes.FAST_MEMORY,
    PAIR: ActivityTypes.MEMORY_GAME,
    INTRUDER: ActivityTypes.INTRUDER,
    // PUZZLE: ActivityTypes.PUZZLE,
    MEMORY_GAME: ActivityTypes.MEMORY_GAME,
    LOTTERY: ActivityTypes.LOTTERY,
    MAZE: ActivityTypes.MAZE,
    PAIRS: ActivityTypes.PAIRS,
};

const resolveGameConfig = (gameType) => {
    const mapped = GAME_TYPE_MAP[gameType] || gameType;
    return ACTIVITY_CONFIG[mapped] || null;
};

const resolveTopicLabel = (topicId) => {
    const topic = GAME_TOPICS.find(t => t.id === topicId);
    return topic ? topic.label : topicId;
};

/* ──────────────────────────────────────────────────────────────────────────────
   Sub-component: Stats Cards (visitor) — usa el StatCard unificado
   ──────────────────────────────────────────────────────────────────────────── */
const VisitorStatsCards = ({ level, experience, inrow, totalActivitiesCompleted }) => {
    const cards = [
        {
            id: 'level',
            label: 'Nivel Actual',
            value: level || 1,
            subText: `Nivel ${level || 1}`,
            icon: 'verified',
            gradient: 'from-emerald-500 to-teal-600',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            accentColor: 'text-emerald-600',
        },
        {
            id: 'streak',
            label: 'Racha de Días',
            value: `${inrow || 0}`,
            subText: inrow > 0 ? '¡En racha!' : 'Vuelve mañana',
            icon: 'local_fire_department',
            gradient: 'from-orange-500 to-red-500',
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            accentColor: 'text-orange-600',
        },
        {
            id: 'xp',
            label: 'Total XP',
            value: (experience || 0).toLocaleString(),
            subText: 'Puntos globales',
            icon: 'emoji_events',
            gradient: 'from-amber-500 to-yellow-500',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            accentColor: 'text-amber-600',
        },
        {
            id: 'finished',
            label: 'Actividades',
            value: totalActivitiesCompleted || 0,
            subText: 'Completadas',
            icon: 'fact_check',
            gradient: 'from-violet-500 to-purple-600',
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-600',
            accentColor: 'text-violet-600',
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

/* ──────────────────────────────────────────────────────────────────────────────
   Sub-component: XP Progress Ring (level progress)
   ──────────────────────────────────────────────────────────────────────────── */
const VisitorProgress = ({ totalExperience = 0, level = 1 }) => {
    const xpPerLevel = 100;
    const currentLevelXP = totalExperience % xpPerLevel;
    const xpToNext = xpPerLevel - currentLevelXP;

    const centerLabel = (
        <>
            <span className="text-3xl font-bold text-gray-800">{Math.round((currentLevelXP / xpPerLevel) * 100)}%</span>
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider mt-0.5">
                Nivel {level}
            </span>
        </>
    );

    return (
        <div className="kid-card-amber p-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">trending_up</span>
                Progreso Actual
            </h3>

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
                <p className="text-sm text-gray-500 mb-1">
                    <span className="font-bold text-gray-700">{currentLevelXP}</span> / {xpPerLevel} XP
                </p>
                <p className="text-xs text-gray-400">
                    Faltan <span className="font-semibold text-amber-600">{xpToNext} XP</span> para el nivel {level + 1}
                </p>
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────────────────────
   Sub-component: Recent Activities Timeline
   ──────────────────────────────────────────────────────────────────────────── */
const RecentActivities = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="kid-card-green p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500">history</span>
                    Actividades Recientes
                </h3>
                <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-gray-400">sports_esports</span>
                    </div>
                    <p className="text-gray-500 font-medium">Aún no has completado actividades</p>
                    <p className="text-sm text-gray-400 mt-1">¡Comienza a jugar para ver tu historial aquí!</p>
                </div>
            </div>
        );
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="kid-card-green p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500">history</span>
                    Actividades Recientes
                </h3>
            </div>

            <div className="space-y-4">
                {activities.map((activity, index) => {
                    const config = resolveGameConfig(activity.gameType);
                    const topicLabel = resolveTopicLabel(activity.gameTopic);
                    const scorePercent = activity.totalQuestions > 0
                        ? Math.round((activity.correctAnswers / activity.totalQuestions) * 100)
                        : 0;

                    return (
                        <div
                            key={activity.activityId || index}
                            className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                                activity.passed
                                    ? 'border-emerald-100 bg-emerald-50/30 hover:border-emerald-200'
                                    : 'border-red-100 bg-red-50/30 hover:border-red-200'
                            }`}
                        >
                            {/* Game icon */}
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                                style={{ backgroundColor: config?.color || '#6b7280' }}
                            >
                                <span className="material-symbols-outlined text-xl">
                                    {config?.materialIcon || 'sports_esports'}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-gray-800 truncate">
                                            {activity.gameTitle}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {topicLabel}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {formatDate(activity.completedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    {/* XP badge */}
                                    <div className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full">
                                        <span className="material-symbols-outlined text-sm">bolt</span>
                                        <span className="text-xs font-bold">+{activity.experienceEarned} XP</span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                                                activity.passed
                                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                    : 'bg-gradient-to-r from-red-400 to-red-500'
                                            }`}
                                            style={{ width: `${scorePercent}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 whitespace-nowrap">
                                        {activity.correctAnswers}/{activity.totalQuestions}
                                    </span>
                                    {activity.passed ? (
                                        <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-red-400 text-lg">cancel</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────────────────────
   Sub-component: Top Users Leaderboard
   ──────────────────────────────────────────────────────────────────────────── */
const TopUsersLeaderboard = ({ topUsers, currentUserName }) => {
    const [isBoardOpen, setBoardOpen] = useState(false);

    const data = topUsers && topUsers.length > 0 ? topUsers : [];

    const getMedalIcon = (rank) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return null;
        }
    };

    const getRankBg = (rank) => {
        switch (rank) {
            case 1: return 'bg-amber-50 border-amber-200';
            case 2: return 'bg-gray-50 border-gray-200';
            case 3: return 'bg-orange-50 border-orange-200';
            default: return 'hover:bg-gray-50 border-transparent';
        }
    };

    return (
        <div className="kid-card p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">leaderboard</span>
                    Tabla de Líderes
                </h3>
                <button
                    onClick={() => setBoardOpen(true)}
                    className="text-sm font-medium text-amber-500 hover:text-amber-600 whitespace-nowrap"
                >
                    Ver puntuaciones
                </button>
            </div>

            <div className="space-y-2">
                {data.length > 0 ? (
                    data.map((user, index) => {
                        const isCurrentUser = user.username === currentUserName;
                        const rank = user.rank || index + 1;
                        const medal = getMedalIcon(rank);
                        const rankBg = getRankBg(rank);
                        const displayName = user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username;

                        return (
                            <div
                                key={user.username || index}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${rankBg} ${
                                    isCurrentUser ? 'ring-2 ring-amber-300 ring-offset-1' : ''
                                }`}
                            >
                                {/* Rank */}
                                <div className="w-8 text-center flex-shrink-0">
                                    {medal ? (
                                        <span className="text-lg">{medal}</span>
                                    ) : (
                                        <span className="text-sm font-bold text-gray-400">#{rank}</span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <AvatarCard avatarId={user.avatarId} alt={displayName} size="sm" />

                                {/* Name & Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`font-medium truncate ${isCurrentUser ? 'text-gray-800 font-bold' : 'text-gray-600'}`}>
                                            {displayName}
                                        </span>
                                        {isCurrentUser && (
                                            <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full font-bold">Tú</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-gray-400">Nivel {user.level ?? 1}</span>
                                        {user.finishedActivities != null && (
                                            <>
                                                <span className="text-xs text-gray-300">•</span>
                                                <span className="text-xs text-gray-400">
                                                    {user.finishedActivities} actividad{user.finishedActivities === 1 ? '' : 'es'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* XP */}
                                <div className="flex-shrink-0 text-right">
                                    <span className="text-sm font-bold text-amber-500">
                                        {(user.experience || 0).toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-0.5">XP</span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-gray-500 text-sm text-center py-6">
                        <span className="material-symbols-outlined text-3xl text-gray-300 block mb-2">group</span>
                        Aún no hay usuarios registrados.
                    </div>
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

/* ──────────────────────────────────────────────────────────────────────────────
   Sub-component: Quick Actions
   ──────────────────────────────────────────────────────────────────────────── */
const QuickActions = () => {
    const actions = [
        {
            id: 'map',
            title: 'Explorar Mapa',
            description: 'Recorre los temas del idioma',
            icon: 'map',
            path: '/visitante/mapa',
            gradient: 'from-blue-500 to-indigo-600',
        },
        {
            id: 'activities',
            title: 'Jugar Ahora',
            description: 'Practica con juegos interactivos',
            icon: 'sports_esports',
            path: '/visitante/actividades',
            gradient: 'from-emerald-500 to-teal-600',
        },
        {
            id: 'dictionary',
            title: 'Diccionario',
            description: 'Consulta palabras en Mazahua',
            icon: 'menu_book',
            path: '/visitante/diccionario',
            gradient: 'from-purple-500 to-violet-600',
        },
    ];

    return (
        <div className="kid-card-indigo p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">rocket_launch</span>
                Acciones Rápidas
            </h3>

            <div className="space-y-3">
                {actions.map((action) => (
                    <Link
                        key={action.id}
                        to={action.path}
                        className={`group flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 ${
                            action.id === 'map' ? 'border-blue-200 bg-blue-50/20 shadow-[0_4px_0_#3B82F6] hover:shadow-[0_6px_0_#3B82F6] active:shadow-[0_1px_0_#3B82F6]' :
                            action.id === 'activities' ? 'border-emerald-200 bg-emerald-50/20 shadow-[0_4px_0_#10B981] hover:shadow-[0_6px_0_#10B981] active:shadow-[0_1px_0_#10B981]' :
                            'border-purple-200 bg-purple-50/20 shadow-[0_4px_0_#8353ec] hover:shadow-[0_6px_0_#8353ec] active:shadow-[0_1px_0_#8353ec]'
                        }`}
                    >
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <span className="material-symbols-outlined text-white text-xl">{action.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-gray-800 text-sm group-hover:text-[#E65100] transition-colors">
                                {action.title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">{action.description}</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all text-lg font-bold">
                            chevron_right
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════════════
   Main: VisitorDashboard
   ══════════════════════════════════════════════════════════════════════════ */
const VisitorDashboard = () => {
    const { user } = useAuth();
    const { data, isLoading, error } = useVisitorDashboardQuery();
    const { reloadDashboard } = useVisitorInvalidate();

    const {
        level = 1,
        experience = 0,
        inrow = 0,
        recentActivities = [],
        topUsers = [],
        totalActivitiesCompleted = 0,
    } = data || {};

    return (
        <PageShell>
            <SectionHeader
                title={`¡Hola, ${user?.firstname || user?.username}!`}
                subtitle="Explora y aprende Mazahua a tu propio ritmo. ¡Cada juego te acerca más a la cultura!"
                onReload={reloadDashboard}
            />

            {/* Loading State */}
            {isLoading && <LoadingState message="Cargando tu progreso..." />}

            {/* Error State */}
            {error && !isLoading && (
                <ErrorState
                    message={error.message}
                    onRetry={reloadDashboard}
                    dashboardPath={null}
                />
            )}

            {/* Main Content */}
            {!isLoading && !error && data && (
                <>
                    {/* Stats Cards */}
                    <section className="mb-8">
                        <VisitorStatsCards
                            level={level}
                            experience={experience}
                            inrow={inrow}
                            totalActivitiesCompleted={totalActivitiesCompleted}
                        />
                    </section>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - 2/3 width */}
                        <div className="lg:col-span-2 space-y-6">
                            <RecentActivities activities={recentActivities} />
                        </div>

                        {/* Right Column - 1/3 width */}
                        <div className="space-y-6">
                            <VisitorProgress experience={experience} level={level} />
                            <QuickActions />
                            <TopUsersLeaderboard topUsers={topUsers} currentUserName={user?.username} />
                        </div>
                    </div>
                </>
            )}
        </PageShell>
    );
};

export default VisitorDashboard;
