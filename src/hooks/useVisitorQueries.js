// client/src/hooks/useVisitorQueries.js
// Hooks de TanStack Query para datos del visitante

import { useQuery, useQueryClient } from '@tanstack/react-query';
import ActivityApiService from '../services/ActivityApiService';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const visitorKeys = {
    dashboard: () => ['visitor', 'dashboard'],
};

// ── Fetchers ──────────────────────────────────────────────────────────────────
async function fetchVisitorDashboard() {
    const result = await ActivityApiService.getVisitorDashboard();
    if (!result.success) throw new Error(result.error || 'Error al cargar el dashboard.');
    return result.data;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Hook para el dashboard del visitante.
 * Se carga una sola vez y se mantiene en caché hasta que el usuario
 * llame a invalidateQueries (botón "Actualizar").
 */
export function useVisitorDashboardQuery() {
    return useQuery({
        queryKey: visitorKeys.dashboard(),
        queryFn: fetchVisitorDashboard,
    });
}

/**
 * Hook para invalidar manualmente el dashboard (botón "Actualizar").
 */
export function useVisitorInvalidate() {
    const queryClient = useQueryClient();
    return {
        reloadDashboard: () => queryClient.invalidateQueries({ queryKey: visitorKeys.dashboard() }),
    };
}
