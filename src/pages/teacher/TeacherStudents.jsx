import React from 'react';
import List from '../../components/common/List';
import PageShell from '../../components/common/PageShell';
import { useTeacherStudentsQuery, useTeacherInvalidate } from '../../hooks/useTeacherQueries';
import SectionHeader from '../../components/common/SectionHeader';

/**
 * Página de Estudiantes del Maestro.
 * Obtiene el listado de estudiantes del grupo asignado al maestro autenticado
 * usando TanStack Query para caché compartida entre vistas.
 */
const TeacherStudents = () => {
    const { data: students = [], isLoading, error } = useTeacherStudentsQuery();
    const { reloadStudents } = useTeacherInvalidate();

    const tableHeaders = [
        { label: 'Nº Lista', align: 'center' },
        { label: 'Nombre Completo' },
        { label: 'Usuario' },
        { label: 'Contraseña' },
    ];

    const renderStudentRow = (student) => (
        <>
            <td className="py-3 px-4 text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
                    {student.listNumber || '-'}
                </span>
            </td>
            <td className="py-3 px-4 text-gray-800 font-medium">
                {student.lastname}, {student.firstname}
            </td>
            <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                {student.username}
            </td>
            <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                {student.password || '******'}
            </td>
        </>
    );

    const renderStudentActions = (student) => (
        <button
            onClick={() => {
                // TODO: navegar al detalle de actividades del estudiante
                console.log('Ver actividades de:', student.username);
            }}
            title="Ver Actividades"
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
        >
            <span className="material-symbols-outlined text-[18px]">assignment</span>
            Actividades
        </button>
    );

    return (
        <PageShell>
            <SectionHeader
                        title="Mis Estudiantes"
                        onReload={reloadStudents}
                    />

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <span className="material-symbols-outlined text-gray-400">groups</span>
                            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wider">
                                Lista de Estudiantes
                            </h3>
                            {students.length > 0 && (
                                <span className="ml-auto px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                                    {students.length} alumnos
                                </span>
                            )}
                        </div>

                        <List
                            headers={tableHeaders}
                            items={students}
                            renderRow={renderStudentRow}
                            actions={renderStudentActions}
                            isLoading={isLoading}
                            error={error?.message}
                            emptyMessage="No hay estudiantes inscritos en tu grupo."
                            emptyIcon="group_off"
                        />
                    </div>
        </PageShell>
    );
};

export default TeacherStudents;
