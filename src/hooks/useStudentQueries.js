// client/src/hooks/useStudentQueries.js
// Hooks de TanStack Query para datos del estudiante

import { useQuery, useQueryClient } from '@tanstack/react-query';
import ActivityApiService from '../services/ActivityApiService';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const studentKeys = {
    dashboard: () => ['student', 'dashboard'],
    assignments: (page) => ['student', 'assignments', page],
};

// ── Fetchers ──────────────────────────────────────────────────────────────────
async function fetchStudentDashboard() {
    const result = await ActivityApiService.getStudentDashboard();
    if (!result.success) throw new Error(result.error || 'Error al cargar el dashboard.');
    return result.data;
}

async function fetchStudentAssignments(page = 0) {
    const result = await ActivityApiService.getStudentVariedActivities(page);
    if (!result.success) throw new Error(result.error || 'Error al cargar las asignaciones.');
    const raw = result.data;
    if (Array.isArray(raw)) {
        return { activities: raw, pageData: { totalPages: 1, number: 0, first: true, last: true } };
    }
    return {
        activities: raw.content || [],
        pageData: {
            totalPages: raw.totalPages || 0,
            number: raw.number || 0,
            first: raw.first !== undefined ? raw.first : true,
            last: raw.last !== undefined ? raw.last : true,
        },
    };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Hook para el dashboard del estudiante.
 * Se carga una sola vez y se mantiene en caché hasta que el usuario
 * llame a invalidateQueries (botón "Actualizar").
 */
export function useStudentDashboardQuery() {
    return useQuery({
        queryKey: studentKeys.dashboard(),
        queryFn: fetchStudentDashboard,
    });
}

/**
 * Hook para las asignaciones del estudiante con paginación.
 * La página 0 se guarda en caché. Cambiar de página bajo demanda.
 */
export function useStudentAssignmentsQuery(page = 0) {
    return useQuery({
        queryKey: studentKeys.assignments(page),
        queryFn: () => fetchStudentAssignments(page),
        keepPreviousData: true,
    });
}

/**
 * Hook para invalidar manualmente el dashboard (botón "Actualizar").
 */
export function useStudentInvalidate() {
    const queryClient = useQueryClient();
    return {
        reloadDashboard: () => queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() }),
        reloadAssignments: (page = 0) => queryClient.invalidateQueries({ queryKey: studentKeys.assignments(page) }),
    };
}
