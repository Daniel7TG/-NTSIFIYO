import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/common/PageShell';
import SectionHeader from '../../components/common/SectionHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ReportExportButtons from '../../components/Teacher/ReportExportButtons';
import ActivityAttemptHistory from '../../components/Teacher/ActivityAttemptHistory';
import { useTeacherGroupQuery, useTeacherStudentsQuery } from '../../hooks/useTeacherQueries';
import { useGamesQuery } from '../../hooks/useGamesQueries';
import { useReportOverviewQuery, useReportStudentsQuery, useReportActivitiesQuery } from '../../hooks/useTeacherReportQueries';
import { ActivityTypes, getGameTypeInfo } from '../../config/activityConfig';

const PAGE_SIZE = 10;
const fieldClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800';
const buttonClass = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40';
const topics = {
    VOWELS: 'Vocales', PRONOUNS: 'Pronombres', NUMBERS: 'Números', SUBJECTS: 'Sujetos',
    CLOTHES: 'Ropa', FOOD: 'Comida', LEGENDS: 'Leyendas', ANECDOTES: 'Anécdotas',
    ANIMALS: 'Animales', FRUITS: 'Frutas', BODY_PARTS: 'Partes del cuerpo',
    FIVE_SENSES: 'Los cinco sentidos', GREETINGS: 'Saludos', COLORS: 'Colores',
};
const attemptLabels = { FIRST: 'Primer intento', LAST: 'Último intento', BEST: 'Mejor intento' };
const statusLabels = { PENDING: 'Pendiente', COMPLETED: 'Completada', DISCARDED: 'Descartada' };
const initialFilters = (student = '') => ({
    student, fromDate: '', toDate: '', gameId: '', gameType: '', topic: '', difficulty: '',
    source: '', status: '', minScore: '', maxScore: '', attemptSelection: 'LAST', sort: 'PRECISION', direction: 'DESC',
});
const percent = value => value == null ? 'Sin datos' : `${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 1 })}%`;
const improvement = value => value == null ? 'Sin comparación' : `${value > 0 ? '+' : ''}${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 1 })} pp`;
const studentName = student => [student.lastName ?? student.lastname, student.firstName ?? student.firstname].filter(Boolean).join(', ') || student.username;
const displayDate = value => {
    if (!value) return '—';
    const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

function validateFilters(values) {
    if (values.fromDate && values.toDate && values.fromDate > values.toDate) return 'La fecha inicial no puede ser posterior a la fecha final.';
    for (const key of ['minScore', 'maxScore']) {
        if (values[key] !== '' && (!Number.isInteger(Number(values[key])) || Number(values[key]) < 0 || Number(values[key]) > 100)) {
            return 'La precisión mínima y máxima deben ser números enteros entre 0 y 100.';
        }
    }
    if (values.minScore !== '' && values.maxScore !== '' && Number(values.minScore) > Number(values.maxScore)) {
        return 'La precisión mínima no puede superar a la máxima.';
    }
    return '';
}

function TeacherReports() {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlStudent = searchParams.get('student') || '';
    const [draft, setDraft] = useState(() => initialFilters(urlStudent));
    const [applied, setApplied] = useState(() => initialFilters(urlStudent));
    const [validationError, setValidationError] = useState('');
    const [studentsPage, setStudentsPage] = useState(0);
    const [activitiesPage, setActivitiesPage] = useState(0);
    const [catalogPage, setCatalogPage] = useState(0);
    const [selectedGameLabel, setSelectedGameLabel] = useState('');
    const [expandedActivity, setExpandedActivity] = useState(null);

    const groupQuery = useTeacherGroupQuery();
    const rosterQuery = useTeacherStudentsQuery();
    const catalogQuery = useGamesQuery({ page: catalogPage, size: 50 });
    const groupId = groupQuery.data?.groupId;
    const enabled = Number.isSafeInteger(groupId) && groupId > 0;
    const filters = useMemo(() => {
        const result = { groupId, studentIds: applied.student ? [applied.student] : [], attemptSelection: applied.attemptSelection, sort: applied.sort, direction: applied.direction };
        ['fromDate', 'toDate', 'gameType', 'topic', 'difficulty', 'source', 'status'].forEach(key => { if (applied[key]) result[key] = applied[key]; });
        ['gameId', 'minScore', 'maxScore'].forEach(key => { if (applied[key] !== '') result[key] = Number(applied[key]); });
        return result;
    }, [groupId, applied]);
    const overviewQuery = useReportOverviewQuery(filters, { enabled });
    const studentsQuery = useReportStudentsQuery({ ...filters, page: studentsPage, size: PAGE_SIZE }, { enabled });
    const activitiesQuery = useReportActivitiesQuery({ ...filters, page: activitiesPage, size: PAGE_SIZE }, { enabled });
    const overview = overviewQuery.data;
    const dirty = JSON.stringify(draft) !== JSON.stringify(applied);
    const games = catalogQuery.data?.data || [];
    const studentOptions = useMemo(() => {
        const result = new Map();
        [...(rosterQuery.data || []), ...(studentsQuery.data?.items || [])].forEach(student => result.set(student.username, student));
        if (draft.student && !result.has(draft.student)) result.set(draft.student, { username: draft.student });
        return [...result.values()].sort((a, b) => studentName(a).localeCompare(studentName(b), 'es'));
    }, [rosterQuery.data, studentsQuery.data, draft.student]);

    useEffect(() => {
        setDraft(previous => ({ ...previous, student: urlStudent }));
        setApplied(previous => ({ ...previous, student: urlStudent }));
        setStudentsPage(0);
        setActivitiesPage(0);
        setExpandedActivity(null);
    }, [urlStudent]);
    useEffect(() => {
        setStudentsPage(0);
        setActivitiesPage(0);
        setExpandedActivity(null);
    }, [groupId]);

    const update = (name, value) => {
        setDraft(previous => ({ ...previous, [name]: value }));
        setValidationError('');
    };
    const apply = values => {
        const error = validateFilters(values);
        setValidationError(error);
        if (error) return;
        setDraft(values);
        setApplied({ ...values });
        setStudentsPage(0);
        setActivitiesPage(0);
        setExpandedActivity(null);
        const next = new URLSearchParams(searchParams);
        if (values.student) next.set('student', values.student); else next.delete('student');
        setSearchParams(next, { replace: true });
    };
    const reload = async () => {
        await groupQuery.refetch();
        if (!enabled) return;
        await Promise.all([overviewQuery.refetch(), studentsQuery.refetch(), activitiesQuery.refetch(), rosterQuery.refetch(), catalogQuery.refetch()]);
    };

    return (
        <PageShell>
            <SectionHeader title="Reportes del grupo" subtitle="Consulta el trabajo de tus alumnos, compara sus intentos y descarga el reporte." onReload={reload} />
            {groupQuery.isLoading ? <LoadingState message="Buscando tu grupo..." /> : groupQuery.error ? (
                <ErrorState message={groupQuery.error.message} onRetry={reload} />
            ) : !enabled ? (
                <EmptyPanel title="Sin grupo asignado" text="Solicita al administrador que te asigne un grupo para consultar sus reportes." />
            ) : (
                <div className="space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-600 p-6 text-white shadow-sm">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-emerald-50">Grupo de {groupQuery.data.grade}º grado</p>
                                <h2 className="mt-1 text-2xl font-bold">Resultados y progreso</h2>
                                <p className="mt-2 text-sm text-emerald-50">{attemptLabels[applied.attemptSelection]} terminado · {applied.fromDate ? displayDate(applied.fromDate) : 'Desde el inicio'} a {applied.toDate ? displayDate(applied.toDate) : 'hoy'}</p>
                                <p className="mt-1 text-sm text-emerald-50">{applied.student || 'Todos los alumnos'} · {applied.source === 'ASSIGNMENT' ? 'Asignaciones' : applied.source === 'PRACTICE' ? 'Práctica libre' : 'Asignaciones y práctica libre'}</p>
                            </div>
                            <div className="rounded-xl bg-white p-3 text-gray-800">
                                <ReportExportButtons filters={filters} includeDetails disabled={dirty || Boolean(validationError) || !overview || Boolean(overviewQuery.error) || overviewQuery.isFetching} />
                                <p className="mt-2 text-xs text-gray-500">Incluye todas las filas filtradas y las respuestas disponibles del intento elegido.</p>
                                {dirty && <p className="mt-1 text-xs font-semibold text-amber-700">Aplica los cambios de filtros antes de exportar.</p>}
                            </div>
                        </div>
                    </section>

                    <form noValidate onSubmit={event => { event.preventDefault(); apply(draft); }} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm" aria-label="Filtros del reporte">
                        <h3 className="mb-4 font-bold text-gray-800">Ajusta tu reporte</h3>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <Field label="Alumno" name="report-student">
                                <select id="report-student" className={fieldClass} value={draft.student} onChange={event => update('student', event.target.value)}>
                                    <option value="">Todos los alumnos</option>
                                    {studentOptions.map(student => <option key={student.username} value={student.username}>{studentName(student)} · {student.username}</option>)}
                                </select>
                                {rosterQuery.error && <p className="mt-1 text-xs text-amber-700">No se pudo actualizar la lista de alumnos. Usa Recargar para reintentar.</p>}
                            </Field>
                            <Field label="Desde (fecha de finalización)" name="report-from"><input id="report-from" type="date" className={fieldClass} value={draft.fromDate} onChange={event => update('fromDate', event.target.value)} /></Field>
                            <Field label="Hasta (fecha de finalización)" name="report-to"><input id="report-to" type="date" className={fieldClass} value={draft.toDate} onChange={event => update('toDate', event.target.value)} /></Field>
                            <SelectField label="Intento a comparar" name="attempt" value={draft.attemptSelection} onChange={value => update('attemptSelection', value)} options={attemptLabels} />
                            <SelectField label="Origen" name="source" value={draft.source} onChange={value => update('source', value)} options={{ '': 'Todos los orígenes', ASSIGNMENT: 'Asignación del maestro', PRACTICE: 'Práctica libre' }} />
                            <SelectField label="Estado" name="status" value={draft.status} onChange={value => update('status', value)} options={{ '': 'Todos los estados', ...statusLabels }} />
                            <SelectField label="Tema" name="topic" value={draft.topic} onChange={value => update('topic', value)} options={{ '': 'Todos los temas', ...topics }} />
                            <SelectField label="Dificultad" name="difficulty" value={draft.difficulty} onChange={value => update('difficulty', value)} options={{ '': 'Todas las dificultades', EASY: 'Fácil', MEDIUM: 'Media', HARD: 'Difícil' }} />
                            <SelectField label="Tipo de actividad" name="type" value={draft.gameType} onChange={value => update('gameType', value)} options={{ '': 'Todos los tipos', ...Object.fromEntries(Object.values(ActivityTypes).map(type => [type, getGameTypeInfo(type).label])), PUZZLE: 'Rompecabezas' }} />
                            <Field label="Juego" name="report-game">
                                <select id="report-game" className={fieldClass} value={draft.gameId} onChange={event => {
                                    update('gameId', event.target.value);
                                    setSelectedGameLabel(event.target.selectedOptions[0]?.textContent || '');
                                }}>
                                    <option value="">Todos los juegos</option>
                                    {draft.gameId && !games.some(game => String(game.id) === draft.gameId) && <option value={draft.gameId}>{selectedGameLabel || 'Juego seleccionado'}</option>}
                                    {games.map(game => <option key={game.id} value={game.id}>{game.title}</option>)}
                                </select>
                                {catalogQuery.error ? <p className="mt-1 text-xs text-amber-700">No se pudo cargar el catálogo. Usa Recargar para reintentar.</p> : catalogQuery.data?.page?.totalPages > 1 && (
                                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
                                        <button type="button" className={buttonClass} aria-label="Página anterior de juegos" disabled={catalogPage === 0 || catalogQuery.isFetching} onClick={() => setCatalogPage(value => value - 1)}>Anterior</button>
                                        <span>{catalogPage + 1}/{catalogQuery.data.page.totalPages}</span>
                                        <button type="button" className={buttonClass} aria-label="Página siguiente de juegos" disabled={catalogQuery.data.page.last || catalogQuery.isFetching} onClick={() => setCatalogPage(value => value + 1)}>Siguiente</button>
                                    </div>
                                )}
                            </Field>
                            <Field label="Precisión mínima (%)" name="report-min"><input id="report-min" type="number" min="0" max="100" step="1" className={fieldClass} value={draft.minScore} onChange={event => update('minScore', event.target.value)} /></Field>
                            <Field label="Precisión máxima (%)" name="report-max"><input id="report-max" type="number" min="0" max="100" step="1" className={fieldClass} value={draft.maxScore} onChange={event => update('maxScore', event.target.value)} /></Field>
                            <SelectField label="Ordenar resultados por" name="sort" value={draft.sort} onChange={value => update('sort', value)} options={{ PRECISION: 'Precisión', COMPLIANCE: 'Cumplimiento', IMPROVEMENT: 'Mejora', RECENT: 'Actividad reciente', ACTIVITY_COUNT: 'Actividades e intentos realizados' }} />
                            <SelectField label="Dirección del orden" name="direction" value={draft.direction} onChange={value => update('direction', value)} options={{ DESC: 'De mayor a menor', ASC: 'De menor a mayor' }} />
                        </div>
                        <p className="mt-4 text-xs text-gray-500">Deja las fechas vacías para incluir todo el historial. El periodo limita los intentos terminados que se comparan.</p>
                        {validationError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{validationError}</p>}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button type="submit" className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Aplicar filtros</button>
                            <button type="button" className={buttonClass} onClick={() => apply(initialFilters())}>Restablecer filtros</button>
                            {dirty && <p role="status" className="text-sm text-amber-700">Cambios pendientes de aplicar; los resultados muestran los filtros anteriores.</p>}
                        </div>
                    </form>

                    <QueryContent query={overviewQuery} loadingText="Calculando el reporte...">
                        {overview && <>
                            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores del grupo">
                                <MetricCard label="Alumnos" value={overview.students} detail="Incluidos en el reporte" />
                                <MetricCard label="Actividades realizadas" value={overview.completedActivities} detail="Una vez por actividad" />
                                <MetricCard label="Cumplimiento" value={percent(overview.compliancePercent)} detail={`${overview.fulfilledAssignments} de ${overview.assignments} asignaciones`} />
                                <MetricCard label="Precisión global" value={percent(overview.accuracyPercent)} detail={`${overview.correctAnswers} aciertos de ${overview.totalQuestions} respuestas`} />
                            </section>
                            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                                <MetricChart title="Precisión a lo largo del tiempo" values={(overview.temporal || []).map(point => ({ label: displayDate(point.date), value: point.accuracyPercent, detail: `${point.activities} actividades` }))} />
                                <DistributionChart values={overview.distribution || []} />
                                <MetricChart title="Resultados por tema" values={(overview.byTopic || []).map(item => ({ label: topics[item.name] || item.name, value: item.accuracyPercent, detail: `${item.activities} actividades` }))} />
                                <MetricChart title="Resultados por actividad" values={(overview.byActivity || []).map(item => ({ label: item.name, value: item.accuracyPercent, detail: `${item.activities} actividades` }))} />
                            </div>
                        </>}
                    </QueryContent>

                    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm" aria-labelledby="report-students-title">
                        <div className="border-b border-gray-100 p-5"><h3 id="report-students-title" className="font-bold text-gray-800">Resultados por alumno</h3><p className="mt-1 text-xs text-gray-500">Precisión, cumplimiento y mejora con los mismos filtros del reporte.</p></div>
                        <QueryContent query={studentsQuery} loadingText="Cargando alumnos...">
                            {!studentsQuery.data?.items?.length ? <EmptyPanel text="No hay alumnos que coincidan con estos filtros." /> : (
                                <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><caption className="sr-only">Resultados por alumno</caption>
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{['Alumno', 'Actividades', 'Cumplimiento', 'Precisión', 'Mejora', 'XP', 'Última actividad', 'Detalle'].map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead>
                                    <tbody className="divide-y divide-gray-100">{studentsQuery.data.items.map(student => <tr key={student.username}>
                                        <th scope="row" className="px-4 py-3 font-medium text-gray-800">{studentName(student)}<span className="block text-xs text-gray-500">{student.username}</span></th>
                                        <td className="px-4 py-3">{student.completedActivities}</td><td className="px-4 py-3">{percent(student.compliancePercent)}<span className="block text-xs text-gray-500">{student.fulfilledAssignments}/{student.assignments}</span></td>
                                        <td className="px-4 py-3 font-semibold">{percent(student.accuracyPercent)}<span className="block text-xs font-normal text-gray-500">{student.correctAnswers}/{student.totalQuestions} respuestas</span></td>
                                        <td className="px-4 py-3">{improvement(student.improvementPercent)}</td><td className="px-4 py-3">{student.xpAwarded}</td><td className="px-4 py-3">{displayDate(student.lastActivityAt)}</td>
                                        <td className="px-4 py-3"><button type="button" className="font-semibold text-emerald-700 hover:underline" aria-label={`Ver actividades de ${studentName(student)}`} onClick={() => apply({ ...applied, student: student.username })}>Ver actividades</button></td>
                                    </tr>)}</tbody>
                                </table></div>
                            )}
                            <Pagination label="alumnos" data={studentsQuery.data} currentPage={studentsPage} busy={studentsQuery.isFetching} onPage={setStudentsPage} />
                        </QueryContent>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm" aria-labelledby="report-activities-title">
                        <div className="border-b border-gray-100 p-5"><h3 id="report-activities-title" className="font-bold text-gray-800">Actividades realizadas y pendientes</h3><p className="mt-1 text-xs text-gray-500">Abre una actividad para ver las preguntas, respuestas y todos sus intentos.</p></div>
                        <QueryContent query={activitiesQuery} loadingText="Cargando actividades...">
                            {!activitiesQuery.data?.items?.length ? <EmptyPanel text="No hay actividades que coincidan con estos filtros." /> : (
                                <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><caption className="sr-only">Actividades del reporte</caption>
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{['Actividad y alumno', 'Origen y estado', 'Intento', 'Resultado', 'Mejora', 'Fecha', 'Detalle'].map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead>
                                    <tbody className="divide-y divide-gray-100">{activitiesQuery.data.items.map(activity => <tr key={activity.activityId}>
                                        <th scope="row" className="px-4 py-3 font-medium text-gray-800">{activity.title}<span className="block text-xs text-gray-500">{activity.studentUsername}</span><span className="block text-xs text-gray-500">{getGameTypeInfo(activity.gameType).label} · {topics[activity.topic] || activity.topic}</span></th>
                                        <td className="px-4 py-3">{activity.source === 'ASSIGNMENT' ? 'Asignación' : 'Práctica libre'}<span className="block text-xs text-gray-500">{statusLabels[activity.status] || activity.status}</span></td>
                                        <td className="px-4 py-3">{activity.selectedAttemptNumber ? `Intento ${activity.selectedAttemptNumber}` : 'Sin intento terminado'}<span className="block text-xs text-gray-500">{activity.completedAttempts} terminados en el periodo</span></td>
                                        <td className="px-4 py-3 font-semibold">{percent(activity.accuracyPercent)}<span className="block text-xs font-normal text-gray-500">{activity.correctAnswers == null ? 'Sin respuestas' : `${activity.correctAnswers}/${activity.totalQuestions} aciertos · ${activity.incorrectAnswers} errores`}</span><span className="block text-xs font-normal text-gray-500">{activity.xpAwarded == null ? '—' : activity.xpAwarded} XP</span></td>
                                        <td className="px-4 py-3">{improvement(activity.improvementPercent)}</td><td className="px-4 py-3">{displayDate(activity.activityDate)}</td>
                                        <td className="px-4 py-3"><button type="button" className="font-semibold text-emerald-700 hover:underline" aria-expanded={expandedActivity?.activityId === activity.activityId} aria-controls={`report-activity-${activity.activityId}`} aria-label={`Ver detalle de ${activity.title} de ${activity.studentUsername}`} onClick={() => setExpandedActivity(previous => previous?.activityId === activity.activityId ? null : activity)}>{expandedActivity?.activityId === activity.activityId ? 'Ocultar detalle' : 'Ver detalle'}</button></td>
                                    </tr>)}</tbody>
                                </table></div>
                            )}
                            <Pagination label="actividades" data={activitiesQuery.data} currentPage={activitiesPage} busy={activitiesQuery.isFetching} onPage={page => { setActivitiesPage(page); setExpandedActivity(null); }} />
                        </QueryContent>
                        {expandedActivity && <div id={`report-activity-${expandedActivity.activityId}`} className="border-t border-gray-100 bg-gray-50 p-4 sm:p-5">
                            <h4 className="font-bold text-gray-800">{expandedActivity.title} · {expandedActivity.studentUsername}</h4>
                            <p className="mb-4 mt-1 text-xs text-gray-500">Historial completo de esta actividad. Puede incluir intentos fuera del periodo del reporte; se abre el intento seleccionado cuando está disponible.</p>
                            <ActivityAttemptHistory key={`${expandedActivity.activityId}-${expandedActivity.selectedAttemptNumber || ''}`} activityId={expandedActivity.activityId} initialAttemptNumber={expandedActivity.selectedAttemptNumber ?? null} />
                        </div>}
                    </section>
                    <p className="text-xs text-gray-500">La mejora se expresa en puntos porcentuales entre el primer y el último intento del periodo. Las actividades sin resultados muestran “Sin datos” y no añaden ceros a la precisión.</p>
                </div>
            )}
        </PageShell>
    );
}

function Field({ label, name, children }) {
    return <div className="min-w-0"><label htmlFor={name} className="text-xs font-semibold text-gray-600">{label}</label>{children}</div>;
}
function SelectField({ label, name, value, onChange, options }) {
    const id = `report-${name}`;
    return <Field label={label} name={id}><select id={id} className={fieldClass} value={value} onChange={event => onChange(event.target.value)}>{Object.entries(options).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></Field>;
}
function QueryContent({ query, loadingText, children }) {
    if (query.isLoading) return <LoadingState message={loadingText} />;
    if (query.error) return <div className="p-5"><p role="alert" className="text-sm text-red-700">No se pudo actualizar el reporte: {query.error.message}</p><button type="button" onClick={() => query.refetch()} className={`${buttonClass} mt-3`}>Reintentar</button></div>;
    return <>{query.isFetching && <p role="status" className="px-5 py-2 text-xs text-gray-500">Actualizando resultados...</p>}{children}</>;
}
function EmptyPanel({ title, text }) {
    return <div className="rounded-2xl bg-white p-8 text-center">{title && <h3 className="mb-2 text-lg font-bold text-gray-800">{title}</h3>}<p className="text-sm text-gray-500">{text}</p></div>;
}
function MetricCard({ label, value, detail }) {
    return <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-gray-500">{label}</p><p className="mt-2 text-2xl font-extrabold text-gray-800">{value ?? '—'}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></div>;
}
function MetricChart({ title, values }) {
    return <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h3 className="mb-4 font-bold text-gray-800">{title}</h3>{values.length ? <div className="max-h-80 space-y-4 overflow-y-auto">{values.map((item, index) => <div key={`${item.label}-${index}`}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="min-w-0 break-words font-semibold text-gray-700">{item.label}</span><span className="shrink-0 font-bold text-gray-700">{percent(item.value)}</span></div><div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, item.value || 0))}%` }} /></div><p className="mt-1 text-xs text-gray-500">{item.detail}</p></div>)}</div> : <p className="text-sm text-gray-500">Sin resultados para estos filtros.</p>}</section>;
}
function DistributionChart({ values }) {
    const maximum = Math.max(1, ...values.map(item => item.activities));
    return <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h3 className="mb-4 font-bold text-gray-800">Distribución de resultados</h3>{values.length ? <div className="space-y-4">{values.map(item => <div key={item.range}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="font-semibold text-gray-700">{item.range}% de aciertos</span><span className="text-gray-600">{item.activities} actividades</span></div><div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${item.activities / maximum * 100}%` }} /></div></div>)}</div> : <p className="text-sm text-gray-500">Sin resultados para estos filtros.</p>}</section>;
}
function Pagination({ label, data, currentPage, busy, onPage }) {
    const total = data?.total || 0;
    const size = data?.size || PAGE_SIZE;
    const pages = Math.ceil(total / size);
    return <nav aria-label={`Paginación de ${label}`} className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-4"><p className="text-xs text-gray-500">{total} {label}{pages > 0 ? ` · Página ${currentPage + 1} de ${pages}` : ''}</p><div className="flex gap-2"><button type="button" className={buttonClass} disabled={busy || currentPage === 0} onClick={() => onPage(currentPage - 1)} aria-label={`Página anterior de ${label}`}>Anterior</button><button type="button" className={buttonClass} disabled={busy || currentPage + 1 >= pages} onClick={() => onPage(currentPage + 1)} aria-label={`Página siguiente de ${label}`}>Siguiente</button></div></nav>;
}

export default TeacherReports;
