import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ActivityApiService from '../../services/ActivityApiService';
import SectionHeader from '../../components/common/SectionHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import PageShell from '../../components/common/PageShell';
import { useTeacherAssignmentsQuery, useTeacherStudentsQuery, useTeacherInvalidate } from '../../hooks/useTeacherQueries';
import { getGameTypeInfo } from '../../config/activityConfig';
import { getDifficultyBadge } from '../../utils/difficultyBadges';

import IconEmptyBox from '../../assets/svgs/empty_box.svg';

// ── Helpers ──

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch { return dateStr; }
};

// ── Student Detail Row (accordion inside the expanded section) ──
const StudentResponseRow = ({ student, activityId }) => {
    const [open, setOpen] = useState(false);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const handleToggle = async () => {
        if (!open && !loaded) {
            setLoading(true);
            const result = await ActivityApiService.getStudentResponses(activityId, student.username);
            if (result.success) {
                setResponses(result.data);
            }
            setLoaded(true);
            setLoading(false);
        }
        setOpen(prev => !prev);
    };

    const correctCount = responses.filter(r => r.isCorrect).length;
    const totalCount = responses.length;

    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
            {/* Student header row */}
            <button
                onClick={handleToggle}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {(student.firstname || student.username || '?').charAt(0).toUpperCase()}
                </div>

                {/* Name / username */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                        {student.lastname ? `${student.lastname}, ${student.firstname}` : student.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{student.username}</p>
                </div>

                {/* Quick badge if loaded */}
                {loaded && !loading && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${correctCount === totalCount && totalCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {correctCount}/{totalCount} correctas
                    </span>
                )}

                {/* Chevron */}
                <span className="material-symbols-outlined text-gray-400 text-[20px] flex-shrink-0">
                    {open ? 'expand_less' : 'expand_more'}
                </span>
            </button>

            {/* Responses detail */}
            {open && (
                <div className="border-t border-gray-50 bg-gray-50/60 px-4 py-3">
                    {loading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                            <div className="w-4 h-4 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
                            Cargando respuestas...
                        </div>
                    ) : responses.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2">Sin respuestas registradas.</p>
                    ) : (
                        <div className="space-y-2">
                            {/* Summary bar */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: totalCount > 0 ? `${(correctCount / totalCount) * 100}%` : '0%' }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-gray-600">
                                    {totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0}%
                                </span>
                            </div>

                            {/* Individual responses */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {responses.map((resp, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${resp.isCorrect
                                            ? 'bg-green-50 border-green-100 text-green-700'
                                            : 'bg-red-50 border-red-100 text-red-600'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {resp.isCorrect ? 'check_circle' : 'cancel'}
                                        </span>
                                        <span>Pregunta {idx + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main Component ──

const TeacherAssignments = () => {
    const { data, isLoading, error } = useTeacherAssignmentsQuery();
    const { data: students = [] } = useTeacherStudentsQuery();
    const { reloadAssignments } = useTeacherInvalidate();
    const activities = data?.activities || [];

    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (gameId) => {
        setExpandedId(prev => (prev === gameId ? null : gameId));
    };

    return (
        <PageShell>
            <SectionHeader
                        title="Asignaciones Activas"
                        subtitle="Actividades asignadas y su progreso en el grupo."
                        onReload={reloadAssignments}
                    />

                    {isLoading ? (
                        <LoadingState message="Cargando asignaciones..." />
                    ) : error ? (
                        <ErrorState
                            message={error.message}
                            onRetry={reloadAssignments}
                            dashboardPath="/dashboard"
                        />
                    ) : activities.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <img src={IconEmptyBox} alt="Vacío" className="w-20 h-20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Sin asignaciones activas</h3>
                            <p className="text-gray-500">No hay actividades asignadas a tu grupo en este momento.</p>
                            <p className="text-gray-400 text-sm mt-2">Asigna actividades desde la sección de <Link to="/maestro/recursos" className="text-green-600 font-semibold hover:underline">Recursos</Link>.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {/* Summary badge */}
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-bold rounded-full border border-green-100">
                                    {activities.length} {activities.length === 1 ? 'actividad' : 'actividades'} activas
                                </span>
                            </div>

                            {/* Activities list */}
                            {activities.map((activity) => {
                                const gameType = getGameTypeInfo(activity.gameType);
                                const difficulty = getDifficultyBadge(activity.difficult);
                                const isExpanded = expandedId === activity.gameId;
                                const progressPercent = activity.totalCount > 0
                                    ? Math.round((activity.completedCount / activity.totalCount) * 100)
                                    : 0;

                                return (
                                    <div
                                        key={activity.gameId}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
                                    >
                                        {/* Color bar */}
                                        <div className="h-1.5" style={{ background: gameType.color }} />

                                        <div className="p-5">
                                            {/* Main row */}
                                            <div className="flex items-center gap-4">
                                                {/* Icon */}
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                                    style={{ background: gameType.color + '15' }}
                                                >
                                                    {gameType.icon}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-gray-800 text-lg leading-tight truncate">
                                                            {activity.title}
                                                        </h3>
                                                        <span
                                                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                            style={{ background: gameType.color + '15', color: gameType.color }}
                                                        >
                                                            {gameType.label}
                                                        </span>
                                                    </div>

                                                    {/* Meta row */}
                                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficulty.color}`}>
                                                            {difficulty.dot} {difficulty.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                            {formatDate(activity.assignedDate)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress */}
                                                <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 min-w-[120px]">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-gray-500">Progreso:</span>
                                                        <span className="font-bold text-gray-800">{activity.completedCount}/{activity.totalCount}</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${progressPercent}%`,
                                                                background: progressPercent === 100 ? '#22c55e' : gameType.color
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] text-gray-400 font-medium">{progressPercent}% completado</span>
                                                </div>

                                                {/* Expand button */}
                                                <button
                                                    onClick={() => toggleExpand(activity.gameId)}
                                                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors flex-shrink-0 ${isExpanded
                                                        ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                                        : 'text-green-600 bg-green-50 hover:bg-green-100'
                                                        }`}
                                                    title="Ver resultados de estudiantes"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {isExpanded ? 'expand_less' : 'groups'}
                                                    </span>
                                                    <span className="hidden md:inline">
                                                        {isExpanded ? 'Ocultar' : 'Ver Resultados'}
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Mobile progress (visible on small screens) */}
                                            <div className="flex sm:hidden flex-col gap-1 mt-3 pt-3 border-t border-gray-50">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Progreso:</span>
                                                    <span className="font-bold text-gray-800">{activity.completedCount}/{activity.totalCount} ({progressPercent}%)</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${progressPercent}%`,
                                                            background: progressPercent === 100 ? '#22c55e' : gameType.color
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded section — student results */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="material-symbols-outlined text-gray-400">groups</span>
                                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                        Resultados por Estudiante
                                                    </h4>
                                                    <span className="ml-auto text-xs text-gray-400">
                                                        {students.length} estudiantes
                                                    </span>
                                                </div>

                                                {students.length === 0 ? (
                                                    <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
                                                        <p className="text-gray-400 text-sm">No se encontraron estudiantes en tu grupo.</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {students.map((student) => (
                                                            <StudentResponseRow
                                                                key={student.username || student.id}
                                                                student={student}
                                                                activityId={activity.gameId}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
        </PageShell>
    );
};

export default TeacherAssignments;
