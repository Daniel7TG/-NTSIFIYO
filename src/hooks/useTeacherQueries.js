// client/src/hooks/useTeacherQueries.js
// Hooks de TanStack Query para datos del maestro

import { useQuery, useQueryClient } from '@tanstack/react-query';
import ActivityApiService from '../services/ActivityApiService';
import GroupService from '../services/GroupService';
import AdminService from '../services/AdminService';
import { gamesKeys } from './useGamesQueries';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const teacherKeys = {
    group:       () => ['teacher', 'group'],
    dashboard:   () => ['teacher', 'dashboard'],
    instances:   () => ['teacher', 'instances'],
    assignments: () => ['teacher', 'assignments'],
    students:    () => ['teacher', 'students'],
    reports:     (filters) => ['teacher', 'reports', filters],
};

const groupQueryOptions = () => ({
    queryKey: teacherKeys.group(),
    queryFn: () => GroupService.getMyGroup(),
});

// ── Fetchers ──────────────────────────────────────────────────────────────────
export async function fetchTeacherDashboard(group) {
    const { groupId, grade } = group;
    if (groupId === null) {
        return { totalStudents: 0, activeAssignments: [], alertStudents: [], completeStudents: [], groupId: null, grade: null, noGroup: true };
    }
    const result = await ActivityApiService.getTeacherDashboard(groupId);
    if (!result.success) throw new Error(result.error || 'Error al cargar el dashboard.');
    return { ...result.data, groupId, grade, noGroup: false };
}

/** Obtiene las instancias asignadas al grupo del teacher. */
export async function fetchTeacherInstances(group) {
    if (group.groupId === null) return [];
    const instData = await ActivityApiService.getGroupInstances();
    if (!instData.success) throw new Error(instData.error || 'Error al cargar las actividades del grupo.');
    return instData.data || [];
}

export async function fetchTeacherAssignments(group) {
    const { groupId, grade } = group;
    if (groupId === null) {
        return { activities: [], groupId: null, grade: null, noGroup: true };
    }
    const result = await ActivityApiService.getActiveAssignments(groupId, true);
    if (!result.success) throw new Error(result.error || 'Error al cargar las asignaciones.');
    return { activities: result.data || [], groupId, grade, noGroup: false };
}

async function fetchTeacherStudents() {
    try {
        return await AdminService.getMyGroupStudents();
    } catch {
        throw new Error('Error al obtener los estudiantes del grupo.');
    }
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useTeacherGroupQuery() {
    return useQuery(groupQueryOptions());
}

export function useTeacherDashboardQuery() {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: teacherKeys.dashboard(),
        queryFn: async () => fetchTeacherDashboard(await queryClient.fetchQuery(groupQueryOptions())),
    });
}

/** Query de instancias asignadas (específica del teacher). */
export function useTeacherInstancesQuery() {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: teacherKeys.instances(),
        queryFn: async () => fetchTeacherInstances(await queryClient.fetchQuery(groupQueryOptions())),
        staleTime: 2 * 60 * 1000,
        gcTime:    10 * 60 * 1000,
    });
}

export function useTeacherAssignmentsQuery() {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: teacherKeys.assignments(),
        queryFn: async () => fetchTeacherAssignments(await queryClient.fetchQuery(groupQueryOptions())),
    });
}

export function useTeacherStudentsQuery() {
    return useQuery({
        queryKey: teacherKeys.students(),
        queryFn: fetchTeacherStudents,
    });
}

/**
 * Hook para invalidar consultas del maestro (botones "Actualizar").
 */
export function useTeacherInvalidate() {
    const queryClient = useQueryClient();
    const reloadWithGroup = async (queryKey) => {
        await queryClient.invalidateQueries({ queryKey: teacherKeys.group(), refetchType: 'none' });
        return queryClient.invalidateQueries({ queryKey });
    };
    const reloadInstances = () => Promise.all([
        queryClient.invalidateQueries({ queryKey: teacherKeys.group() }),
        queryClient.invalidateQueries({ queryKey: teacherKeys.instances() }),
        queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard() }),
        queryClient.invalidateQueries({ queryKey: teacherKeys.assignments() }),
    ]);
    return {
        reloadDashboard:   () => reloadWithGroup(teacherKeys.dashboard()),
        reloadInstances,
        // El catálogo de juegos vive bajo la key ['games'] (useGamesQueries)
        reloadResources:   () => {
            reloadInstances();
            queryClient.invalidateQueries({ queryKey: gamesKeys.all() });
        },
        reloadAssignments: () => reloadWithGroup(teacherKeys.assignments()),
        reloadStudents:    () => queryClient.invalidateQueries({ queryKey: teacherKeys.students() }),
    };
}
