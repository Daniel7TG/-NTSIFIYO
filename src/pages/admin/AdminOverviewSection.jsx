import React from 'react';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { useAdminOverviewQuery, useAdminInvalidate } from '../../hooks/useAdminQueries';

const AdminOverviewSection = () => {
    const { data: dashboardData, isLoading: loading, error: errorObj } = useAdminOverviewQuery();
    const loading_err = errorObj?.message || null;

    if (loading) {
        return <LoadingState message="Cargando estadísticas de la plataforma..." />;
    }

    if (loading_err) {
        return (
            <ErrorState
                message={loading_err}
                onRetry={() => window.location.reload()}
                dashboardPath={null}
            />
        );
    }

    if (!dashboardData) return null;

    const {
        totalActivities,
        totalGames,
        averageInrow,
        groupStudentCounts,
        wordCategoryCounts,
        groupTeachers,
        groupsCompleteStudents
    } = dashboardData;

    // Calcular el porcentaje de InRow (ej. si maximo es 1.0 = 100%)
    const inrowPercent = Math.min(Math.round((averageInrow || 0) * 100), 100);

    // Paletas de color
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Vista General (Plataforma)</h2>

            {/* Fila Superior: Tarjetas de Totales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total de Actividades</p>
                        <h3 className="text-3xl font-bold text-gray-800">{totalActivities || 0}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined text-2xl">assignment</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Juegos Disponibles</p>
                        <h3 className="text-3xl font-bold text-gray-800">{totalGames || 0}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <span className="material-symbols-outlined text-2xl">sports_esports</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Racha Promedio (InRow)</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-gray-800">{averageInrow?.toFixed(2) || '0.00'}</h3>
                            <span className="text-sm text-green-500 font-medium">Global</span>
                        </div>
                    </div>
                    {/* Progress Circle para InRow */}
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-green-500 drop-shadow-sm" strokeWidth="4" strokeDasharray={`${inrowPercent}, 100`} stroke="currentColor" fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="absolute text-xs font-bold text-gray-700">{inrowPercent}%</span>
                    </div>
                </div>
            </div>

            {/* Fila Central: Distribución de Estudiantes y Palabras */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución por Grupos */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400">groups</span>
                        Estudiantes por Grupo
                    </h3>
                    <div className="space-y-4">
                        {groupStudentCounts && groupStudentCounts.length > 0 ? (
                            groupStudentCounts.map((group, idx) => {
                                const maxStudents = Math.max(...groupStudentCounts.map(g => g.studentCount));
                                const barWidth = maxStudents > 0 ? (group.studentCount / maxStudents) * 100 : 0;
                                return (
                                    <div key={group.groupId}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">Grado {group.grade}</span>
                                            <span className="text-gray-500">{group.studentCount} alumnos</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-2.5 rounded-full ${colors[idx % colors.length]}`}
                                                style={{ width: `${barWidth}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 text-sm italic">No hay grupos registrados.</p>
                        )}
                    </div>
                </div>

                {/* Diccionario / Categorías */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400">category</span>
                        Palabras por Categoría
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {wordCategoryCounts && wordCategoryCounts.length > 0 ? (
                            wordCategoryCounts.map((cat, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 truncate mr-2" title={cat.category}>
                                        {cat.category}
                                    </span>
                                    <span className="bg-white text-xs font-bold px-2 py-1 rounded-md text-gray-600 shadow-sm">
                                        {cat.count}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm italic col-span-2">No hay vocabulario registrado.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Fila Inferior: Maestros Asignados y Alumnos Sobresalientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Maestros */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col h-80">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 px-2">Docentes Encargados</h3>
                    <div className="overflow-y-auto flex-1 px-2 pr-4 custom-scrollbar">
                        {groupTeachers && groupTeachers.length > 0 ? (
                            <div className="space-y-3">
                                {groupTeachers.map((t, idx) => (
                                    <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 mr-3 shadow-sm">
                                            <span className="material-symbols-outlined text-xl">person</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{t.teacherName || 'Reasignación Necesaria'}</p>
                                            <p className="text-xs text-gray-500">Grupo de {t.grade}°</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No hay docentes asignados.</p>
                        )}
                    </div>
                </div>

                {/* Alumnos al día */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col h-80">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 px-2 flex items-center justify-between">
                        Estudiantes Completos
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            Al Día
                        </span>
                    </h3>
                    <div className="overflow-y-auto flex-1 px-2 pr-4 custom-scrollbar">
                        {groupsCompleteStudents && groupsCompleteStudents.length > 0 ? (
                            <div className="space-y-4">
                                {groupsCompleteStudents.map((grp, idx) => {
                                    if (!grp.completeStudents || grp.completeStudents.length === 0) return null;
                                    return (
                                        <div key={idx}>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Grado {grp.grade}</h4>
                                            <div className="space-y-2">
                                                {grp.completeStudents.map(student => (
                                                    <div key={student.username} className="flex items-center justify-between p-2 bg-green-50/50 rounded-lg border border-green-100/50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                                                                {student.listNumber}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {student.firstName} {student.lastName}
                                                            </span>
                                                        </div>
                                                        <span className="material-symbols-outlined text-green-500 text-sm">verified</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Aún no hay estudiantes que hayan completado todo.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminOverviewSection;
