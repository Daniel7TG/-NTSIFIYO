// client/src/hooks/useLeaderboardQueries.js
// Hook para la tabla de puntuaciones (GET /api/leaderboard, paginado).

import { useQuery, useQueryClient } from '@tanstack/react-query';
import ActivityApiService from '../services/ActivityApiService';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const leaderboardKeys = {
    all: () => ['leaderboard'],
    page: (page, size, userType) => ['leaderboard', { page, size, userType: userType || null }],
};

// ── Fetcher ───────────────────────────────────────────────────────────────────
async function fetchLeaderboard(params) {
    const result = await ActivityApiService.getLeaderboard(params);
    if (!result.success) throw new Error(result.error || 'Error al cargar las puntuaciones.');
    return result; // { data: LeaderboardRow[], currentUser, page: {...} }
}

/**
 * Puntuaciones paginadas. El backend elige la tabla según el tipo del usuario
 * autenticado; `userType` solo lo usan maestro/admin.
 *
 * @param {{ page?: number, size?: number, userType?: 'STUDENT'|'VISITOR', enabled?: boolean }} params
 */
export function useLeaderboardQuery({ page = 0, size = 20, userType, enabled = true } = {}) {
    return useQuery({
        queryKey: leaderboardKeys.page(page, size, userType),
        queryFn:  () => fetchLeaderboard({ page, size, userType }),
        enabled,
        // Mantiene la página anterior visible mientras llega la siguiente (evita parpadeo).
        placeholderData: (previous) => previous,
        staleTime: 60 * 1000,
    });
}

/** Invalida todas las páginas de la tabla. */
export function useLeaderboardInvalidate() {
    const queryClient = useQueryClient();
    return {
        reloadLeaderboard: () => queryClient.invalidateQueries({ queryKey: leaderboardKeys.all() }),
    };
}
