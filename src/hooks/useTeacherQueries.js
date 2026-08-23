// client/src/hooks/useTeacherQueries.js
// Hooks de TanStack Query para datos del maestro

import { useQuery, useQueryClient } from '@tanstack/react-query';
import ActivityApiService from '../services/ActivityApiService';
import AuthService from '../services/AuthService';
import AdminService from '../services/AdminService';
import { gamesKeys } from './useGamesQueries';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const teacherKeys = {
    dashboard:   () => ['teacher', 'dashboard'],
    instances:   () => ['teacher', 'instances'],
    assignments: () => ['teacher', 'assignments'],
    students:    () => ['teacher', 'students'],
};

// ── Shared: resolve groupId ───────────────────────────────────────────────────
async function resolveGroupId() {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser?.grade) return currentUser.grade;
    try {
        const instResult = await ActivityApiService.getGroupInstances();
        if (instResult.success && instResult.data.length > 0) {
            const id = instResult.data[0].group?.id || instResult.data[0].groupId;
            if (id) return id;
        }
    } catch (e) {
        console.error('Error resolving groupId:', e);
    }
    return null;
}

// ── Fetchers ──────────────────────────────────────────────────────────────────
async function fetchTeacherDashboard() {
    const gId = await resolveGroupId();
    if (!gId) {
        return { totalStudents: 0, activeAssignments: [], alertStudents: [], completeStudents: [], groupId: null, noGroup: true };
    }
    const result = await ActivityApiService.getTeacherDashboard(gId);
    if (!result.success) throw new Error(result.error || 'Error al cargar el dashboard.');
    return { ...result.data, groupId: gId };
}

/** Obtiene las instancias asignadas al grupo del teacher. */
async function fetchTeacherInstances() {
    const instData = await ActivityApiService.getGroupInstances();
    return instData.success ? (instData.data || []) : [];
}

async function fetchTeacherAssignments() {
    const gId = await resolveGroupId();
    if (!gId) {
        return { activities: [], groupId: null, noGroup: true };
    }
    const result = await ActivityApiService.getActiveAssignments(gId, true);
    if (!result.success) throw new Error(result.error || 'Error al cargar las asignaciones.');
    return { activities: result.data, groupId: gId };
}

async function fetchTeacherStudents() {
    try {
        return await AdminService.getMyGroupStudents();
    } catch {
        throw new Error('Error al obtener los estudiantes del grupo.');
    }
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useTeacherDashboardQuery() {
    return useQuery({
        queryKey: teacherKeys.dashboard(),
        queryFn: fetchTeacherDashboard,
    });
}

/** Query de instancias asignadas (específica del teacher). */
export function useTeacherInstancesQuery() {
    return useQuery({
        queryKey: teacherKeys.instances(),
        queryFn:  fetchTeacherInstances,
        staleTime: 2 * 60 * 1000,
        gcTime:    10 * 60 * 1000,
    });
}

export function useTeacherAssignmentsQuery() {
    return useQuery({
        queryKey: teacherKeys.assignments(),
        queryFn: fetchTeacherAssignments,
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
    return {
        reloadDashboard:   () => queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard() }),
        reloadInstances:   () => queryClient.invalidateQueries({ queryKey: teacherKeys.instances() }),
        // El catálogo de juegos vive bajo la key ['games'] (useGamesQueries)
        reloadResources:   () => {
            queryClient.invalidateQueries({ queryKey: teacherKeys.instances() });
            queryClient.invalidateQueries({ queryKey: gamesKeys.all() });
        },
        reloadAssignments: () => queryClient.invalidateQueries({ queryKey: teacherKeys.assignments() }),
        reloadStudents:    () => queryClient.invalidateQueries({ queryKey: teacherKeys.students() }),
    };
}
