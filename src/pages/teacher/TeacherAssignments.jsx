import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ActivityAttemptHistory from '../../components/Teacher/ActivityAttemptHistory';
import { useReportActivitiesQuery } from '../../hooks/useTeacherReportQueries';
import SectionHeader from '../../components/common/SectionHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import PageShell from '../../components/common/PageShell';
import { useTeacherAssignmentsQuery, useTeacherStudentsQuery, useTeacherInvalidate, useTeacherGroupQuery } from '../../hooks/useTeacherQueries';
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

// Resolve the student's assigned Activity; the card's gameId is a different resource.
const StudentResponseRow = ({ student, gameId, groupId }) => {
    const [open, setOpen] = useState(false);
    const [selectedActivityId, setSelectedActivityId] = useState(null);
    const [page, setPage] = useState(0);
    const username = student.username || student.id;
    const results = useReportActivitiesQuery({
        groupId, gameId, source: 'ASSIGNMENT', studentIds: [username],
        page, size: 20, sort: 'RECENT', direction: 'DESC',
    }, { enabled: open && Boolean(groupId && gameId && username) });
    const rows = (results.data?.items || []).filter(row =>
        row.source === 'ASSIGNMENT' && String(row.gameId) === String(gameId)
        && row.studentUsername === username && Number(row.activityId) > 0);
    const selected = rows.find(row => String(row.activityId) === String(selectedActivityId)) || rows[0];
    const total = results.data?.total || 0;

    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
            <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {(student.firstname || username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                        {[student.lastname, student.firstname].filter(Boolean).join(', ') || username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{username}</p>
                </div>
                {selected?.accuracyPercent != null && <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-700">{selected.accuracyPercent}%</span>}
                <span className="material-symbols-outlined text-gray-400 text-[20px] flex-shrink-0" aria-hidden="true">{open ? 'expand_less' : 'expand_more'}</span>
            </button>
            {open && <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4">
                {results.isLoading || results.isPending ? <p role="status" className="text-sm text-gray-500">Buscando la actividad del alumno...</p>
                    : results.error ? <div role="alert" className="text-sm text-red-700">
                        <p>{results.error.message || 'No se pudo consultar la actividad del alumno.'}</p>
                        <button type="button" onClick={() => results.refetch()} className="mt-2 font-semibold underline">Reintentar consulta</button>
                    </div>
                        : !selected ? <p className="text-sm text-gray-500">Este alumno todavía no tiene un intento registrado en esta asignación.</p>
                            : <>
                                {rows.length > 1 && <label className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700">
                                    Asignación del alumno
                                    <select value={String(selected.activityId)} onChange={event => setSelectedActivityId(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal">
                                        {rows.map(row => <option key={row.activityId} value={String(row.activityId)}>Asignación #{row.activityId} · {formatDate(row.activityDate)}</option>)}
                                    </select>
                                </label>}
                                <ActivityAttemptHistory key={selected.activityId} activityId={selected.activityId} />
                            </>}
                {total > 20 && <div className="mt-4 flex items-center justify-between gap-2 text-sm">
                    <button type="button" disabled={page === 0 || results.isFetching} onClick={() => setPage(value => value - 1)} className="font-semibold text-green-700 disabled:opacity-40">Asignaciones anteriores</button>
                    <span>Página {page + 1} de {Math.ceil(total / 20)}</span>
                    <button type="button" disabled={(page + 1) * 20 >= total || results.isFetching} onClick={() => setPage(value => value + 1)} className="font-semibold text-green-700 disabled:opacity-40">Asignaciones siguientes</button>
                </div>}
            </div>}
        </div>
    );
};

// ── Main Component ──

const TeacherAssignments = () => {
    const { data, isLoading, error } = useTeacherAssignmentsQuery();
    const groupQuery = useTeacherGroupQuery();
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

                    {isLoading || groupQuery.isLoading ? (
                        <LoadingState message="Cargando asignaciones..." />
                    ) : error || groupQuery.error ? (
                        <ErrorState
                            message={(error || groupQuery.error).message}
                            onRetry={reloadAssignments}
                            dashboardPath="/dashboard"
                        />
                    ) : activities.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <img src={IconEmptyBox} alt="Vacío" className="w-20 h-20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{data?.noGroup ? 'Sin grupo asignado' : 'Sin asignaciones activas'}</h3>
                            <p className="text-gray-500">{data?.noGroup ? 'Solicita al administrador que te asigne un grupo.' : 'No hay actividades asignadas a tu grupo en este momento.'}</p>
                            {!data?.noGroup && <p className="text-gray-400 text-sm mt-2">Asigna actividades desde la sección de <Link to="/maestro/recursos" className="text-green-600 font-semibold hover:underline">Recursos</Link>.</p>}
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
                                                                gameId={activity.gameId}
                                                                groupId={groupQuery.data?.groupId}
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
