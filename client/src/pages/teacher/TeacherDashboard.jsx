import React from 'react';
import { Link } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import PageShell from '../../components/common/PageShell';
import StatCard from '../../components/common/StatCard';
import ProgressRing from '../../components/common/ProgressRing';
import SectionHeader from '../../components/common/SectionHeader';
import { useTeacherDashboardQuery, useTeacherInvalidate } from '../../hooks/useTeacherQueries';
import IconEmptyBox from '../../assets/svgs/empty_box.svg';

/**
 * Dashboard principal del maestro.
 * Usa TanStack Query — datos cacheados con staleTime: Infinity.
 */
const TeacherDashboard = () => {
    const { data, isLoading, error } = useTeacherDashboardQuery();
    const { reloadDashboard } = useTeacherInvalidate();

    const {
        totalStudents = 0,
        activeAssignments = [],
        alertStudents = [],
        completeStudents = [],
        groupId = null
    } = data || {};

    return (
        <PageShell>
            <SectionHeader
                title="Panel de Control"
                subtitle="Monitorea el progreso de tu grupo estudiantil."
                onReload={reloadDashboard}
            />

            {/* Grupo a cargo */}
            {!isLoading && !error && (
                <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-4 mb-6 shadow-sm w-fit">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-primary/10 flex items-center justify-center text-primary font-black text-lg">
                        {groupId ? `${groupId}º` : '—'}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tu grupo</p>
                        <p className="font-bold text-gray-800 leading-tight">
                            {groupId ? `${groupId}º Grado` : 'Sin grupo asignado'}
                        </p>
                    </div>
                </div>
            )}

            {isLoading && <LoadingState message="Actualizando métricas de tu grupo..." />}

            {error && !isLoading && (
                <ErrorState
                    message={error.message}
                    onRetry={reloadDashboard}
                    dashboardPath="/dashboard"
                />
            )}

            {!isLoading && !error && data && (
                <>
                    {/* No-group notice */}
                    {data.noGroup && (
                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 text-amber-800">
                            <span className="material-symbols-outlined text-amber-500 text-2xl flex-shrink-0">info</span>
                            <div>
                                <p className="font-semibold text-sm">No hay actividades activas</p>
                                <p className="text-xs text-amber-700 mt-0.5">Actualmente no tienes actividades asignadas a tu grupo. Cuando asignes actividades aparecerán aquí.</p>
                            </div>
                        </div>
                    )}

                    {/* 4 Main Stat Cards */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        <StatCard icon="groups"                label="Total de Estudiantes"  value={totalStudents}              accentColor="text-blue-600"   iconBg="bg-blue-50"   iconColor="text-blue-500"   />
                        <StatCard icon="verified"              label="Alumnos al Día"         value={completeStudents.length}    accentColor="text-green-600"  iconBg="bg-green-50"  iconColor="text-green-500"  subText="Completados"   />
                        <StatCard icon="notification_important" label="Requieren Atención"    value={alertStudents.length}       accentColor="text-orange-600" iconBg="bg-orange-50" iconColor="text-orange-500" subText="En alerta"     />
                        <StatCard icon="assignment"            label="Actividades Activas"    value={activeAssignments.length}   accentColor="text-purple-600" iconBg="bg-purple-50" iconColor="text-purple-500" subText="Asignadas"     />
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Middle Column: Active Assignments Progress */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-purple-500">trending_up</span>
                                        Progreso de Asignaciones
                                    </h3>
                                    <Link to="/maestro/asignaciones" className="text-sm font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg transition-colors">
                                        Ver todas
                                    </Link>
                                </div>
                                {activeAssignments.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                        <img src={IconEmptyBox} alt="Vacío" className="w-16 h-16 mb-3 opacity-75" />
                                        <p className="text-gray-500 font-medium">No hay actividades activas actualmente.</p>
                                        <Link to="/maestro/recursos" className="mt-3 text-sm text-green-600 font-semibold hover:underline">Asignar nueva actividad</Link>
                                    </div>
                                ) : (
                                    <div className="space-y-5 flex-1">
                                        {activeAssignments.map((assignment, idx) => {
                                            const total = totalStudents > 0 ? totalStudents : 1;
                                            const completed = assignment.finishedCount || 0;
                                            return (
                                                <div key={idx} className="group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                                                <span className="material-symbols-outlined text-gray-400 text-[20px]">extension</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 leading-tight group-hover:text-purple-600 transition-colors">
                                                                    {assignment.title || 'Actividad Sin Nombre'}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 mt-0.5">{completed} de {totalStudents} alumnos completaron</p>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 ml-4">
                                                            <ProgressRing
                                                                value={completed}
                                                                max={total}
                                                                size={60}
                                                                strokeWidth={7}
                                                                color="#9333ea"
                                                                centerLabel={
                                                                    <span className="text-[10px] font-bold text-gray-700">
                                                                        {Math.round((completed / total) * 100)}%
                                                                    </span>
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Students Lists */}
                        <div className="flex flex-col gap-6">
                            {/* Alumnos en Alerta */}
                            <div className="bg-white rounded-3xl border border-orange-100 shadow-sm shadow-orange-50 p-6 flex-1">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
                                    <span className="material-symbols-outlined text-orange-500">warning</span>
                                    Alumnos en Alerta
                                    <span className="ml-auto text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{alertStudents.length}</span>
                                </h3>
                                {alertStudents.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400 text-sm">Ningún alumno en alerta actualmente. ¡Gran trabajo!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {alertStudents.map((st, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-orange-100/80 shadow-sm shadow-orange-50/50">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-700 shrink-0">
                                                    {st.listNumber || '-'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 truncate">
                                                        {st.lastName ? `${st.lastName}, ${st.firstName}` : st.username}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                                        Atrasado en {st.missedAssignments || 'actividades'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Alumnos al Día */}
                            <div className="bg-white rounded-3xl border border-green-100 shadow-sm shadow-green-50 p-6 flex-1">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
                                    <span className="material-symbols-outlined text-green-500">verified</span>
                                    Alumnos al Día
                                    <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{completeStudents.length}</span>
                                </h3>
                                {completeStudents.length === 0 ? (
                                    <div className="text-center py-8"><p className="text-gray-400 text-sm">No hay alumnos al día todavía.</p></div>
                                ) : (
                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {completeStudents.map((st, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-green-100/80 shadow-sm shadow-green-50/50">
                                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-sm font-bold text-green-700 shrink-0">
                                                    {st.listNumber || '-'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-gray-800 truncate">
                                                        {st.lastName ? `${st.lastName}, ${st.firstName}` : st.username}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </PageShell>
    );
};

export default TeacherDashboard;
