// client/src/hooks/useAdminQueries.js
// Hooks de TanStack Query para datos del administrador

import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminService from '../services/AdminService';

// El catálogo de juegos vive en useGamesQueries (compartido con el maestro).

// ── Query Keys ────────────────────────────────────────────────────────────────
export const adminKeys = {
    overview: () => ['admin', 'overview'],
    students: () => ['admin', 'students'],
    teachers: () => ['admin', 'teachers'],
    groups: () => ['admin', 'groups'],
};

// ── Fetchers ──────────────────────────────────────────────────────────────────
const fetchAdminOverview = () => AdminService.getAdminDashboard();
const fetchAdminStudents = () => AdminService.getStudents();
const fetchAdminTeachers = () => AdminService.getTeachers();
const fetchAdminGroups = () => AdminService.getGroups();

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAdminOverviewQuery() {
    return useQuery({
        queryKey: adminKeys.overview(),
        queryFn: fetchAdminOverview,
    });
}

export function useAdminStudentsQuery() {
    return useQuery({
        queryKey: adminKeys.students(),
        queryFn: fetchAdminStudents,
    });
}

export function useAdminTeachersQuery() {
    return useQuery({
        queryKey: adminKeys.teachers(),
        queryFn: fetchAdminTeachers,
    });
}

export function useAdminGroupsQuery() {
    return useQuery({
        queryKey: adminKeys.groups(),
        queryFn: fetchAdminGroups,
    });
}

/**
 * Hook para invalidar manualmente datos del admin (botón "Actualizar").
 */
export function useAdminInvalidate() {
    const queryClient = useQueryClient();
    return {
        reloadOverview: () => queryClient.invalidateQueries({ queryKey: adminKeys.overview() }),
        reloadStudents: () => queryClient.invalidateQueries({ queryKey: adminKeys.students() }),
        reloadTeachers: () => queryClient.invalidateQueries({ queryKey: adminKeys.teachers() }),
        reloadGroups: () => queryClient.invalidateQueries({ queryKey: adminKeys.groups() }),
    };
}
